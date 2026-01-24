import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyQrTokenDto {
  @IsNotEmpty()
  @IsString()
  qr_token: string;
}
