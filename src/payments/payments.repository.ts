import { DataSource, Repository } from "typeorm";
import { PaymentsHistory } from "./entity/payments.entity";
import { InjectDataSource } from "@nestjs/typeorm";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { MyPaymentListQuery } from "./dto/my-payment-list-querry.dto";
import { PaymentStatus, PaymentType } from "src/constants/config";
import { User } from "src/users/entities/user.entity";
import { PaymentListQuery } from "./dto/payment-list-querry.dto";
import { BaseRepository } from "src/common/pagination/base.repository";
import { toIlikePattern } from "src/common/utils/search.util";

export class PaymentsRepository extends Repository<PaymentsHistory> {
    constructor(
        @InjectDataSource() private dataSource: DataSource,
        private baseRepository: BaseRepository,
    ) {
        super(PaymentsHistory, dataSource.createEntityManager());
    }

    async findAllPayments() {
        return this.find({
            relations: ['user'],
        });
    }

    async findPaymentsByType(paymentType: PaymentType) {
        return this.find({
            where: { payment_type: paymentType },
            relations: ['user'],
        });
    }

    async findPaymentsByStatus(status: PaymentStatus) {
        return this.find({
            where: { status: status },
            relations: ['user'],
        });
    }

    async findPaymentsByUserName(userName: string) {
        const qb = this.dataSource.getRepository(PaymentsHistory).createQueryBuilder('ph')
            .leftJoinAndSelect('ph.user', 'user')
            .where('user.name = :userName', { userName });
        return await qb.getMany();
    }

    async deductBalanceWithRecord(userId: string, amount: number, description: string, paymentType: PaymentType) {
        await this.dataSource.transaction(async (manager) => {
            await manager
                .createQueryBuilder()
                .update(User)
                .set({ balance: () => 'balance - :amount' })
                .where('id = :userId', { userId })
                .setParameter('amount', amount)
                .execute();

            await manager.getRepository(PaymentsHistory).save({
                user: { id: userId },
                amount,
                description,
                status: PaymentStatus.SUCCESS,
                payment_type: paymentType,
            });
        });
    }

    async incrementBalanceWithRecord(userId: string, amount: number, description: string, paymentType: PaymentType) {
        await this.dataSource.transaction(async (manager) => {
            await manager
                .createQueryBuilder()
                .update(User)
                .set({ balance: () => 'balance + :amount' })
                .where('id = :userId', { userId })
                .setParameter('amount', amount)
                .execute();

            await manager.getRepository(PaymentsHistory).save({
                user: { id: userId },
                amount,
                description,
                status: PaymentStatus.SUCCESS,
                payment_type: paymentType,
            });
        });
    }

    async createPaymentRecord(payment: CreatePaymentDto) {
        return await this.save(payment);
    }

    async findPaymentRecordByUserId(userId: string, query: MyPaymentListQuery) {
        const { payment_type, status } = query;

        const qb = this.dataSource.getRepository(PaymentsHistory).createQueryBuilder('ph')
            .where('ph.user_id = :userId', { userId });

        if (payment_type) {
            qb.andWhere('ph.payment_type = :payment_type', { payment_type });
        }

        if (status) {
            qb.andWhere('ph.status = :status', { status });
        }

        qb.orderBy('ph.created_at', 'DESC');
        return await qb.getMany();
    }

    async findAllPaymentRecords(query: PaymentListQuery) {
        const { page, limit, payment_type, status, keyword } = query;

        const qb = this.dataSource.getRepository(PaymentsHistory).createQueryBuilder('ph')
            .leftJoinAndSelect('ph.user', 'user')
            .select([
                'ph.id',
                'ph.amount',
                'ph.description',
                'ph.payment_type',
                'ph.status',
                'ph.created_at',
                'user.id',
                'user.name',
                'user.email'
            ]);

        if (payment_type) {
            qb.andWhere('ph.payment_type = :payment_type', { payment_type });
        }

        if (status) {
            qb.andWhere('ph.status = :status', { status });
        }

        const keywordPattern = toIlikePattern(keyword);
        if (keywordPattern) {
            qb.andWhere(
                'ph.description ILIKE :keyword OR user.name ILIKE :keyword',
                { keyword: keywordPattern },
            );
        }
        
        qb.orderBy('ph.created_at', 'DESC');
        return await this.baseRepository.paginate(qb, page, limit);
    }

    async findRevenueByDay(day: string) {
        const start = new Date(day);
        start.setHours(0, 0, 0, 0);

        const end = new Date(day);
        end.setHours(23, 59, 59, 999);

        return await this.createQueryBuilder('ph')
            .select('SUM(ph.amount)', 'total_revenue')
            .where('ph.created_at BETWEEN :start AND :end', { start, end })
            .andWhere('ph.amount IS NOT NULL')
            .getRawOne()
            .then(result => result.total_revenue);
    }

    async findRevenueByMonth(month: string) {
        const [year, monthNum] = month.split('-').map(Number);

        const start = new Date(year, monthNum - 1, 1);
        const end = new Date(year, monthNum, 0, 23, 59, 59, 999);

        return await this.createQueryBuilder('ph')
            .select('SUM(ph.amount)', 'total_revenue')
            .where('ph.created_at BETWEEN :start AND :end', { start, end })
            .andWhere('ph.amount IS NOT NULL')
            .getRawOne()
            .then(result => result.total_revenue);
    }

    async findRevenueByYear(year: string) {
        const start = new Date(Number(year), 0, 1);
        const end = new Date(Number(year), 11, 31, 23, 59, 59, 999);

        return await this.createQueryBuilder('ph')
            .select('SUM(ph.amount)', 'total_revenue')
            .where('ph.created_at BETWEEN :start AND :end', { start, end })
            .andWhere('ph.amount IS NOT NULL')
            .getRawOne()
            .then(result => result.total_revenue);
    }
}