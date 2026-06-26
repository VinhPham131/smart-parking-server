import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { RfidRequestsRepository } from './rfid-requests.repository';
import { RfidRequestQuerry } from './dto/list-rfid-request-querry.dto';
import { RfidRequestStatus } from 'src/constants/config';
import { RfidService } from 'src/rfid/rfid.service';
import { AppCacheService } from 'src/cache/app-cache.service';
import { CacheVersionKeys } from 'src/cache/cache.keys';
import { VehiclesRepository } from 'src/vehicles/vehicles.repository';

@Injectable()
export class RfidRequestsService {
    constructor(
        private readonly rfidRequestsRepository: RfidRequestsRepository,
        private readonly rfidService: RfidService,
        private readonly appCache: AppCacheService,
        private readonly vehiclesRepository: VehiclesRepository,
    ) { }

    private async invalidateRfidRequestCaches(userId?: string) {
        await this.appCache.invalidateAdminRfidRequests();
        if (userId) {
            await this.appCache.invalidateUserRfidRequests(userId);
        }
    }

    async createRfidRequest(vehicleId: string) {
        const vehicle = await this.vehiclesRepository.findOne({
            where: { id: vehicleId },
            relations: ['user'],
        });
        const request = await this.rfidRequestsRepository.createRfidRequest(vehicleId);
        await this.invalidateRfidRequestCaches(vehicle?.user?.id);
        return request;
    }

    async findAllRfidRequestsWithFilters(query: RfidRequestQuerry) {
        return this.appCache.cachedAdminList(
            'rfid-requests',
            CacheVersionKeys.admin.rfidRequests,
            query,
            () => this.rfidRequestsRepository.findAllRfidRequestsWithFilters(query),
        );
    }

    async findMyRfidRequestsWithFilters(userId: string, status: RfidRequestStatus) {
        return this.appCache.cachedUserList(
            'rfid-requests',
            userId,
            CacheVersionKeys.user.rfidRequests(userId),
            { status: status ?? null },
            () => this.rfidRequestsRepository.findMyRfidRequestsWithFilters(userId, status),
        );
    }

    async updateRfidRequestStatus(id: string, status: RfidRequestStatus) {
        if (status === RfidRequestStatus.APPROVED) {
            const rfidRequest = await this.rfidRequestsRepository.findRfidRequestById(id);
            if (!rfidRequest) {
                throw new NotFoundException('Rfid request not found');
            }
            const vehicleId = rfidRequest.vehicle.id;
            const rfid = await this.rfidService.findFirstAvailableRfid();
            if (!rfid) {
                throw new BadRequestException('No available rfid found, please try again later');
            }
            await this.rfidService.assignRfidToVehicle(rfid.id, vehicleId);
        }
        await this.rfidRequestsRepository.updateRfidRequestStatus(id, status);

        const rfidRequest = await this.rfidRequestsRepository.findRfidRequestById(id);
        const userId = rfidRequest?.vehicle?.user?.id;
        await this.invalidateRfidRequestCaches(userId);
        if (status === RfidRequestStatus.APPROVED && userId) {
            await this.appCache.invalidateVehicleCaches(userId);
        }
    }
}
