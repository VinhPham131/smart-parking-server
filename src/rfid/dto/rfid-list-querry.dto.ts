import { Type, Transform } from "class-transformer";
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { RfidType } from "src/constants/config";

export class RfidListQuery {
    @Type(() => Number)
    @IsNumber()
    page: number;

    @Type(() => Number)
    @IsNumber()
    limit: number;

    @IsOptional()
    @IsEnum(RfidType)
    type?: RfidType;

    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true ? true : value === 'false' || value === false ? false : undefined)
    @IsBoolean()
    is_active?: boolean;

    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true ? true : value === 'false' || value === false ? false : undefined)
    @IsBoolean()
    is_assigned?: boolean;

    @IsOptional()
    @IsString()
    keyword?: string;
}
