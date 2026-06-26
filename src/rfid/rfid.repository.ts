import { DataSource, IsNull, Repository } from "typeorm";
import { Rfid } from "./entities/rfid.entity";
import { InjectDataSource } from "@nestjs/typeorm";
import { RfidType } from "src/constants/config";
import { UpdateRfidDto } from "./dto/update-rfid.dto";
import { NotFoundException } from "@nestjs/common";
import { RfidListQuery } from "./dto/rfid-list-querry.dto";
import { BaseRepository } from "src/common/pagination/base.repository";
import { toIlikePattern } from "src/common/utils/search.util";

export class RfidRepository extends Repository<Rfid> {
    constructor(
        @InjectDataSource() private dataSource: DataSource,
        private baseRepository: BaseRepository,
    ) {
        super(Rfid, dataSource.createEntityManager());
    }

    async findRfidsWithFilters(query: RfidListQuery) {
        const { page, limit, type, is_active, is_assigned, keyword } = query;

        const qb = this.dataSource.getRepository(Rfid).createQueryBuilder('r')
            .leftJoinAndSelect('r.vehicle', 'vehicle')
            .select([
                'r.id',
                'r.rfid_code',
                'r.type',
                'r.is_active',
                'r.created_at',
                'r.expired_date',
                'r.issued_date',
                'vehicle.id',
                'vehicle.license_plate',
            ]);

        if (type) {
            qb.andWhere('r.type = :type', { type });
        }

        if (is_active === true) {
            qb.andWhere('r.is_active = true');
        } else if (is_active === false) {
            qb.andWhere('r.is_active = false');
        }

        if (is_assigned === true) {
            qb.andWhere('r.vehicle_id IS NOT NULL');
        } else if (is_assigned === false) {
            qb.andWhere('r.vehicle_id IS NULL');
        }

        const keywordPattern = toIlikePattern(keyword);
        if (keywordPattern) {
            qb.andWhere(
                'r.rfid_code ILIKE :keyword OR vehicle.license_plate ILIKE :keyword',
                { keyword: keywordPattern },
            );
        }
        qb.orderBy('r.created_at', 'DESC');

        return await this.baseRepository.paginate(qb, page, limit);
    }

    async findAllRfids() {
        return this.find({
            relations: ['vehicle'],
        });
    }

    async findRfidByRfidCode(rfid_code: string) {
        return this.findOne({
            where: { rfid_code },
            relations: ['vehicle', 'vehicle.user'],
        });
    }

    async createRfid(rfid_code: string, type: RfidType) {
        const nextYear = new Date().getFullYear() + 1;
        const newRfid = this.create({
            rfid_code,
            type,
            issued_date: new Date(),
            expired_date: nextYear,
            is_active: true,
        });
        return this.save(newRfid);
    }

    async updateRfid(id: string, dto: UpdateRfidDto) {
        const { vehicle_id, ...rest } = dto;

        const updateData: Record<string, unknown> = { ...rest };

        if (vehicle_id !== undefined) {
            updateData.vehicle = vehicle_id ? { id: vehicle_id } : null;
        }

        return this.update(id, updateData);
    }

    async deleteRfid(id: string) {
        const rfid = await this.findOne({ where: { id } });

        if (!rfid) {
            throw new NotFoundException("Rfid not found");
        }

        return this.remove(rfid);
    }

    async countAllRfids() {
        return this.count();
    }

    async countMemberRfids() {
        return this.count({
            where: { type: RfidType.MEMBER },
        });
    }

    async findRfidByUserId(userId: string) {
        return this.findOne({
            where: { vehicle: { user: { id: userId } } },
            relations: ['vehicle'],
        });
    }

    async updateRfidType(userId: string, type: RfidType, issuedDate: Date) {
        const rfid = await this.findRfidByUserId(userId);
        if (!rfid) {
            throw new NotFoundException('Rfid not found');
        }
        return this.update(rfid.id, { type, issued_date: issuedDate });
    }

    async findFirstAvailableRfid() {
        return this.findOne({
            where: {
                vehicle: {id: IsNull()},
                is_active: true,
            },
        });
    }

    async findRfidByType(type: RfidType) {
        return this.find({
            where: { type },
            relations: ['vehicle'],
        });
    }

    async findRfidByStatus(status: boolean) {
        return this.find({
            where: { is_active: status },
            relations: ['vehicle'],
        });
    }
}