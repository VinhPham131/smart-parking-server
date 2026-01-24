import { Controller} from '@nestjs/common';
import { ParkingSlotsService } from './parking-slots.service';

@Controller('parking-slots')
export class ParkingSlotsController {
  constructor(private readonly parkingSlotsService: ParkingSlotsService) {}
}
