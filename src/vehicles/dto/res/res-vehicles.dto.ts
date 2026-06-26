import { IsObject, IsString } from "class-validator";
import { RfidType } from "src/constants/config";

export class ResVehicleDto {
    @IsString()
    id: string;

    @IsString()
    brand: string;

    @IsString()
    color: string;

    @IsString()
    license_plate: string;

    @IsObject()
    user: {
        name: string;
        age: number;
        phone: string;
        address: string;
        email: string;
        role: string;
    };

    rfid: {
        rfid_code: string;
        type: RfidType;
    } | null;
}