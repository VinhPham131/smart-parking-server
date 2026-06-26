import { IsOptional, IsNumber, IsString, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class VehicleListQuery {
    @Type(() => Number)
    @IsNumber()
    page: number;

    @Type(() => Number)
    @IsNumber()
    limit: number;

    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true ? true : value === 'false' || value === false ? false : undefined)
    @IsBoolean()
    is_has_rfid?: boolean;

    @IsOptional()
    @IsString()
    keyword?: string;
}
