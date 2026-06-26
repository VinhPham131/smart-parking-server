import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ParkingArea } from './entities/parking-area.entity';
import { CreateParkingAreaDto } from './dto/create-parking-areas.dto';
import { ParkingAreaQuerry } from './dto/list-parking-area-querry.dto';
import { BaseRepository } from 'src/common/pagination/base.repository';
import { toIlikePattern } from 'src/common/utils/search.util';

@Injectable()
export class ParkingAreasRepository extends Repository<ParkingArea> {
    constructor(
        @InjectDataSource() private dataSource: DataSource,
        private baseRepository: BaseRepository,
    ) {
        super(ParkingArea, dataSource.createEntityManager());
    }

    async findAllParkingAreas() {
        return this.find({ order: { created_at: 'DESC' } });
    }

    async findAllParkingAreasByFilter(
        filter: ParkingAreaQuerry,
        page: number,
        limit: number,
    ) {
        const { is_active, name } = filter;
        const qb = this.createQueryBuilder('pa')
            .orderBy('pa.created_at', 'DESC');

        const namePattern = toIlikePattern(name);
        if (namePattern) {
            qb.andWhere('pa.name ILIKE :name', { name: namePattern });
        }
        if (is_active === true) {
            qb.andWhere('pa.is_active = true');
        } else if (is_active === false) {
            qb.andWhere('pa.is_active = false');
        }

        return await this.baseRepository.paginate(qb, page, limit);
    }

    async findParkingAreaByName(parkingAreaName: string) {
        return this.findOne({ where: { name: parkingAreaName } });
    }

    async incrementReservedSlots(parkingAreaId: string) {
        return this.createQueryBuilder()
            .update(ParkingArea)
            .set({
                reserved_slots: () => 'reserved_slots + 1',
                available_slots: () => 'available_slots - 1',
            })
            .where('id = :id', { id: parkingAreaId })
            .andWhere('available_slots > 0')
            .execute();
    }

    async decrementReservedSlots(parkingAreaId: string) {
        return this.update(parkingAreaId, {
            reserved_slots: () => 'GREATEST(reserved_slots - 1, 0)',
            available_slots: () => 'LEAST(available_slots + 1, slots_quantity)',
        });
    }

    async findParkingAreaById(parkingAreaId: string) {
        return this.findOne({ where: { id: parkingAreaId } });
    }

    async occupySlot(parkingAreaId: string) {
        return this.update(parkingAreaId, {
            available_slots: () => 'available_slots - 1',
        });
    }

    async releaseSlot(parkingAreaId: string) {
        return this.update(parkingAreaId, {
            available_slots: () => 'LEAST(available_slots + 1, slots_quantity)',
        });
    }

    async updateSlotsQuantity(parkingAreaId: string, slotsQuantity: number) {
        return this.update(parkingAreaId, {
            available_slots: slotsQuantity,
            slots_quantity: slotsQuantity,
        });
    }

    async updateMaintenanceSlots(parkingAreaId: string, maintenanceSlots: number, availableSlots?: number) {
        return this.update(parkingAreaId, {
            maintenance_slots: maintenanceSlots,
            available_slots: availableSlots,
        });
    }

    async createParkingArea(dto: CreateParkingAreaDto) {
        const parkingArea = this.create({
            available_slots: dto.slots_quantity,
            name: dto.name,
            is_active: true,
            slots_quantity: dto.slots_quantity,
            maintenance_slots: 0,
            reserved_slots: 0,
        });
        return this.save(parkingArea);
    }

    async deactivateParkingArea(parkingAreaId: string) {
        return this.update(parkingAreaId, {
            is_active: false,
        });
    }

    async activateParkingArea(parkingAreaId: string) {
        return this.update(parkingAreaId, {
            is_active: true,
        });
    }


    async countAvailableSlots(parkingAreaId: string) {
        return this.findOne({
            where: { id: parkingAreaId },
            select: {
                available_slots: true,
            },
        });
    }
}