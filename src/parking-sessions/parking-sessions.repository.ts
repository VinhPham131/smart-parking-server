import { DataSource, Repository, In } from "typeorm";
import { InjectDataSource } from "@nestjs/typeorm";
import { ParkingSession } from "./entities/parking-session.entity";
import { CheckinDto } from "./dto/checkin.dto";
import { ParkingSessionStatus, RfidType } from "src/constants/config";
import { CheckoutDto } from "./dto/checkout.dto";

export class ParkingSessionsRepository extends Repository<ParkingSession> {
    constructor(@InjectDataSource() private dataSource: DataSource) {
        super(ParkingSession, dataSource.createEntityManager());
    }

    async createParkingSession(parkingSession: CheckinDto) {
        const session = this.create(
            {
                vehicle: {
                    id: parkingSession.vehicleId,
                    user: { id: parkingSession.userId },
                },
                check_in_time: parkingSession.checkinTime,
                status: ParkingSessionStatus.IN_PROGRESS,
                amount: 0,
                parking_area: { id: parkingSession.parkingAreaId },
                check_in_image: parkingSession.checkInImage,
            }
        );
        return await this.save(session);
    }

    async updateSessionAmount(sessionId: string, amount: number) {
        return await this.update({ id: sessionId }, { amount });
    }

    async findActiveRegularSessions() {
        return await this.createQueryBuilder('ps')
            .innerJoin('ps.vehicle', 'vehicle')
            .innerJoin('vehicle.rfid', 'rfid')
            .where('ps.status = :status', { status: ParkingSessionStatus.IN_PROGRESS })
            .andWhere('rfid.type = :type', { type: RfidType.REGULAR })
            .getMany();
    }

    async updateParkingSession(parkingSession: CheckoutDto, sessionId: string, amount: number) {
        return await this.update(
            { id: sessionId },
            {
                check_out_time: parkingSession.checkoutTime,
                status: ParkingSessionStatus.COMPLETED,
                amount: amount,
                check_out_image: parkingSession.checkOutImage,
            },
        );
    }

    async findActiveByVehicleId(vehicleId: string) {
        return await this.findOne({
            where: {
                vehicle: { id: vehicleId },
                status:
                    In([
                        ParkingSessionStatus.IN_PROGRESS,
                    ]),
            },
            relations: ['vehicle', 'parking_area'],
        });
    }

    async countTotalSessionsByDay(day: string) {
        const start = new Date(day);
        start.setHours(0, 0, 0, 0);

        const end = new Date(day);
        end.setHours(23, 59, 59, 999);

        return await this.dataSource
            .getRepository(ParkingSession)
            .createQueryBuilder('ps')
            .where('ps.check_in_time BETWEEN :start AND :end', { start, end })
            .getCount();
    }

    async countTotalSessionsByMonth(month: string) {
        const [year, monthNum] = month.split('-').map(Number);

        const start = new Date(year, monthNum - 1, 1);
        const end = new Date(year, monthNum, 0, 23, 59, 59, 999);

        return this.dataSource
            .getRepository(ParkingSession)
            .createQueryBuilder('ps')
            .where('ps.check_in_time BETWEEN :start AND :end', { start, end })
            .getCount();
    }

    async countTotalSessionsByYear(year: string) {
        const start = new Date(Number(year), 0, 1);
        const end = new Date(Number(year), 11, 31, 23, 59, 59, 999);

        return this.dataSource
            .getRepository(ParkingSession)
            .createQueryBuilder('ps')
            .where('ps.check_in_time BETWEEN :start AND :end', { start, end })
            .getCount();
    }

    async getParkingSessionsDuration() {
        return await this.dataSource
            .getRepository(ParkingSession)
            .createQueryBuilder('ps')
            .select('ps.id', 'id')
            .addSelect(`
      EXTRACT(EPOCH FROM (ps.check_out_time - ps.check_in)) / 60
    `, 'duration')
            .where('ps.status = :status', { status: ParkingSessionStatus.COMPLETED })
            .getRawMany();
    }

