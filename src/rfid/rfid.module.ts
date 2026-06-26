import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rfid } from "./entities/rfid.entity";
import { RfidService } from "./rfid.service";
import { RfidController } from "./rfid.controller";
import { RfidRepository } from "./rfid.repository";
import { PaymentsService } from 'src/payments/payments.service';
import { PaymentsRepository } from 'src/payments/payments.repository';
import { UsersRepository } from 'src/users/user.repository';
import { FeeCalculationService } from 'src/payments/fee-calculation.service';
import { VehiclesRepository } from 'src/vehicles/vehicles.repository';

@Module({
    imports: [TypeOrmModule.forFeature([Rfid])],
    providers: [
        RfidService,
        RfidRepository,
        PaymentsService,
        PaymentsRepository,
        UsersRepository,
        FeeCalculationService,
        VehiclesRepository,
    ],
    controllers: [RfidController],
    exports: [RfidService],
})

export class RfidModule {}

