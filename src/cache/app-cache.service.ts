import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Cache } from 'cache-manager';
import { CacheKeys, CacheVersionKeys } from './cache.keys';

@Injectable()
export class AppCacheService {
  private readonly logger = new Logger(AppCacheService.name);
  private readonly enabled: boolean;
  private readonly inflight = new Map<string, Promise<unknown>>();

  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly configService: ConfigService,
  ) {
    this.enabled = configService.get<string>('REDIS_ENABLED', 'true') !== 'false';
  }

  ttlMs(envKey: string, defaultSeconds: number): number {
    const fallback = this.configService.get<string>('CACHE_TTL_SECONDS', String(defaultSeconds));
    return Number(this.configService.get<string>(envKey, fallback)) * 1000;
  }

  listTtlMs(): number {
    return this.ttlMs('CACHE_TTL_LIST_SECONDS', 120);
  }

  private versionTtlMs(): number {
    const days = Number(this.configService.get<string>('CACHE_VERSION_TTL_DAYS', '30'));
    return days * 24 * 60 * 60 * 1000;
  }

  async getOrSet<T>(key: string, ttlMs: number, factory: () => Promise<T>) {
    if (!this.enabled) {
      return factory();
    }

    const hit = await this.cache.get<T>(key);
    if (hit !== undefined && hit !== null) {
      return hit;
    }

    const pending = this.inflight.get(key) as Promise<T> | undefined;
    if (pending) {
      return pending;
    }

    const load = (async () => {
      const cached = await this.cache.get<T>(key);
      if (cached !== undefined && cached !== null) {
        return cached;
      }

      const value = await factory();
      await this.cache.set(key, value, ttlMs);
      return value;
    })();

    this.inflight.set(key, load);

    try {
      return await load;
    } finally {
      if (this.inflight.get(key) === load) {
        this.inflight.delete(key);
      }
    }
  }

  async getVersion(versionKey: string) {
    if (!this.enabled) {
      return String(Date.now());
    }
    const version = await this.cache.get<string>(versionKey);
    if (version !== undefined && version !== null) {
      return version;
    }
    const initial = String(Date.now());
    await this.cache.set(versionKey, initial, this.versionTtlMs());
    return initial;
  }

  async bumpVersion(versionKey: string) {
    if (!this.enabled) {
      return;
    }
    const next = String(Date.now());
    await this.cache.set(versionKey, next, this.versionTtlMs());
    this.logger.debug(`Cache version bumped: ${versionKey} -> ${next}`);
  }

  async cachedAdminList<T>(
    resource: string,
    versionKey: string,
    query: unknown,
    factory: () => Promise<T>,
  ) {
    const version = await this.getVersion(versionKey);
    const key = CacheKeys.adminList(resource, version, query);
    return this.getOrSet(key, this.listTtlMs(), factory);
  }

  async cachedUserList<T>(
    resource: string,
    userId: string,
    versionKey: string,
    query: unknown,
    factory: () => Promise<T>,
  ) {
    const version = await this.getVersion(versionKey);
    const key = CacheKeys.userList(resource, userId, version, query);
    return this.getOrSet(key, this.listTtlMs(), factory);
  }

  async getParkingAreasVersion() {
    return this.getVersion(CacheVersionKeys.parkingAreas);
  }

  async invalidateParkingAreasList() {
    await this.bumpVersion(CacheVersionKeys.parkingAreas);
  }

  async invalidateUserVehicles(userId: string) {
    await this.del(CacheKeys.userVehicles(userId));
  }

  async invalidateVehicleCaches(userId?: string) {
    if (userId) {
      await this.invalidateUserVehicles(userId);
    }
    await this.invalidateAdminVehicles();
  }

  async invalidateUserProfile(userId: string) {
    await this.del(CacheKeys.userProfile(userId));
  }

  async invalidateAdminReservations() {
    await this.bumpVersion(CacheVersionKeys.admin.reservations);
  }

  async invalidateUserReservations(userId: string) {
    await this.bumpVersion(CacheVersionKeys.user.reservations(userId));
  }

  async invalidateAdminUsers() {
    await this.bumpVersion(CacheVersionKeys.admin.users);
  }

  async invalidateAdminVehicles() {
    await this.bumpVersion(CacheVersionKeys.admin.vehicles);
  }

  async invalidateAdminParkingHistory() {
    await this.bumpVersion(CacheVersionKeys.admin.parkingHistory);
  }

  async invalidateUserParkingHistory(userId: string) {
    await this.bumpVersion(CacheVersionKeys.user.parkingHistory(userId));
  }

  async invalidateAdminPayments() {
    await this.bumpVersion(CacheVersionKeys.admin.payments);
  }

  async invalidateUserPayments(userId: string) {
    await this.bumpVersion(CacheVersionKeys.user.payments(userId));
  }

  async invalidateAdminRfid() {
    await this.bumpVersion(CacheVersionKeys.admin.rfid);
  }

  async invalidateUserRfid(userId: string) {
    await this.bumpVersion(CacheVersionKeys.user.rfid(userId));
  }

  async invalidateAdminRfidRequests() {
    await this.bumpVersion(CacheVersionKeys.admin.rfidRequests);
  }

  async invalidateUserRfidRequests(userId: string) {
    await this.bumpVersion(CacheVersionKeys.user.rfidRequests(userId));
  }

  private async del(key: string) {
    if (!this.enabled) {
      return;
    }
    await this.cache.del(key);
  }
}