    async getTotalTimeParkingByDay(day: string) {
        const start = new Date(day);
        start.setHours(0, 0, 0, 0);

        const end = new Date(day);
        end.setHours(23, 59, 59, 999);

        const result = await this.dataSource
            .getRepository(ParkingSession)
            .createQueryBuilder('ps')
            .select(`
      SUM(
        EXTRACT(EPOCH FROM (ps.check_out_time - ps.check_in)) / 60
      )
    `, 'total_time')
            .where('ps.check_in BETWEEN :start AND :end', { start, end })
            .andWhere('ps.status = :status', { status: 'Completed' })
            .getRawOne();

        return Number(result.total_time) || 0;
    }

    async getTotalTimeParkingByMonth(month: string) {
        const [year, monthNum] = month.split('-').map(Number);

        const start = new Date(year, monthNum - 1, 1);
        const end = new Date(year, monthNum, 0, 23, 59, 59, 999);
        
        const result = await this.dataSource 
            .getRepository(ParkingSession)
            .createQueryBuilder('ps')
            .select(`
                SUM(
                    EXTRACT(EPOCH FROM (ps.check_out_time - ps.check_in)) / 60
                )
            `, 'total_time')
            .where('ps.check_in BETWEEN :start AND :end', { start, end })
            .andWhere('ps.status = :status', { status: 'Completed' })
            .getRawOne();

        return Number(result.total_time) || 0;
    }

    async getTotalTimeParkingByYear(year: string) {
        const start = new Date(Number(year), 0, 1);
        const end = new Date(Number(year), 11, 31, 23, 59, 59, 999);
        
        const result = await this.dataSource
            .getRepository(ParkingSession)
            .createQueryBuilder('ps')
            .select(`
                SUM(
                    EXTRACT(EPOCH FROM (ps.check_out_time - ps.check_in)) / 60
                )
            `, 'total_time')
            .where('ps.check_in BETWEEN :start AND :end', { start, end })
            .andWhere('ps.status = :status', { status: 'Completed' })
            .getRawOne();

        return Number(result.total_time) || 0;
    }

    async countSuccessfulSessionsByDay(day: string) {
        const start = new Date(day);
        start.setHours(0, 0, 0, 0);

        const end = new Date(day);
        end.setHours(23, 59, 59, 999);

        return await this.dataSource
            .getRepository(ParkingSession)
            .createQueryBuilder('ps')
            .where('ps.check_in BETWEEN :start AND :end', { start, end })
            .andWhere('ps.status = :status', { status: ParkingSessionStatus.COMPLETED })
            .getCount();
    }

    async countSuccessfulSessionsByMonth(month: string) {
        const [year, monthNum] = month.split('-').map(Number);

        const start = new Date(year, monthNum - 1, 1);
        const end = new Date(year, monthNum, 0, 23, 59, 59, 999);

        return await this.dataSource
            .getRepository(ParkingSession)
            .createQueryBuilder('ps')
            .where('ps.check_in BETWEEN :start AND :end', { start, end })
            .andWhere('ps.status = :status', { status: ParkingSessionStatus.COMPLETED })
            .getCount();
    }

    async countSuccessfulSessionsByYear(year: string) {
        const start = new Date(Number(year), 0, 1);
        const end = new Date(Number(year), 11, 31, 23, 59, 59, 999);

        return await this.dataSource
            .getRepository(ParkingSession)
            .createQueryBuilder('ps')
            .where('ps.check_in BETWEEN :start AND :end', { start, end })
            .andWhere('ps.status = :status', { status: ParkingSessionStatus.COMPLETED })
            .getCount();
    }

    async findAllSessions() {
        return await this.find();
    }

    async findCurrentSessions() {
        const qb = this.dataSource.getRepository(ParkingSession)
            .createQueryBuilder('ps')
            .where('ps.status = :status', { status: ParkingSessionStatus.IN_PROGRESS })
            .leftJoinAndSelect('ps.vehicle', 'vehicle')
            .leftJoinAndSelect('vehicle.user', 'user')
            .leftJoinAndSelect('vehicle.rfid', 'rfid')
            .leftJoinAndSelect('ps.parking_area', 'parking_area')
        return await qb.getMany();
    }
}