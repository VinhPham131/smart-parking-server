import { Injectable } from "@nestjs/common";
import { Reservation } from "./entity/reservations.entity";
import { Repository, DataSource, Between, Equal } from 'typeorm';
import { InjectDataSource } from "@nestjs/typeorm";
import { CreateReservationDto } from "./dto/create-reservation.dto";
import { ParkingStatus, ReservationStatus, Range } from "src/constants/config";
import { BaseRepository } from "src/common/pagination/base.repository";
import { ReservationListQuery } from "./dto/reservations-list-querry.dto";
import { MyReservationListQuery } from "./dto/my-reservations-list-querry.dto";
import { toIlikePattern } from "src/common/utils/search.util";


@Injectable()
export class ReservationsRepository extends Repository<Reservation> {
    constructor(
        @InjectDataSource() private dataSource: DataSource,
        private baseRepository: BaseRepository
    ) {
        super(Reservation, dataSource.createEntityManager());
    }

    async findReservationsWithFilters(query: ReservationListQuery) {
        const { page, limit, date, check_in, parking_area_id, status, parking_status, keyword } = query;

        const qb = this.dataSource.getRepository(Reservation).createQueryBuilder('r')
            .leftJoinAndSelect('r.vehicle', 'vehicle')
            .leftJoinAndSelect('r.parking_area', 'parking_area')
            .select([
                'r.id',
                'r.reservation_code',
                'r.check_in',
                'r.status',
                'r.parking_status',
                'r.created_at',
                'vehicle.id',
                'vehicle.license_plate',
                'vehicle.brand',
                'vehicle.color',
                'parking_area.id',
                'parking_area.name',
            ]);

        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);

