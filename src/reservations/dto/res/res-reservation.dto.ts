import { IsString } from "class-validator";

export class ResReservationDto {
    @IsString()
    checkin_time: string;

    @IsString()
    checkout_time: string;
}