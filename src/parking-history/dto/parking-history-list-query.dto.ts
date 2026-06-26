import { IsOptional, IsNumber, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from 'src/constants/config';

export class ParkingHistoryListQuery {
    @Type(() => Number)
    @IsNumber()
    page: number;

    @Type(() => Number)
    @IsNumber()
    limit: number;

    @IsOptional()
    @IsString()
    from_date?: string;

    @IsOptional()
    @IsString()
    to_date?: string;

    @IsOptional()
    @IsString()
    parking_area_id?: string;

    @IsOptional()
    @IsString()
    keyword?: string;

    @IsOptional()
    @IsEnum(PaymentMethod)
    payment_method?: PaymentMethod;
}