import { IsString, IsNotEmpty } from 'class-validator';

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  brand: string;

  @IsString()
  @IsNotEmpty()
  color: string;

  @IsString()
  @IsNotEmpty()
  license_plate: string;
}