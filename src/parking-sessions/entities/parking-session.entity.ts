import { ParkingSessionStatus } from "src/constants/config";
import { ParkingSlot } from "src/parking-slots/entities/parking-slot.entity";
import { Vehicle } from "src/vehicles/entities/vehicles.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('parking-sessions')
export class ParkingSession {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Vehicle, (vehicle) => vehicle.parking_sessions)
    @JoinColumn({ name: 'vehicle_id' })
    vehicle: Vehicle;

    @ManyToOne(() => ParkingSlot, (parkingSlot) => parkingSlot.parking_sessions)
    @JoinColumn({ name: 'parking_slot_id' })
    parking_slot: ParkingSlot;

    @Column()
    check_in_time: Date;

    @Column()
    check_out_time: Date;

    @Column()
    fee: number;

    @Column()
    status: ParkingSessionStatus;
    
    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
