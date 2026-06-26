import { IsOptional, IsString, IsEnum } from 'class-validator';
import { PaymentStatus, PaymentType } from 'src/constants/config';

export class MyPaymentListQuery {

    @IsOptional()
    @IsEnum(PaymentType)
    payment_type?: PaymentType;

    @IsOptional()
    @IsEnum(PaymentStatus)
    status?: PaymentStatus;
}