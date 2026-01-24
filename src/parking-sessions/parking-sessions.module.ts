import { Module } from '@nestjs/common';
import { ParkingSessionsService } from './parking-sessions.service';
import { ParkingSessionsController } from './parking-sessions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParkingSession } from './entities/parking-session.entity';

@Module({
  controllers: [ParkingSessionsController],
  providers: [ParkingSessionsService],
  imports: [TypeOrmModule.forFeature([ParkingSession])],
})
export class ParkingSessionsModule {}
