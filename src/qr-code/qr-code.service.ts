import { Injectable} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { GenerateQrTokenDto } from './dto/generate-qr-token.dto';
import { VerifyQrTokenDto } from './dto/verify-qr-token.dto';

@Injectable()
export class QrCodeService {
  constructor(private jwtService: JwtService) {}

  async generateQrToken(generateQrTokenDto: GenerateQrTokenDto, userId: number) {
    const payload = {
      vehicle_id: generateQrTokenDto.vehicle_id,
      user_id: userId,
      type: 'CHECKIN',
      timestamp: new Date().toISOString(),
    };

    const qr_token = await this.jwtService.signAsync(payload);

    return {
      message: 'QR token generated successfully',
      qr_token,
      payload,
    };
  }

  async verifyQrToken(verifyQrTokenDto: VerifyQrTokenDto) {
      const decoded = await this.jwtService.verifyAsync(verifyQrTokenDto.qr_token);
      
      return {
        message: 'QR token is valid',
        payload: decoded,
      };
  }
}
