import { Type } from "class-transformer";
import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { PaymentStatus, PaymentType } from "src/constants/config";

export class PaymentListQuery {
    @Type(() => Number)
    @IsNumber()
    page: number;

    @Type(() => Number)
    @IsNumber()
    limit: number;

    @IsOptional()
    @IsEnum(PaymentType)
    payment_type?: PaymentType;

    @IsOptional()
    @IsEnum(PaymentStatus)
    status?: PaymentStatus;

    @IsOptional()
    @IsString()
    keyword?: string;
}