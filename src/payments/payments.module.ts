import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { FeeCalculationService } from './fee-calculation.service';
import { PaymentsRepository } from './payments.repository';
import { UsersRepository } from 'src/users/user.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsHistory } from './entity/payments.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentsHistory])],
  controllers: [PaymentsController],
  providers: [PaymentsService, FeeCalculationService, PaymentsRepository, UsersRepository],
})
export class PaymentsModule {}
