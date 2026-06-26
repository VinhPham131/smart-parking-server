import { IsOptional, IsNumber, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ParkingSessionStatus, Range } from 'src/constants/config';

export class MyParkingHistoryListQuery {
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
    @IsEnum(ParkingSessionStatus)
    status?: ParkingSessionStatus;

    @IsOptional()
    @IsString()
    keyword?: string;
}