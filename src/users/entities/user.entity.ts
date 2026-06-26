import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, Unique, Index } from 'typeorm';
import { Vehicle } from '../../vehicles/entities/vehicles.entity';
import { Notification } from '../../notifications/entities/notification.entity';

@Entity('users')
@Index('IDX_users_role', ['role'])
@Index('IDX_users_created_at', ['created_at'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  age: number;

  @Column()
  @Unique(['phone'])
  phone: string;

  @Column()
  address: string;

  @Column()
  @Unique(['email'])
  email: string;

  @Column()
  password: string;

  @Column()
  role: string;

  @Column({ default: 0 })
  balance: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Vehicle, (vehicle) => vehicle.user)
  vehicles: Vehicle[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];
}
