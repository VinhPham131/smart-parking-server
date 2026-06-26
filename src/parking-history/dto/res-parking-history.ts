import { IsString, IsNumber, IsEnum } from 'class-validator';
import { ParkingSessionStatus, PaymentMethod } from 'src/constants/config';

export class ResParkingHistoryDto {
  @IsString()
  license_plate: string;

  @IsString()
  brand: string;

  @IsString()
  parking_date: string;

  @IsString()
  checkin_time: string;

  @IsString()
  checkout_time: string;

  @IsString()
  duration: string;

  @IsNumber()
  amount: number;

  @IsEnum(ParkingSessionStatus)
  status: ParkingSessionStatus;

  @IsEnum(PaymentMethod)
  payment_method: PaymentMethod;
}