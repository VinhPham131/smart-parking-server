import { Injectable, OnModuleInit } from '@nestjs/common';
import { ToolRegistry } from '../core/tool.registry';
import { PaymentsRepository } from 'src/payments/payments.repository';
import { PaymentsHistory } from 'src/payments/entity/payments.entity';
import { PaymentStatus, PaymentType } from 'src/constants/config';
import { formatDayFromPrompt } from '../utils/day-format';

@Injectable()
export class PaymentTool implements OnModuleInit {
    constructor(
        private registry: ToolRegistry,
        private paymentsRepository: PaymentsRepository,
    ) {}

    onModuleInit() {
        this.registry.register(
            'get_all_payments',
            {
                name: 'get_all_payments',
                description:
                    'List every payment with no filters. For filtering by status, type, or user, use get_payments_by_status, get_payments_by_payment_type, or get_payments_by_user_name instead.',
            },
            this.getPayments.bind(this),
        );

        this.registry.register(
            'get_payments_by_payment_type',
            {
                name: 'get_payments_by_payment_type',
                description: 'Get payments by payment type.',
                input_schema: {
                    type: 'object',
                    properties: {
                        type: { type: 'string', enum: PaymentType },
                    },
                },
            },
            this.getPaymentsByType.bind(this),
        );

        this.registry.register(
            'get_payments_by_status',
            {
                name: 'get_payments_by_status',
                description: 'Get payments by status.',
                input_schema: {
                    type: 'object',
                    properties: {
                        status: { type: 'enum', enum: Object.keys(PaymentStatus) },
                    },
                },
            },
            this.getPaymentsByStatus.bind(this),
        );

        this.registry.register(
            'get_payments_by_user_name',
            {
                name: 'get_payments_by_user_name',
                description: 'Get payments by user name.',
                input_schema: {
                    type: 'object',
                    properties: {
                        user_name: { type: 'string' },
                    },
                    required: ['user_name'],
                },
            },
            this.getPaymentsByUserName.bind(this),
        );

        this.registry.register(
            'compare_revenue_by_day',
            {
                name: 'compare_revenue_by_day',
                description: 'Compare revenue by day.',
                input_schema: {
                    type: 'object',
                    properties: {
                        previousDay: { type: 'string', format: 'date' },
                    },
                    required: ['previousDay'],
                },
            },
            this.compareRevenueByDay.bind(this),
        );

        this.registry.register(
            'compare_revenue_by_month',
            {
                name: 'compare_revenue_by_month',
                description: 'Compare revenue by month.',
                input_schema: {
                    type: 'object',
                    properties: {
                        previousMonth: { type: 'string', format: 'date' },
                    },
                    required: ['previousMonth'],
                },
            },
            this.compareRevenueByMonth.bind(this),
        );

        this.registry.register(
            'compare_revenue_by_year',
            {
                name: 'compare_revenue_by_year',
                description: 'Compare revenue by year.',
                input_schema: {
                    type: 'object',
                    properties: {
                        previousYear: { type: 'string', format: 'date' },
                    },
                    required: ['previousYear'],
                },
            },
            this.compareRevenueByYear.bind(this),
        );
    }

    async getPayments() {
        const payments = await this.paymentsRepository.findAllPayments();
        return {
            total: payments.length,
            payments: payments.map((p) => this.toPaymentRow(p)),
        };
    }

    async getPaymentsByType(input: { type: PaymentType }) {
        const paymentType =
            PaymentType[input.type as unknown as keyof typeof PaymentType] ??
            input.type;

        const payments = await this.paymentsRepository.findPaymentsByType(paymentType);
        return {
            total: payments.length,
            payments: payments.map((p) => this.toPaymentRow(p)),
        };
    }

    async getPaymentsByStatus(input: { status: PaymentStatus | string }) {
        const status = input.status as PaymentStatus;
        const payments = await this.paymentsRepository.findPaymentsByStatus(status);
        return {
            total: payments.length,
            payments: payments.map((p) => this.toPaymentRow(p)),
        };
    }

    async getPaymentsByUserName(input: { user_name: string }) {
        const payments = await this.paymentsRepository.findPaymentsByUserName(
            input.user_name,
        );
        return {
            total: payments.length,
            payments: payments.map((p) => this.toPaymentRow(p)),
        };
    }

    private toPaymentRow(payment: PaymentsHistory) {
        return {
            id: payment.id,
            user: payment.user.name,
            amount: payment.amount,
            description: payment.description,
            payment_type: payment.payment_type,
            status: payment.status,
        };
    }

    async compareRevenueByDay(input: { previousDay: string }) {
        const today = new Date().toISOString().split('T')[0];
        console.log(today);
        const previousDay = formatDayFromPrompt(input.previousDay);
        const todayRevenue = await this.paymentsRepository.findRevenueByDay(today);
        console.log(todayRevenue);
        const previousDayRevenue = await this.paymentsRepository.findRevenueByDay(previousDay);
        console.log(previousDayRevenue);
        const revenueDifference = todayRevenue - previousDayRevenue;
        return {
            revenueDifference: revenueDifference,
        };
    }

    async compareRevenueByMonth(input: { previousMonth: string }) {
        const today = new Date().toISOString().split('T')[0];
        const previousMonth = formatDayFromPrompt(input.previousMonth);
        const thisMonthRevenue = await this.paymentsRepository.findRevenueByMonth(today);
        const previousMonthRevenue = await this.paymentsRepository.findRevenueByMonth(previousMonth);
        const revenueDifference = thisMonthRevenue - previousMonthRevenue;
        return {
            revenueDifference: revenueDifference,
        };
    }

    async compareRevenueByYear(input: { previousYear: string }) {
        const today = new Date().toISOString().split('T')[0];
        const previousYear = formatDayFromPrompt(input.previousYear);
        const thisYearRevenue = await this.paymentsRepository.findRevenueByYear(today);
        const previousYearRevenue = await this.paymentsRepository.findRevenueByYear(previousYear);
        const revenueDifference = thisYearRevenue - previousYearRevenue;
        return {
            revenueDifference: revenueDifference,
        };
    }
}
