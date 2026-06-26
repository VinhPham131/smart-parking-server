import { Module } from '@nestjs/common';
import { ParkingAreasController } from './parking-areas.controller';
import { ParkingAreasService } from './parking-areas.service';
import { ParkingArea } from './entities/parking-area.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParkingAreasRepository } from './parking-areas.repository';
@Module({
  controllers: [ParkingAreasController],
  providers: [ParkingAreasService, ParkingAreasRepository],
  imports: [TypeOrmModule.forFeature([ParkingArea])],
})
export class ParkingAreasModule {}
