import { IsDate, IsNotEmpty, IsString } from "class-validator";

export class CheckinDto {
    @IsString()
    @IsNotEmpty()
    vehicleId: string;

    @IsString()
    @IsNotEmpty()
    userId: string;

    @IsNotEmpty()
    @IsDate()
    checkinTime: Date;
    
    @IsString()
    @IsNotEmpty()
    parkingAreaId: string;

    checkInImage?: string;
}
