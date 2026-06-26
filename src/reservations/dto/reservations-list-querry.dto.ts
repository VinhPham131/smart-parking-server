import { Type } from "class-transformer";
import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { ParkingStatus, ReservationStatus } from "src/constants/config";

export class ReservationListQuery {
    @Type(() => Number)
    @IsNumber()
    page: number;

    @Type(() => Number)
    @IsNumber()
    limit: number;

    @IsOptional()
    @IsString()
    date?: string;

    @IsOptional()
    @IsString()
    check_in?: string;

    @IsOptional()
    @IsString()
    parking_area_id?: string;

    @IsOptional()
    @IsEnum(ReservationStatus)
    status?: ReservationStatus;

    @IsOptional()
    @IsEnum(ParkingStatus)
    parking_status?: ParkingStatus;

    @IsOptional()
    @IsString()
    keyword?: string;
}