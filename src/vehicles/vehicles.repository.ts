import { DataSource, Repository } from "typeorm";
import { InjectDataSource } from "@nestjs/typeorm";
import { Vehicle } from "./entities/vehicles.entity";
import { CreateVehicleDto } from "./dto/create-vehicle.dto";
import { NotFoundException } from "@nestjs/common";
import { VehicleListQuery } from "./dto/vehicle-list-querry.dto";
import { BaseRepository } from "src/common/pagination/base.repository";
import { toIlikePattern } from "src/common/utils/search.util";

export class VehiclesRepository extends Repository<Vehicle> {
    constructor(
        @InjectDataSource() private dataSource: DataSource,
        private baseRepository: BaseRepository,
    ) {
        super(Vehicle, dataSource.createEntityManager());
    }

    async findAllVehicles() {
        return await this.find({
            relations: ['user', 'rfid']
        });
    }

    async findVehicleById(id: string) {
        return await this.findOne({ where: { id }, relations: ['user', 'rfid'] });
    }

    async findVehiclesByUserName(userName: string) {
        const qb = this.dataSource.getRepository(Vehicle).createQueryBuilder('vehicle')
            .leftJoinAndSelect('vehicle.user', 'user')
            .leftJoinAndSelect('vehicle.rfid', 'rfid')
            .where('user.name = :userName', { userName });
        return await qb.getMany();
    }

    async findVehicleByUserId(userId: string) {
        const qb = this.dataSource.getRepository(Vehicle).createQueryBuilder('vehicle')
            .innerJoin('vehicle.user', 'user', 'user.id = :userId', { userId })
            .leftJoinAndSelect('vehicle.rfid', 'rfid')
            .select(
                [
                    'vehicle.id', 
                    'vehicle.license_plate', 
                    'vehicle.brand', 
                    'vehicle.color', 
                    'vehicle.created_at',
                    'rfid.id',
                    'rfid.rfid_code',
                    'rfid.type',
                    'rfid.issued_date',
                    'rfid.expired_date'
                ])
            .orderBy('vehicle.created_at', 'DESC');
        return await qb.getMany();
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

    async findVehicleWithUserByLicensePlate(licensePlate: string) {
        return await this.findOne({
            where: { license_plate: licensePlate },
            relations: ['user']
        });
    }

    async findVehiclesWithFilters(query: VehicleListQuery) {
        const { page, limit, is_has_rfid, keyword } = query;

        const qb = this.dataSource.getRepository(Vehicle).createQueryBuilder('vehicle')
            .leftJoinAndSelect('vehicle.user', 'user')
            .leftJoinAndSelect('vehicle.rfid', 'rfid')
            .select([
                'vehicle.id',
                'vehicle.license_plate',
                'vehicle.brand',
                'vehicle.color',
                'vehicle.created_at',
                'rfid.id',
                'rfid.rfid_code',
                'user.id',
                'user.name',
                'user.email',
            ]);

        if (is_has_rfid === true) {
            qb.andWhere('rfid.id IS NOT NULL');
        } else if (is_has_rfid === false) {
            qb.andWhere('rfid.id IS NULL');
        }

        const keywordPattern = toIlikePattern(keyword);
        if (keywordPattern) {
            qb.andWhere('vehicle.license_plate ILIKE :keyword', { keyword: keywordPattern });
        }

        qb.orderBy('vehicle.created_at', 'DESC');

        return this.baseRepository.paginate(qb, page, limit);
    }

    async updateVehicle(id: string, vehicleDto: Partial<CreateVehicleDto>) {
        await this.update(id, vehicleDto);
        return await this.findOne({ where: { id: id } });
    }

    async deleteVehicle(id: string) {
        const vehicle = await this.findOne({ where: { id } });

        if (!vehicle) {
            throw new NotFoundException("Vehicle not found");
        }

        return await this.remove(vehicle);
    }
}