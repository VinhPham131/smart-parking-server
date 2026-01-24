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
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ParkingSession } from 'src/parking-sessions/entities/parking-session.entity';

@Entity('vehicles')
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
}
