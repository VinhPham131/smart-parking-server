import { IsNotEmpty, IsString } from "class-validator";

export class CreateReservationDto {
    @IsNotEmpty()
    @IsString()
    check_in: Date;

    @IsNotEmpty()
    @IsString()
    vehicle_id: string;

    @IsNotEmpty()
    @IsString()
    parking_area_id: string;
}