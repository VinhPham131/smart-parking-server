import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class ProcessPlateDto {
  @IsString()
  @IsNotEmpty()
  plate: string;

  @IsNumber()
  @IsNotEmpty()
  timestamp: number;
}