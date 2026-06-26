import { DataSource, In, Repository } from "typeorm";
import { InjectDataSource } from "@nestjs/typeorm";
import { ParkingHistory } from "./entities/parking-history.entity";
import { PaymentMethod, Range } from "src/constants/config";
import { BaseRepository } from "src/common/pagination/base.repository";
import { ParkingHistoryListQuery } from "./dto/parking-history-list-query.dto";
import { MyParkingHistoryListQuery } from "./dto/my-parking-history-list-querry.dto";
import { toIlikePattern } from "src/common/utils/search.util";

export class ParkingHistoryRepository extends Repository<ParkingHistory> {
    constructor(
        @InjectDataSource() private dataSource: DataSource,
        private baseRepository: BaseRepository,
    ) {
        super(ParkingHistory, dataSource.createEntityManager());
    }

    async findParkingHistoryByVehicleId(vehicleIds: string[]) {
        return await this.find({
            where: {
                vehicle: { id: In(vehicleIds) },
            },
            relations: {
                vehicle: true,
                parking_session: true,
            },
        });
    }

    async findParkingHistoryByUserIdWithFilters(userId: string, query: MyParkingHistoryListQuery) {
        const { page, limit, range, status, keyword } = query;

        const qb = this.dataSource
            .getRepository(ParkingHistory)
            .createQueryBuilder('ph')
            .innerJoinAndSelect('ph.vehicle', 'vehicle', 'vehicle.user_id = :userId', { userId })
            .leftJoinAndSelect('ph.parking_session', 'ps')
            .leftJoinAndSelect('ps.parking_area', 'pa')

        if (range) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const thisWeek = new Date(today);
            thisWeek.setDate(today.getDate() - today.getDay());
            const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            if (range === Range.TODAY) {
                qb.andWhere('ps.check_in_time >= :startDate', { startDate: today });
            } else if (range === Range.THIS_WEEK) {
                qb.andWhere('ps.check_in_time >= :startDate', { startDate: thisWeek });
            } else if (range === Range.THIS_MONTH) {
                qb.andWhere('ps.check_in_time >= :startDate', { startDate: thisMonth });
            }
        }
        if (status) {
            qb.andWhere('ps.status = :status', { status });
        }
        const keywordPattern = toIlikePattern(keyword);
        if (keywordPattern) {
            qb.andWhere('vehicle.license_plate ILIKE :keyword', { keyword: keywordPattern });
        }
        qb.orderBy('ph.created_at', 'DESC');
        return this.baseRepository.paginate(qb, page, limit);
    }

    async createParkingHistory(parkingSessionId: string, vehicleId: string, paymentMethod: PaymentMethod) {
        const parkingHistory = this.create(
            {
                parking_session: { id: parkingSessionId },
                vehicle: { id: vehicleId },
                payment_method: paymentMethod,
            }
        )
        return await this.save(parkingHistory);
    }

    async findParkingHistoryById(id: string) {
        return await this.findOne({
            where: { id },
            relations: {
                vehicle: true,
                parking_session: {
                    vehicle: {
                        user: true,
                    }, 
                    parking_area: true,
                },
            },
        });
    }

    async findWithFilters(query: ParkingHistoryListQuery) {
        const { page, limit, from_date, to_date, parking_area_id, keyword, payment_method } = query;

        const qb = this.dataSource
            .getRepository(ParkingHistory)
            .createQueryBuilder('ph')
            .leftJoinAndSelect('ph.vehicle', 'vehicle')
            .leftJoinAndSelect('ph.parking_session', 'ps')
            .leftJoinAndSelect('ps.parking_area', 'pa')
            .leftJoinAndSelect('vehicle.user', 'user')
            .select([
                'ph.id',
                'ph.payment_method',
                'ph.created_at',
                'vehicle.id',
                'vehicle.license_plate',
                'vehicle.brand',
                'vehicle.color',
                'user.id',
                'user.name',
                'user.email',
                'ps.id',
                'ps.check_in_time',
                'ps.check_out_time',
                'ps.check_in_image',
                'ps.check_out_image',
                'ps.amount',
                'ps.status',
                'pa.id',
                'pa.name',
            ]);


        if (from_date) {
            const startDate = new Date(from_date);
            startDate.setHours(0, 0, 0, 0);

            qb.andWhere('ps.check_in_time >= :from_date', { from_date: startDate });
        }

        if (to_date) {
            const endDate = new Date(to_date);
            endDate.setHours(23, 59, 59, 999);

            qb.andWhere('ps.check_out_time <= :to_date', { to_date: endDate });
        }

        if (from_date && to_date) {
            const startDate = new Date(from_date);
            startDate.setHours(0, 0, 0, 0);

            const endDate = new Date(to_date);
            endDate.setHours(23, 59, 59, 999);

            qb.andWhere(
                '(ps.check_in_time >= :from_date AND ps.check_in_time <= :to_date) OR (ps.check_out_time >= :from_date AND ps.check_out_time <= :to_date)',
                { from_date: startDate, to_date: endDate },
            );
        }

        if (parking_area_id) {
            qb.andWhere('pa.id = :parking_area_id', { parking_area_id });
        }

        if (payment_method) {
            qb.andWhere('ph.payment_method = :payment_method', { payment_method });
        }

        const keywordPattern = toIlikePattern(keyword);
        if (keywordPattern) {
            qb.andWhere(
                '(user.name ILIKE :keyword OR user.phone ILIKE :keyword OR vehicle.license_plate ILIKE :keyword)',
                { keyword: keywordPattern },
            );
        }

        qb.orderBy('ph.created_at', 'DESC');

        return this.baseRepository.paginate(qb, page, limit);
    }

    async findAllParkingHistories() {
        return await this.find({
            relations: {
                vehicle: true,
                parking_session: true,
            },
        });
    }

    async calculateTotalRevenueByDay(day: string) {
        const start = new Date(day);
        start.setHours(0, 0, 0, 0);

        const end = new Date(day);
        end.setHours(23, 59, 59, 999);

        return await this.
            createQueryBuilder('ph')
            .leftJoinAndSelect('ph.parking_session', 'ps')
            .select('SUM(ph.amount)', 'total_revenue')
            .where('ph.created_at BETWEEN :start AND :end', { start, end })
            .andWhere('ph.amount IS NOT NULL')
            .getRawOne();
    }

    async calculateTotalRevenueByMonth(month: string) {
        const [year, monthNum] = month.split('-').map(Number);

        const start = new Date(year, monthNum - 1, 1);
        const end = new Date(year, monthNum, 0, 23, 59, 59, 999);

        return await this
            .createQueryBuilder('ph')
            .leftJoinAndSelect('ph.parking_session', 'ps')
            .select('SUM(ph.amount)', 'total_revenue')
            .where('ph.created_at BETWEEN :start AND :end', { start, end })
            .andWhere('ph.amount IS NOT NULL')
            .getRawOne();
    }

    async calculateTotalRevenueByYear(year: string) {
        const start = new Date(Number(year), 0, 1);
        const end = new Date(Number(year), 11, 31, 23, 59, 59, 999);

        return await this
            .createQueryBuilder('ph')
            .leftJoinAndSelect('ph.parking_session', 'ps')
            .select('SUM(ph.amount)', 'total_revenue')
            .where('ph.created_at BETWEEN :start AND :end', { start, end })
            .andWhere('ph.amount IS NOT NULL')
            .getRawOne();
    }
}