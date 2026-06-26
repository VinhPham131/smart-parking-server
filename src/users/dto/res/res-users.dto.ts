import { IsArray, IsNumber, IsString } from "class-validator";

export class ResUsersDto {
    @IsString()
    id: string;

    @IsString()
    name: string;

    @IsNumber()
    age: number;

    @IsString()
    phone: string;

    @IsString()
    address: string;

    @IsString()
    email: string;

    @IsString()
    role: string;
    
    @IsArray()
    vehicles: {
        brand: string;
        color: string;
        license_plate: string;
    }[];
}