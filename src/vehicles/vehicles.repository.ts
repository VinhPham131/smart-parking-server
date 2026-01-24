import { DataSource, Repository } from "typeorm";
import { InjectDataSource } from "@nestjs/typeorm";
import { Vehicle } from "./entities/vehicles.entity";
import { CreateVehicleDto } from "./dto/create-vehicle.dto";

export class VehiclesRepository extends Repository<Vehicle> {
    constructor(@InjectDataSource() private dataSource: DataSource) {
        super(Vehicle, dataSource.createEntityManager());
    }

    async findVehicleByUserId(userId: string) {
        return await this.find({ where: { user: { id: userId } } });
    }

    async createVehicle(vehicleDto: CreateVehicleDto, userId: string) {
        const vehicle = this.create({
            ...vehicleDto,
            user: { id: userId }
        });

        return await this.save(vehicle);
    }

    async findByLicensePlate(licensePlate: string) {
        return await this.findOne({ where: { license_plate: licensePlate } });
    }
}