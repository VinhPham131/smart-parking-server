import { Transform } from 'class-transformer';
import { IsInt, Min, Max } from 'class-validator';

export class BasePaginationQuery {
    @Transform(({ value }) => Number(value))
    @IsInt()
    @Min(1)
    page: number = 1;

    @Transform(({ value }) => Number(value))
    @IsInt()
    @Min(1)
    @Max(100)
    limit: number = 5;
}