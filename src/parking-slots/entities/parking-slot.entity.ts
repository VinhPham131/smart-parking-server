import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ParkingSlotStatus } from 'src/constants/config';
import { ParkingSession } from 'src/parking-sessions/entities/parking-session.entity';

@Entity('parking_slots')
export class ParkingSlot {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    slot_code: string;

    @Column({
        type: 'enum',
        enum: ParkingSlotStatus,
        default: ParkingSlotStatus.AVAILABLE,
    })
    status: ParkingSlotStatus;

    @CreateDateColumn()
    created_at: Date;

    @OneToMany(() => ParkingSession, (parkingSession) => parkingSession.parking_slot)
    parking_sessions: ParkingSession[];
}
