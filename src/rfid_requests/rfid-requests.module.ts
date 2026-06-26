import { Module } from '@nestjs/common';
import { RfidRequestsService } from './rfid-requests.service';
import { RfidRequestsController } from './rfid-requests.controller';
import { RfidRequest } from './entity/rfid-requests.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RfidRequestsRepository } from './rfid-requests.repository';
import { RfidService } from 'src/rfid/rfid.service';
import { RfidRepository } from 'src/rfid/rfid.repository';
import { PaymentsService } from 'src/payments/payments.service';
import { PaymentsRepository } from 'src/payments/payments.repository';
import { UsersRepository } from 'src/users/user.repository';
import { FeeCalculationService } from 'src/payments/fee-calculation.service';
import { VehiclesRepository } from 'src/vehicles/vehicles.repository';

@Module({
  imports: [TypeOrmModule.forFeature([RfidRequest])],
  controllers: [RfidRequestsController],
  providers: [
    RfidRequestsService,
    RfidRequestsRepository,
    RfidService,
    RfidRepository,
    PaymentsService,
    PaymentsRepository,
    UsersRepository,
    FeeCalculationService,
    VehiclesRepository,
  ],
  exports: [RfidRequestsService],
})
export class RfidRequestsModule {}
