import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { RfidRepository } from "./rfid.repository";
import { PaymentStatus, PaymentType, RfidType } from "src/constants/config";
import { UpdateRfidDto } from "./dto/update-rfid.dto";
import { RfidListQuery } from "./dto/rfid-list-querry.dto";
import { MONTHLY_FEE } from "src/constants/constants";
import { PaymentsService } from "src/payments/payments.service";
import { UsersRepository } from "src/users/user.repository";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { AppCacheService } from "src/cache/app-cache.service";
import { CacheVersionKeys } from "src/cache/cache.keys";
import { VehiclesRepository } from "src/vehicles/vehicles.repository";

@Injectable()
export class RfidService {
    constructor(
        private rfidRepository: RfidRepository,
        private paymentsService: PaymentsService,
        private usersRepository: UsersRepository,
        private eventEmitter: EventEmitter2,
        private readonly appCache: AppCacheService,
        private readonly vehiclesRepository: VehiclesRepository,
    ) { }

    private async invalidateRfidCaches(userId?: string) {
        await this.appCache.invalidateAdminRfid();
        if (userId) {
            await this.appCache.invalidateUserRfid(userId);
        }
    }

    private async invalidateVehicleCachesForUser(userId?: string) {
        await this.appCache.invalidateVehicleCaches(userId);
    }

    async findRfidsWithFilters(query: RfidListQuery) {
        return this.appCache.cachedAdminList(
            'rfid',
            CacheVersionKeys.admin.rfid,
            query,
            () => this.rfidRepository.findRfidsWithFilters(query),
        );
    }

    async findRfidByRfidCode(rfid_code: string) {
        return await this.rfidRepository.findRfidByRfidCode(rfid_code);
    }

    async createRfid(rfid_code: string, type: RfidType) {
        const rfid = await this.rfidRepository.createRfid(rfid_code, type);
        await this.invalidateRfidCaches();
        return rfid;
    }

    async updateRfid(id: string, dto: UpdateRfidDto) {
        const existing = await this.rfidRepository.findOne({
            where: { id },
            relations: ['vehicle', 'vehicle.user'],
        });
        await this.rfidRepository.updateRfid(id, dto);
        await this.invalidateRfidCaches(existing?.vehicle?.user?.id);
        await this.invalidateVehicleCachesForUser(existing?.vehicle?.user?.id);
        if (dto.vehicle_id && dto.vehicle_id !== existing?.vehicle?.id) {
            const vehicle = await this.vehiclesRepository.findOne({
                where: { id: dto.vehicle_id },
                relations: ['user'],
            });
            await this.invalidateVehicleCachesForUser(vehicle?.user?.id);
        }
        return {
            message: 'Rfid updated successfully'
        };
    }

    async assignRfidToVehicle(rfidId: string, vehicleId: string) {
        const vehicle = await this.vehiclesRepository.findOne({
            where: { id: vehicleId },
            relations: ['user'],
        });
        const result = await this.rfidRepository.updateRfid(rfidId, { vehicle_id: vehicleId });
        await this.invalidateRfidCaches(vehicle?.user?.id);
        await this.invalidateVehicleCachesForUser(vehicle?.user?.id);
        return result;
    }

    async deleteRfid(id: string) {
        const existing = await this.rfidRepository.findOne({
            where: { id },
            relations: ['vehicle', 'vehicle.user'],
        });
        const result = await this.rfidRepository.deleteRfid(id);
        await this.invalidateRfidCaches(existing?.vehicle?.user?.id);
        await this.invalidateVehicleCachesForUser(existing?.vehicle?.user?.id);
        return result;
    }

    async findRfidByUserId(userId: string) {
        return this.appCache.cachedUserList(
            'rfid',
            userId,
            CacheVersionKeys.user.rfid(userId),
            {},
            () => this.rfidRepository.findRfidByUserId(userId),
        );
    }

    async updateRfidType(userId: string, type: RfidType) {
        const rfid = await this.rfidRepository.findRfidByUserId(userId);
        if (!rfid) {
            throw new NotFoundException('Rfid not found');
        }

        const user = await this.usersRepository.findUserById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        if (user.balance < MONTHLY_FEE) {
            this.eventEmitter.emit('notification.created', {
                userId: user.id,
                message: 'Payment failed for monthly subscription. Please check your balance.',
                metadata: {
                    title: 'Monthly subscription',
                    category: 'user',
                    userId: user.id,
                },
            });
            throw new BadRequestException('Insufficient balance');
        }
        await this.paymentsService.deductBalance(userId, MONTHLY_FEE, 'Monthly member subscription', PaymentType.SUBSCRIPTION);
        const issuedDate = new Date();
        issuedDate.setMonth(issuedDate.getMonth() + 1);
        const result = await this.rfidRepository.updateRfidType(userId, type, issuedDate);
        await this.invalidateRfidCaches(userId);
        await this.invalidateVehicleCachesForUser(userId);
        return result;
    }

    async findFirstAvailableRfid() {
        return this.rfidRepository.findFirstAvailableRfid();
    }

    async findAllRfids() {
        return this.rfidRepository.findAllRfids();
    }
}