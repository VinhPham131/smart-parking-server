import { DataSource, Repository } from "typeorm";
import { RfidRequest } from "./entity/rfid-requests.entity";
import { InjectDataSource } from "@nestjs/typeorm";
import { RfidRequestStatus } from "src/constants/config";
import { RfidRequestQuerry } from "./dto/list-rfid-request-querry.dto";
import { BaseRepository } from "src/common/pagination/base.repository";
import { toIlikePattern } from "src/common/utils/search.util";

export class RfidRequestsRepository extends Repository<RfidRequest> {
    constructor(
        @InjectDataSource() private dataSource: DataSource,
        private baseRepository: BaseRepository,
    ) {
        super(RfidRequest, dataSource.createEntityManager());
    }

    async createRfidRequest(vehicleId: string) {
        const rfidRequest = this.create({
            vehicle: { id: vehicleId },
            status: RfidRequestStatus.PENDING,
        });
        return this.save(rfidRequest);
    }

    async findAllRfidRequestsWithFilters(query: RfidRequestQuerry) {
        const { page, limit, status, keyword } = query;
        const qb = this.dataSource.getRepository(RfidRequest).createQueryBuilder('rfid_request')
            .leftJoinAndSelect('rfid_request.vehicle', 'vehicle')
            .leftJoinAndSelect('vehicle.user', 'user')
            .select([
                'rfid_request.id',
                'rfid_request.status',
                'rfid_request.created_at',
                'vehicle.id',
                'vehicle.license_plate',
                'vehicle.brand',
                'user.id',
                'user.name',
                'user.email',
            ]);
        if (status) {
            qb.andWhere('rfid_request.status = :status', { status });
        }
        const keywordPattern = toIlikePattern(keyword);
        if (keywordPattern) {
            qb.andWhere(
                'vehicle.license_plate ILIKE :keyword OR user.name ILIKE :keyword',
                { keyword: keywordPattern },
            );
        }
        qb.orderBy('rfid_request.created_at', 'DESC');
        return await this.baseRepository.paginate(qb, page, limit);
    }

    async findAllRfidRequests() {
        return this.find({
            relations: ['vehicle', 'vehicle.user'],
        });
    }

    async findMyRfidRequestsWithFilters(userId: string, status: RfidRequestStatus) {
       const qb = this.dataSource.getRepository(RfidRequest).createQueryBuilder('rfid_request')
            .innerJoin('rfid_request.vehicle', 'vehicle', 'vehicle.user_id = :userId', { userId })
            .select([
                'rfid_request.id',
                'rfid_request.status', 
                'rfid_request.created_at',
                'rfid_request.updated_at',
                'vehicle.id',
                'vehicle.license_plate',
                'vehicle.brand',
                'vehicle.color',
            ])
            .orderBy('rfid_request.created_at', 'DESC');
        if (status) {
            qb.andWhere('rfid_request.status = :status', { status });
        }
        return await qb.getMany();
    }

    async updateRfidRequestStatus(id: string, status: RfidRequestStatus) {
        return this.update(id, { status });
    }

    async findRfidRequestById(id: string) {
        return this.findOne({ where: { id }, relations: ['vehicle', 'vehicle.user'] });
    }
}