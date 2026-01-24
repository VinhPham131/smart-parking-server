import { Module } from '@nestjs/common';
import { ParkingSlotsService } from './parking-slots.service';
import { ParkingSlotsController } from './parking-slots.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParkingSlot } from './entities/parking-slot.entity';

@Module({
  controllers: [ParkingSlotsController],
  providers: [ParkingSlotsService],
  imports: [TypeOrmModule.forFeature([ParkingSlot])],
})
export class ParkingSlotsModule {}
