import { BadRequestException, Injectable} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { GenerateQrTokenDto } from './dto/generate-qr-token.dto';
import { MqttService } from 'src/mqtt/mqtt.service';

@Injectable()
export class QrCodeService {
  constructor(
    private jwtService: JwtService,
    private mqttService: MqttService,
  ) { }

  async generateQrToken(generateQrTokenDto: GenerateQrTokenDto, userId: number) {
    const payload = {
      vehicle_id: generateQrTokenDto.vehicle_id,
      user_id: userId,
      timestamp: new Date().toISOString(),
    };

    const qr_token = await this.jwtService.signAsync(payload);

    return {
      message: 'QR code generated successfully',
      qr_token,
      payload,
    };
  }

  async verifyQrToken(qrToken: string) {
    const decoded = await this.jwtService.verifyAsync(qrToken);

    if (!decoded) {
      throw new BadRequestException('Invalid QR Code');
    }
    
    // const tokenTimestamp = new Date(decoded.timestamp).getTime();
    // const currentTime = Date.now();
    // const twoMinutes = 2 * 60 * 1000;
    // const expired = currentTime - tokenTimestamp > twoMinutes;

    // if (expired) {
    //   throw new BadRequestException('QR Code has expired');
    // }

    // this.mqttService.openGate(decoded.type);

    return decoded;
  }
}
