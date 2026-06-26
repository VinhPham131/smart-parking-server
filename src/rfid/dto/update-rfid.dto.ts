import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsEnum, IsOptional, IsString } from 'class-validator';
import { RfidType } from "src/constants/config";

export class UpdateRfidDto {
    @IsOptional()
    @IsEnum(RfidType)
    type?: RfidType;

    @IsOptional()
    @IsBoolean()
    is_active?: boolean;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    expired_date?: Date;

    @IsOptional()
    @IsString()
    vehicle_id?: string;

    @IsOptional()
    @IsString()
    rfid_code?: string;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    issued_date?: Date;
}