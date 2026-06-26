import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
  CreateDateColumn,
  Column,
  Index,
} from 'typeorm';
import { ParkingSession } from 'src/parking-sessions/entities/parking-session.entity';
import { Vehicle } from 'src/vehicles/entities/vehicles.entity';
import { PaymentMethod } from 'src/constants/config';

@Entity('parking_history')
@Index('IDX_parking_history_vehicle_id', ['vehicle'])
@Index('IDX_parking_history_parking_session_id', ['parking_session'])
@Index('IDX_parking_history_created_at', ['created_at'])
export class ParkingHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ParkingSession, (parkingSession: ParkingSession) => parkingSession.parking_histories)
  @JoinColumn({ name: 'parking_session_id' })
  parking_session: ParkingSession;

  @ManyToOne(() => Vehicle, (vehicle: Vehicle) => vehicle.parking_histories)
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle;

  @Column()
  payment_method: PaymentMethod;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
