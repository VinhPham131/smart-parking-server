import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateParkingAreaDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsNumber()
    @IsNotEmpty()
    slots_quantity: number;
}