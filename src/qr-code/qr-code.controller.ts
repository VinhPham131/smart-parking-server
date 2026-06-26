import { Controller, Post, Body, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { QrCodeService } from './qr-code.service';
import { GenerateQrTokenDto } from './dto/generate-qr-token.dto';

@Controller('qr-code')
export class QrCodeController {
  constructor(private readonly qrCodeService: QrCodeService) {}

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  async generateQrToken(@Body() generateQrTokenDto: GenerateQrTokenDto, @Req() req) {
    const userId = req.user.id;
    return await this.qrCodeService.generateQrToken(generateQrTokenDto, userId);
  }
}
