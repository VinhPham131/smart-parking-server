import { Transform, Type } from "class-transformer";
import { IsBoolean, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

export class ParkingAreaQuerry {
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(500)
    limit?: number;

    @IsOptional()
    @Transform(({ value }) =>
        value === "true" || value === true ? true : value === "false" || value === false ? false : undefined,
    )
    @IsBoolean()
    is_active?: boolean;

    @IsOptional()
    @IsString()
    name?: string;
}