            qb.andWhere('r.check_in >= :startDate', { startDate });
        }

        if (check_in) {
            const checkIn = new Date(check_in);
            checkIn.setHours(0, 0, 0, 0);
            qb.andWhere('r.check_in >= :check_in', { check_in });
        }

        if (parking_area_id) {
            qb.andWhere('r.parking_area_id = :parking_area_id', { parking_area_id });
        }

        if (status) {
            qb.andWhere('r.status = :status', { status });
        }

        if (parking_status) {
            qb.andWhere('r.parking_status = :parking_status', { parking_status });
        }

        const keywordPattern = toIlikePattern(keyword);
        if (keywordPattern) {
            qb.andWhere(
                'vehicle.license_plate ILIKE :keyword OR r.reservation_code ILIKE :keyword',
                { keyword: keywordPattern },
            );
        }

        qb.orderBy('r.created_at', 'DESC');
        return await this.baseRepository.paginate(qb, page, limit);
    }

    async findReservationById(id: string) {
        return this.findOne({
            where: { id },
            relations: ['vehicle', 'vehicle.user', 'parking_area'],
        });
    }

    async createReservation(dto: CreateReservationDto) {
        const reservation = this.create({
            vehicle: { id: dto.vehicle_id },
            parking_area: { id: dto.parking_area_id },
            check_in: dto.check_in,
            reservation_code: this.generateCode(),
        });
        return this.save(reservation);
    }

    generateCode() {
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const random = Math.floor(1000 + Math.random() * 9000);
        return `RSV-${date}-${random}`;
    }

    async deleteReservation(id: string) {
        return this.delete(id);
    }

    async updateReservationStatus(id: string, status: ReservationStatus) {
        return this.update(id, { status });
    }

    async countAllReservationsByDay(day: string) {
        const start = new Date(day);
        start.setHours(0, 0, 0, 0);

        const end = new Date(day);
        end.setHours(23, 59, 59, 999);

        return await this.dataSource
            .getRepository(Reservation)
            .createQueryBuilder('r')
            .where('r.check_in BETWEEN :start AND :end', { start, end })
            .getCount();
    }

    async countAllReservationsByMonth(month: string) {
        const [year, monthNum] = month.split('-').map(Number);
        const start = new Date(year, monthNum - 1, 1);
        const end = new Date(year, monthNum, 0, 23, 59, 59, 999);

        return await this.dataSource
            .getRepository(Reservation)
            .createQueryBuilder('r')
            .where('r.check_in BETWEEN :start AND :end', { start, end })
            .getCount();
    }

    async countAllReservationsByYear(year: string) {
        const start = new Date(Number(year), 0, 1);
        const end = new Date(Number(year), 11, 31, 23, 59, 59, 999);

        return await this.dataSource
            .getRepository(Reservation)
            .createQueryBuilder('r')
            .where('r.check_in BETWEEN :start AND :end', { start, end })
            .getCount();
    }

    async bulkUpdateReservationStatus(
        date: Date,
        newStatus: ReservationStatus,
    ) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const result = await this
            .createQueryBuilder()
            .update()
            .set({ status: newStatus })
            .where('status = :status', { status: ReservationStatus.PENDING })
            .andWhere('check_in >= :start', { start: startOfDay })
            .andWhere('check_in <= :end', { end: endOfDay })
            .execute();

        return { affected: result.affected ?? 0 };
    }

    async findReservationsByDate(date: Date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        return this.find({
            where: {
                check_in: Between(startOfDay, endOfDay),
            },
            relations: ['vehicle', 'parking_area'],
        });
    }

    async checkIfReservationOverlaps(checkIn: Date, parkingAreaId: string) {
        return this.findOne({
            where: {
                parking_area: { id: parkingAreaId },
                check_in: Equal(checkIn),
            },
        });
    }

    async findActiveReservationByVehicleId(vehicleId: string) {
        return this.findOne({
            where: [
                { vehicle: { id: vehicleId }, status: ReservationStatus.PENDING },
                {
                    vehicle: { id: vehicleId },
                    status: ReservationStatus.APPROVED,
                    parking_status: ParkingStatus.PENDING,
                },
            ],
        });
    }

    async findReservationByVehicleId(vehicleId: string) {
        return this.findOne({
            where: {
                vehicle: { id: vehicleId },
                status: ReservationStatus.APPROVED,
                parking_status: ParkingStatus.PENDING,
            },
            relations: ['parking_area'],
        });
    }

    async findPendingReservationsByDate(date: Date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        return this.find({
            where: {
                status: ReservationStatus.PENDING,
                check_in: Between(startOfDay, endOfDay),
            },
            relations: ['parking_area'],
        });
    }

    async updateParkingStatus(reservationId: string, parkingStatus: ParkingStatus) {
        return this.update(reservationId, { parking_status: parkingStatus });
    }

    async updateParkingStatusFromPending(reservationId: string, parkingStatus: ParkingStatus) {
        const result = await this.update(
            { id: reservationId, parking_status: ParkingStatus.PENDING },
            { parking_status: parkingStatus },
        );
        return (result.affected ?? 0) > 0;
    }

    async findReservationByUserIdWithFilters(userId: string, query: MyReservationListQuery) {
        const { page, limit, range, status, parking_area_id, keyword } = query;

        const qb = this.dataSource.getRepository(Reservation).createQueryBuilder('r')
            .innerJoin('r.vehicle', 'vehicle', 'vehicle.user_id = :userId', { userId })
            .leftJoinAndSelect('r.parking_area', 'parking_area')
            .select([
                'r.id',
                'r.reservation_code',
                'r.check_in',
                'r.status',
                'r.parking_status',
                'r.created_at',
                'r.updated_at',
                'vehicle.id',
                'vehicle.license_plate',
                'parking_area.name',
            ]);
        
        if (range) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const thisWeek = new Date(today.setDate(today.getDate() - today.getDay()));
            thisWeek.setHours(0, 0, 0, 0);
            const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            thisMonth.setHours(0, 0, 0, 0);

            if (range === Range.TODAY) {
                qb.andWhere('r.check_in >= :startDate', { startDate: today });
            } else if (range === Range.THIS_WEEK) {
                qb.andWhere('r.check_in >= :startDate', { startDate: thisWeek });
            } else if (range === Range.THIS_MONTH) {
                qb.andWhere('r.check_in >= :startDate', { startDate: thisMonth });
            }
        }

        if (status) {
            qb.andWhere('r.status = :status', { status });
        }
        
        if (parking_area_id) {
            qb.andWhere('r.parking_area_id = :parking_area_id', { parking_area_id });
        }

        const keywordPattern = toIlikePattern(keyword);
        if (keywordPattern) {
            qb.andWhere(
                'vehicle.license_plate ILIKE :keyword OR r.reservation_code ILIKE :keyword',
                { keyword: keywordPattern },
            );
        }

        qb.orderBy('r.updated_at', 'DESC');
        return await this.baseRepository.paginate(qb, page, limit);
    }

    async findReservationByLicensePlate(licensePlate: string) {
        return await this.find({
            where: {
                vehicle: { license_plate: licensePlate },
            },
            relations: ['vehicle', 'parking_area'],
        });
    }

    async findCancelReservations() {
        const qb = this.dataSource.getRepository(Reservation)
                .createQueryBuilder('r')
            .where('r.parking_status = :parkingStatus', { parkingStatus: ParkingStatus.CANCELLED })
            .leftJoinAndSelect('r.vehicle', 'vehicle')
            .leftJoinAndSelect('vehicle.user', 'user')
        return await qb.getMany();
    }

    async updateReservationParkingStatus(reservationId: string, parkingStatus: ParkingStatus) {
        return this.update(reservationId, { parking_status: parkingStatus });
    }

    async findParkingPendingReservations() {
        return this.find({
            where: {
                parking_status: ParkingStatus.PENDING,
                status: ReservationStatus.APPROVED,
            },
            relations: ['vehicle', 'vehicle.user'],
        });
    }
}
