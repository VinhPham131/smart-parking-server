import { Module } from '@nestjs/common';
import { Vehicle } from './entities/vehicles.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';
import { VehiclesRepository } from './vehicles.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Vehicle])],
  controllers: [VehiclesController],
  providers: [VehiclesService, VehiclesRepository],
})
export class VehiclesModule {}
