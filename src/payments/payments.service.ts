import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { UsersRepository } from "src/users/user.repository";
import { PaymentsRepository } from "./payments.repository";
import { MONTHLY_FEE } from "src/constants/constants";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { MyPaymentListQuery } from "./dto/my-payment-list-querry.dto";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { PaymentType } from "src/constants/config";
import { PaymentListQuery } from "./dto/payment-list-querry.dto";
import { AppCacheService } from "src/cache/app-cache.service";
import { CacheVersionKeys } from "src/cache/cache.keys";

@Injectable()
export class PaymentsService {
    constructor(
        private readonly paymentsRepository: PaymentsRepository,
        private readonly usersRepository: UsersRepository,
        private readonly eventEmitter: EventEmitter2,
        private readonly appCache: AppCacheService,
    ) { }

    private async invalidatePaymentCaches(userId: string) {
        await Promise.all([
            this.appCache.invalidateAdminPayments(),
            this.appCache.invalidateUserPayments(userId),
            this.appCache.invalidateUserProfile(userId),
            this.appCache.invalidateAdminUsers(),
        ]);
    }

    async deductBalance(userId: string, amount: number, description: string, paymentType: PaymentType) {
        const user = await this.usersRepository.findUserById(userId);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        await this.paymentsRepository.deductBalanceWithRecord(userId, amount, description, paymentType);
        await this.invalidatePaymentCaches(userId);
    }

    async incrementBalance(userId: string, amount: number, paymentType: PaymentType) {
        const user = await this.usersRepository.findUserById(userId);

        if (!user) {
            throw new NotFoundException('User not found');
        }
        await this.paymentsRepository.incrementBalanceWithRecord(userId, amount, 'Balance deposit', paymentType);
        await this.invalidatePaymentCaches(userId);
    }

    async deductParkingSessionFee(userId: string, amount: number, sessionId: string) {
        if (amount <= 0) {
            return 0;
        }

        const user = await this.usersRepository.findUserById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        if (user.balance < amount) {
            this.eventEmitter.emit('notification.created', {
                userId: user.id,
                message: 'Payment failed for parking session. Please check your balance.',
                metadata: {
                    title: 'Parking session',
                    category: 'user',
                    userId: user.id,
                },
            });
            throw new BadRequestException('Insufficient balance');
        }
        await this.deductBalance(userId, amount, `Parking session ${sessionId}`, PaymentType.PARKING_FEE);
        return amount;
    }

    async processMemberMonthlyBilling() {
        const memberUsers = await this.usersRepository.findAllMemberUsers();

        for (const user of memberUsers) {
            await this.deductBalance(user.id, MONTHLY_FEE, 'Monthly member subscription', PaymentType.SUBSCRIPTION);
            if (user.balance < MONTHLY_FEE) {
                this.eventEmitter.emit('notification.created', {
                    userId: user.id,
                    message: 'Payment failed for monthly subscription. Please check your balance.',
                    metadata: {
                        title: 'Monthly subscription',
                        category: 'user',
                        userId: user.id,
                    },
                });
                throw new BadRequestException('Insufficient balance');
            }
        }
    }

    async findPaymentRecordByUserId(userId: string, query: MyPaymentListQuery) {
        return this.appCache.cachedUserList(
            'payments',
            userId,
            CacheVersionKeys.user.payments(userId),
            query,
            () => this.paymentsRepository.findPaymentRecordByUserId(userId, query),
        );
    }

    async findAllPaymentRecords(query: PaymentListQuery) {
        return this.appCache.cachedAdminList(
            'payments',
            CacheVersionKeys.admin.payments,
            query,
            () => this.paymentsRepository.findAllPaymentRecords(query),
        );
    }

    async createPaymentRecord(payment: CreatePaymentDto) {
        const record = await this.paymentsRepository.createPaymentRecord(payment);
        if (payment.userId) {
            await this.invalidatePaymentCaches(payment.userId);
        }
        return record;
    }
}