import { IsNotEmpty, IsString } from 'class-validator';

export class GenerateQrTokenDto {
  @IsString()
  @IsNotEmpty()
  vehicle_id: string;
}
