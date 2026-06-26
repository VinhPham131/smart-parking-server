import { Module } from '@nestjs/common';
import { ParkingSessionsService } from './parking-sessions.service';
import { ParkingSessionsController } from './parking-sessions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParkingSession } from './entities/parking-session.entity';
import { ParkingSessionsRepository } from './parking-sessions.repository';
import { QrCodeService } from 'src/qr-code/qr-code.service';
import { ParkingGateway } from 'src/gateways/parking.gateway';
import { ParkingRealtimeService } from 'src/gateways/parking-realtime.service';
import { ParkingHistoryService } from 'src/parking-history/parking-history.service';
import { ParkingHistoryRepository } from 'src/parking-history/parking-history.repository';
import { UsersRepository } from 'src/users/user.repository';
import { RfidService } from 'src/rfid/rfid.service';
import { RfidRepository } from 'src/rfid/rfid.repository';
import { UsersService } from 'src/users/users.service';
import { VehiclesRepository } from 'src/vehicles/vehicles.repository';
import { ParkingAreasService } from 'src/parking-areas/parking-areas.service';
import { ParkingAreasRepository } from 'src/parking-areas/parking-areas.repository';
import { ReservationsModule } from 'src/reservations/reservations.module';
import { PaymentsService } from 'src/payments/payments.service';
import { PaymentsRepository } from 'src/payments/payments.repository';
import { FeeCalculationService } from 'src/payments/fee-calculation.service';
import { CameraModule } from 'src/camera/camera.module';

@Module({
  imports: [TypeOrmModule.forFeature([ParkingSession]), CameraModule, ReservationsModule],
  controllers: [ParkingSessionsController],
  providers: [
    ParkingSessionsService,
    ParkingSessionsRepository,
    QrCodeService,
    ParkingGateway,
    ParkingRealtimeService,
    ParkingHistoryService,
    ParkingHistoryRepository,
    UsersRepository,
    RfidService,
    RfidRepository,
    UsersService,
    VehiclesRepository,
    ParkingAreasService,
    ParkingAreasRepository,
    PaymentsService,
    PaymentsRepository,
    FeeCalculationService,
  ],
  exports: [ParkingSessionsService],
})
export class ParkingSessionsModule {}
