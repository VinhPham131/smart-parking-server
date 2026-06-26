import { RfidRequestStatus } from "src/constants/config";
import { Rfid } from "src/rfid/entities/rfid.entity";
import { Vehicle } from "src/vehicles/entities/vehicles.entity";
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('rfid_requests')
@Index('IDX_rfid_requests_vehicle_status_created', ['vehicle', 'status', 'created_at'])
export class RfidRequest {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Vehicle)
    @JoinColumn({ name: 'vehicle_id' })
    vehicle: Vehicle;

    @Column({ type: 'enum', enum: RfidRequestStatus, default: RfidRequestStatus.PENDING })
    status: RfidRequestStatus;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}