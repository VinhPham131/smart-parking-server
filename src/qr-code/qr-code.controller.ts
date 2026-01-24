import { Controller, Post, Body, Req, UseGuards, HttpCode, HttpStatus} from '@nestjs/common';
import { QrCodeService } from './qr-code.service';
import { GenerateQrTokenDto } from './dto/generate-qr-token.dto';
import { VerifyQrTokenDto } from './dto/verify-qr-token.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('qr-code')
export class QrCodeController {
  constructor(private readonly qrCodeService: QrCodeService) {}

  @Post('generate')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async generateQrToken(@Body() generateQrTokenDto: GenerateQrTokenDto, @Req() req) {
    const userId = req.user.id;
    return await this.qrCodeService.generateQrToken(generateQrTokenDto, userId);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verifyQrToken(@Body() verifyQrTokenDto: VerifyQrTokenDto) {
    return await this.qrCodeService.verifyQrToken(verifyQrTokenDto);
  }
}
