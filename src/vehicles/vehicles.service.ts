import { BadRequestException, Injectable } from '@nestjs/common';
import { VehiclesRepository } from './vehicles.repository';
import { CreateVehicleDto } from './dto/create-vehicle.dto';

@Injectable()
export class VehiclesService {
    constructor(private vehiclesRepository: VehiclesRepository) { }
    
    async findVehicleByUserId(userId: string) {
        return await this.vehiclesRepository.findVehicleByUserId(userId);
    }

    async createVehicle(vehicleDto: CreateVehicleDto, userId: string) {
        const existingVehicle = await this.vehiclesRepository.findByLicensePlate(vehicleDto.license_plate);
        if (existingVehicle) {
            throw new BadRequestException("Vehicle with this license plate already exists.");
        }
        return await this.vehiclesRepository.createVehicle(vehicleDto, userId);
    }
}
