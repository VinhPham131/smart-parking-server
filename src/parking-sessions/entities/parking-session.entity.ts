import { ParkingSessionStatus } from "src/constants/config";
import { ParkingArea } from "src/parking-areas/entities/parking-area.entity";
import { ParkingHistory } from "src/parking-history/entities/parking-history.entity";
import { Vehicle } from "src/vehicles/entities/vehicles.entity";
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('parking_sessions')
@Index('IDX_parking_sessions_vehicle_id', ['vehicle'])
@Index('IDX_parking_sessions_parking_area_id', ['parking_area'])
@Index('IDX_parking_sessions_status', ['status'])
@Index('IDX_parking_sessions_check_in_time', ['check_in_time'])
@Index('IDX_parking_sessions_created_at', ['created_at'])
export class ParkingSession {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Vehicle, (vehicle) => vehicle.parking_sessions)
    @JoinColumn({ name: 'vehicle_id' })
    vehicle: Vehicle;

    @Column({nullable: true})
    check_in_time: Date;

    @Column({nullable: true})
    check_out_time: Date;

    @Column({ nullable: true })
    amount: number;

    @Column({ type: 'text', nullable: true })
    check_in_image: string;

    @Column({ type: 'text', nullable: true })
    check_out_image: string;

    @Column()
    status: ParkingSessionStatus;
    
    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @OneToMany(() => ParkingHistory, (parkingHistory) => parkingHistory.parking_session, { onDelete: 'CASCADE' })
    parking_histories: ParkingHistory[];
    
    @ManyToOne(() => ParkingArea, (parkingArea) => parkingArea.parking_sessions )
    @JoinColumn({ name: 'parking_area_id' })
    parking_area: ParkingArea;
}
