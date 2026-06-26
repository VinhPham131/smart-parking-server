import { Module } from '@nestjs/common';
import { ParkingHistory } from './entities/parking-history.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParkingHistoryController } from './parking-history.controller';
import { ParkingHistoryService } from './parking-history.service';
import { ParkingHistoryRepository } from './parking-history.repository';
import { ParkingSessionsRepository } from 'src/parking-sessions/parking-sessions.repository';
import { VehiclesRepository } from 'src/vehicles/vehicles.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ParkingHistory])],
  controllers: [ParkingHistoryController],
  providers: [ParkingHistoryService, ParkingHistoryRepository, VehiclesRepository, ParkingSessionsRepository],
  exports: [ParkingHistoryService, ParkingHistoryRepository]
})
export class ParkingHistoryModule { }
