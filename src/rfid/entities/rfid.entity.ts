import { RfidType } from "src/constants/config";
import { Vehicle } from "src/vehicles/entities/vehicles.entity";
import { Column, CreateDateColumn, Entity, Index, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('rfid')
@Index('IDX_rfid_vehicle_id', ['vehicle'])
@Index('IDX_rfid_rfid_code', ['rfid_code'])
@Index('IDX_rfid_type', ['type'])
@Index('IDX_rfid_is_active', ['is_active'])
export class Rfid {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    rfid_code: string;

    @Column()
    is_active: boolean;

    @OneToOne(() => Vehicle, (vehicle) => vehicle.rfid, { nullable: true })
    @JoinColumn({ name: 'vehicle_id' })
    vehicle: Vehicle;

    @Column()
    type: RfidType;

    @Column({ nullable: true })
    issued_date: Date;

    @Column({ nullable: true })
    expired_date: Date;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}