import { BadRequestException, Injectable } from '@nestjs/common';
import { ParkingHistoryRepository } from './parking-history.repository';
import { ParkingHistoryListQuery } from './dto/parking-history-list-query.dto';
import { ParkingSessionsRepository } from 'src/parking-sessions/parking-sessions.repository';
import { VehiclesRepository } from '../vehicles/vehicles.repository';
import { MyParkingHistoryListQuery } from './dto/my-parking-history-list-querry.dto';
import { PaymentMethod } from 'src/constants/config';
import { AppCacheService } from 'src/cache/app-cache.service';
import { CacheVersionKeys } from 'src/cache/cache.keys';

@Injectable()
export class ParkingHistoryService {
    constructor(
        private parkingHistoryRepository: ParkingHistoryRepository,
        private vehiclesRepository: VehiclesRepository,
        private parkingSessionRepository: ParkingSessionsRepository,
        private readonly appCache: AppCacheService,
    ) { }

    private async invalidateParkingHistoryCaches(userId?: string) {
        await this.appCache.invalidateAdminParkingHistory();
        if (userId) {
            await this.appCache.invalidateUserParkingHistory(userId);
        }
    }

    async invalidateCachesForUser(userId: string) {
        await this.invalidateParkingHistoryCaches(userId);
    }

    async invalidateAdminCaches() {
        await this.appCache.invalidateAdminParkingHistory();
    }

    async findParkingHistoryByUserId(userId: string, query: MyParkingHistoryListQuery) {
        return this.appCache.cachedUserList(
            'parking-history',
            userId,
            CacheVersionKeys.user.parkingHistory(userId),
            query,
            () => this.parkingHistoryRepository.findParkingHistoryByUserIdWithFilters(userId, query),
        );
    }

    async createParkingHistory(parkingSessionId: string, vehicleId: string, paymentMethod: PaymentMethod) {
        const history = await this.parkingHistoryRepository.createParkingHistory(
            parkingSessionId,
            vehicleId,
            paymentMethod,
        );
        const vehicle = await this.vehiclesRepository.findOne({
            where: { id: vehicleId },
            relations: ['user'],
        });
        await this.invalidateParkingHistoryCaches(vehicle?.user?.id);
        return history;
    }

    async findParkingHistoryById(id: string) {
        const history = await this.parkingHistoryRepository.findParkingHistoryById(id);

        if (!history) {
            throw new BadRequestException('Parking history not found');
        }
        return history;
    }

    async findAllParkingHistories(query: ParkingHistoryListQuery) {
        return this.appCache.cachedAdminList(
            'parking-history',
            CacheVersionKeys.admin.parkingHistory,
            query,
            () => this.parkingHistoryRepository.findWithFilters(query),
        );
    }
}
