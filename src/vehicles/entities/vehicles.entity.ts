import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
  CreateDateColumn,
  OneToMany,
  Unique,
  OneToOne,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ParkingSession } from 'src/parking-sessions/entities/parking-session.entity';
import { ParkingHistory } from 'src/parking-history/entities/parking-history.entity';
import { Rfid } from 'src/rfid/entities/rfid.entity';
import { Reservation } from 'src/reservations/entity/reservations.entity';

@Entity('vehicles')
@Index('IDX_vehicles_user_id', ['user'])
@Index('IDX_vehicles_created_at', ['created_at'])
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user: User) => user.vehicles, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Unique(['license_plate'])
  @Column()
  license_plate: string;

  @Column()
  brand: string;

  @Column()
  color: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => ParkingSession, (parkingSession) => parkingSession.vehicle)
  parking_sessions: ParkingSession[];

  @OneToMany(() => ParkingHistory, (parkingHistory) => parkingHistory.vehicle)
  parking_histories: ParkingHistory[];

  @OneToOne(() => Rfid, (rfid) => rfid.vehicle)
  rfid: Rfid;

  @OneToMany(() => Reservation, (reservation) => reservation.vehicle)
  reservation: Reservation;
}
