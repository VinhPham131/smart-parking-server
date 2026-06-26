import { Type } from "class-transformer";
import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { RfidRequestStatus } from "src/constants/config";

export class RfidRequestQuerry {
    @Type(() => Number)
    @IsNumber()
    page: number;

    @Type(() => Number)
    @IsNumber()
    limit: number;

    @IsOptional()
    @IsEnum(RfidRequestStatus)
    status?: RfidRequestStatus;

    @IsOptional()
    @IsString()
    keyword?: string;
}