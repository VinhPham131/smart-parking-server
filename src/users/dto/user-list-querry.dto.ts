import { IsOptional, IsNumber, IsString, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { UserRole } from 'src/constants/config';

export class UserListQuery {
    @Type(() => Number)
    @IsNumber()
    page: number;

    @Type(() => Number)
    @IsNumber()
    limit: number;

    @IsOptional()
    @IsString()
    role?: UserRole;

    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true ? true : value === 'false' || value === false ? false : undefined)
    @IsBoolean()
    is_has_vehicle?: boolean;

    @IsOptional()
    @IsString()
    keyword?: string;
}