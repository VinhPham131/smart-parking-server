import { Type } from "class-transformer";
import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { ReservationStatus, Range } from "src/constants/config";

export class MyReservationListQuery {
    @Type(() => Number)
    @IsNumber()
    page: number;

    @Type(() => Number)
    @IsNumber()
    limit: number;

    @IsOptional()
    @IsEnum(Range)
    range?: Range;

    @IsOptional()
    @IsEnum(ReservationStatus)
    status?: ReservationStatus;

    @IsOptional()
    @IsString()
    parking_area_id?: string;

    @IsOptional()
    @IsString()
    keyword?: string;
}