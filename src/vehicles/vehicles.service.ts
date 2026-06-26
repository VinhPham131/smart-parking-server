import { BadRequestException, Injectable } from '@nestjs/common';
import { VehiclesRepository } from './vehicles.repository';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { VehicleListQuery } from './dto/vehicle-list-querry.dto';
import { AppCacheService } from 'src/cache/app-cache.service';
import { CacheKeys, CacheVersionKeys } from 'src/cache/cache.keys';

@Injectable()
export class VehiclesService {
    constructor(
        private vehiclesRepository: VehiclesRepository,
        private readonly appCache: AppCacheService,
    ) { }
    
    async findVehicleByUserId(userId: string) {
        return this.appCache.getOrSet(
            CacheKeys.userVehicles(userId),
            this.appCache.ttlMs('CACHE_TTL_MY_VEHICLES_SECONDS', 120),
            () => this.vehiclesRepository.findVehicleByUserId(userId),
        );
    }

    async findVehiclesByUserName(userName: string) {
        return await this.vehiclesRepository.findVehiclesByUserName(userName);
    }

    async createVehicle(vehicleDto: CreateVehicleDto, userId: string) {
        const existingVehicle = await this.vehiclesRepository.findByLicensePlate(vehicleDto.license_plate);
        if (existingVehicle) {
            throw new BadRequestException("Vehicle with this license plate already exists.");
        }
        const vehicle = await this.vehiclesRepository.createVehicle(vehicleDto, userId);
        await this.appCache.invalidateVehicleCaches(userId);
        return vehicle;
    }

    async findVehiclesWithFilters(query: VehicleListQuery) {
        return this.appCache.cachedAdminList(
            'vehicles',
            CacheVersionKeys.admin.vehicles,
            query,
            () => this.vehiclesRepository.findVehiclesWithFilters(query),
        );
    }

    async findAllVehicles() {
        return await this.vehiclesRepository.findAllVehicles();
    }

    async updateVehicle(id: string, vehicleDto: Partial<CreateVehicleDto>) {
        const existingVehicle = await this.vehiclesRepository.findOne({ where: { id } });
        if (!existingVehicle) {
            throw new BadRequestException("Vehicle not found.");
        }
        if (vehicleDto.license_plate && vehicleDto.license_plate !== existingVehicle.license_plate) {
            const vehicleWithSamePlate = await this.vehiclesRepository.findByLicensePlate(vehicleDto.license_plate);
            if (vehicleWithSamePlate) {
                throw new BadRequestException("Another vehicle with this license plate already exists.");
            }
        }
        const updated = await this.vehiclesRepository.updateVehicle(id, vehicleDto);
        const owner = await this.vehiclesRepository.findOne({
            where: { id },
            relations: ['user'],
        });
        if (owner?.user?.id) {
            await this.appCache.invalidateVehicleCaches(owner.user.id);
        } else {
            await this.appCache.invalidateVehicleCaches();
        }
        return updated;
    }

    async deleteVehicle(id: string) {
        const owner = await this.vehiclesRepository.findOne({
            where: { id },
            relations: ['user'],
        });
        const deleted = await this.vehiclesRepository.deleteVehicle(id);
        if (owner?.user?.id) {
            await this.appCache.invalidateVehicleCaches(owner.user.id);
        } else {
            await this.appCache.invalidateVehicleCaches();
        }
        return deleted;
    }
}
