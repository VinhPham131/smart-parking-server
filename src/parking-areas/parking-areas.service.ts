import { BadRequestException, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ParkingAreasRepository } from './parking-areas.repository';
import { CreateParkingAreaDto } from './dto/create-parking-areas.dto';
import { ParkingAreaQuerry } from './dto/list-parking-area-querry.dto';
import { AppCacheService } from 'src/cache/app-cache.service';
import { CacheKeys } from 'src/cache/cache.keys';
import { ParkingAreaChangedPayload } from 'src/gateways/parking.gateway';

@Injectable()
export class ParkingAreasService {
    constructor(
        private readonly parkingAreasRepository: ParkingAreasRepository,
        private readonly appCache: AppCacheService,
        private readonly eventEmitter: EventEmitter2,
    ) { }

    private emitParkingAreaChanged(
        action: ParkingAreaChangedPayload['action'],
        areaId: string,
    ): void {
        this.eventEmitter.emit('parking-area.changed', { action, areaId });
    }

    private async invalidateParkingAreasCache() {
        await this.appCache.invalidateParkingAreasList();
    }

    async findAllParkingAreas() {
        return this.parkingAreasRepository.findAllParkingAreas();
    }

    async findAllParkingAreasByFilter(filter: ParkingAreaQuerry) {
        const page = filter.page ?? 1;
        const limit = filter.limit ?? 100;
        const queryKey = { ...filter, page, limit };
        const version = await this.appCache.getParkingAreasVersion();

        return this.appCache.getOrSet(
            CacheKeys.parkingAreasList(version, queryKey),
            this.appCache.ttlMs('CACHE_TTL_PARKING_AREAS_SECONDS', 120),
            () =>
                this.parkingAreasRepository.findAllParkingAreasByFilter(
                    filter,
                    page,
                    limit,
                ),
        );
    }

    async findParkingAreaByName(parkingAreaName: string) {
        return this.parkingAreasRepository.findParkingAreaByName(parkingAreaName);
    }

    async findParkingAreaById(parkingAreaId: string) {
        return this.parkingAreasRepository.findParkingAreaById(parkingAreaId);
    }

    async occupySlot(parkingAreaId: string) {
        const parkingArea = await this.parkingAreasRepository.findParkingAreaById(parkingAreaId);
        if (!parkingArea) {
            throw new BadRequestException("Parking area not found");
        }
        if (parkingArea.available_slots <= 0) {
            throw new BadRequestException("Parking area is full");
        }   
        const result = await this.parkingAreasRepository.occupySlot(parkingAreaId);
        await this.invalidateParkingAreasCache();
        this.emitParkingAreaChanged('slot-occupied', parkingAreaId);
        return result;
    }

    async releaseSlot(parkingAreaId: string) {
        const result = await this.parkingAreasRepository.releaseSlot(parkingAreaId);
        await this.invalidateParkingAreasCache();
        this.emitParkingAreaChanged('slot-released', parkingAreaId);
        return result;
    }

    async updateSlotsQuantity(parkingAreaId: string, slotsQuantity: number) {
        const result = await this.parkingAreasRepository.updateSlotsQuantity(parkingAreaId, slotsQuantity);
        await this.invalidateParkingAreasCache();
        this.emitParkingAreaChanged('slots-updated', parkingAreaId);
        return result;
    }

    async updateMaintenanceSlots(parkingAreaId: string, maintenanceSlots: number) {
        const parkingArea = await this.parkingAreasRepository.findParkingAreaById(parkingAreaId);
        if (!parkingArea) {
            throw new BadRequestException("Parking area not found");
        }
        const previousMaintenanceSlots = parkingArea.maintenance_slots;
        if (maintenanceSlots > parkingArea.slots_quantity) {
            throw new BadRequestException("Maintenance slots cannot be greater than slots quantity");
        }

        if (maintenanceSlots === 0) {
            return this.parkingAreasRepository.updateMaintenanceSlots(parkingAreaId, maintenanceSlots, parkingArea.available_slots + previousMaintenanceSlots);
        }

        const availableSlots = parkingArea.available_slots - (maintenanceSlots - previousMaintenanceSlots);
        const result = await this.parkingAreasRepository.updateMaintenanceSlots(
            parkingAreaId,
            maintenanceSlots,
            availableSlots,
        );
        await this.invalidateParkingAreasCache();
        this.emitParkingAreaChanged('maintenance-updated', parkingAreaId);
        return result;
    }

    async createParkingArea(dto: CreateParkingAreaDto) {
        const result = await this.parkingAreasRepository.createParkingArea(dto);
        await this.invalidateParkingAreasCache();
        this.emitParkingAreaChanged('created', result.id);
        return result;
    }

    async deactivateParkingArea(parkingAreaId: string) {
        const result = await this.parkingAreasRepository.deactivateParkingArea(parkingAreaId);
        await this.invalidateParkingAreasCache();
        this.emitParkingAreaChanged('deactivated', parkingAreaId);
        return result;
    }

    async activateParkingArea(parkingAreaId: string) {
        const result = await this.parkingAreasRepository.activateParkingArea(parkingAreaId);
        await this.invalidateParkingAreasCache();
        this.emitParkingAreaChanged('activated', parkingAreaId);
        return result;
    }

    async countAvailableSlots(parkingAreaId: string) {
        return this.parkingAreasRepository.countAvailableSlots(parkingAreaId);
    }

    async incrementReservedSlots(parkingAreaId: string) {
        const parkingArea = await this.parkingAreasRepository.findParkingAreaById(parkingAreaId);
        if (!parkingArea) {
            throw new BadRequestException('Parking area not found');
        }
        if (parkingArea.available_slots <= 0) {
            throw new BadRequestException('Parking area has no available slots to reserve');
        }
        const result = await this.parkingAreasRepository.incrementReservedSlots(parkingAreaId);
        if (!result.affected) {
            throw new BadRequestException('Parking area has no available slots to reserve');
        }
        await this.invalidateParkingAreasCache();
        this.emitParkingAreaChanged('reserved-incremented', parkingAreaId);
        return result;
    }

    async decrementReservedSlots(parkingAreaId: string) {
        const result = await this.parkingAreasRepository.decrementReservedSlots(parkingAreaId);
        await this.invalidateParkingAreasCache();
        this.emitParkingAreaChanged('reserved-decremented', parkingAreaId);
        return result;
    }
}
