import { Controller } from '@nestjs/common';
import { ParkingSessionsService } from './parking-sessions.service';

@Controller('parking-sessions')
export class ParkingSessionsController {
  constructor(private readonly parkingSessionsService: ParkingSessionsService) { }
}
