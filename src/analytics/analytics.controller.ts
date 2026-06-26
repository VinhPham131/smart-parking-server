import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) { }

  @Get('overview')
  async getOverview(
    @Query('day') day?: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    return this.analyticsService.overview(day, month, year);
  }

  @Get('rfid-type-rate')
  async getRfidTypeRate() {
    return this.analyticsService.rfidTypeRate();
  }

  @Get('sessions-over-time')
  async getSessionsOverTime() {
    return this.analyticsService.sessionsOverTime();
  }

  @Get('peak-hours')
  async getPeakHours() {
    return this.analyticsService.peakHours();
  }
}