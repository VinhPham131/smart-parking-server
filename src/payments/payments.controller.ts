import { Body, Controller, Get, HttpCode, HttpStatus, ParseIntPipe, Post, Query, Req, ValidationPipe } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { MyPaymentListQuery } from './dto/my-payment-list-querry.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { PaymentType, UserRole } from 'src/constants/config';
import { PaymentListQuery } from './dto/payment-list-querry.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentService: PaymentsService) {}

  @Get('my-payments')
  async getMyPayments(@Query() query: MyPaymentListQuery, @Req() req) {
    const userId = req.user.id;
    return await this.paymentService.findPaymentRecordByUserId(userId, query);
  }

  @Roles(UserRole.ADMIN)
  @Get('')
  async getAllPayments(@Query() query: PaymentListQuery) {
    return await this.paymentService.findAllPaymentRecords(query);
  }

  @HttpCode(HttpStatus.OK)
  @Post('deposit')
  async deposit(@Req() req, @Body('amount') amount: number) {
    const userId = req.user.id;
    await this.paymentService.incrementBalance(userId, amount, PaymentType.DEPOSIT);
    return { message: 'Deposit successful', amount };
  }
}
