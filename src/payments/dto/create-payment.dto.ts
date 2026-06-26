import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { PaymentStatus, PaymentType } from "src/constants/config";

export class CreatePaymentDto {
    @IsNotEmpty()
    @IsString()
    userId: string;

    @IsNotEmpty()
    @IsNumber()
    amount: number;

    @IsOptional()
    @IsString()
    description: string;

    @IsNotEmpty()
    @IsEnum(PaymentStatus)
    status: PaymentStatus;

    @IsNotEmpty()
    @IsEnum(PaymentType)
    payment_type: PaymentType;
}