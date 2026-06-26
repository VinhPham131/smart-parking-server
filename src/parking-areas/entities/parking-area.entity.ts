import { ParkingSession } from 'src/parking-sessions/entities/parking-session.entity';
import { Reservation } from 'src/reservations/entity/reservations.entity';
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('parking_areas')
export class ParkingArea {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    name: string;

    @Column({ default: 0 })
    slots_quantity: number;

    @Column({ default: 0 })
    available_slots: number;
    
    @Column({ default: 0 })
    maintenance_slots: number;

    @Column({ default: 0 })
    reserved_slots: number;

    @Column({ default: true })
    is_active: boolean;

    @CreateDateColumn()
    created_at: Date;

    @OneToMany(() => Reservation, (reservation) => reservation.parking_area)
    reservations: Reservation[];

    @OneToMany(() => ParkingSession, (parkingSession) => parkingSession.parking_area)
    parking_sessions: ParkingSession[];
}
