import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { ParkingSessionsRepository } from 'src/parking-sessions/parking-sessions.repository';
import { ParkingHistoryRepository } from 'src/parking-history/parking-history.repository';
import { RfidRepository } from 'src/rfid/rfid.repository';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService, ParkingSessionsRepository, ParkingHistoryRepository, RfidRepository],
})
export class AnalyticsModule { }
