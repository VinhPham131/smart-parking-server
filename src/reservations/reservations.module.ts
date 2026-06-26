import { Module } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reservation } from './entity/reservations.entity';
import { ReservationsRepository } from './reservations.repository';
import { ParkingAreasService } from 'src/parking-areas/parking-areas.service';
import { ParkingAreasRepository } from 'src/parking-areas/parking-areas.repository';
import { UsersService } from 'src/users/users.service';
import { UsersRepository } from 'src/users/user.repository';
import { VehiclesRepository } from 'src/vehicles/vehicles.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Reservation])],
  controllers: [ReservationsController],
  providers: [
    ReservationsService,
    ReservationsRepository,
    ParkingAreasService,
    ParkingAreasRepository,
    UsersService,
    UsersRepository,
    VehiclesRepository,
  ],
  exports: [ReservationsService, ReservationsRepository],
})
export class ReservationsModule { }
