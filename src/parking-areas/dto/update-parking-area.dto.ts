import { IsNumber, IsOptional } from "class-validator";

export class UpdateParkingAreaDto {
    @IsOptional()
    @IsNumber()
    slots_quantity?: number;

    @IsOptional()
    @IsNumber()
    maintenance_slots?: number;
}