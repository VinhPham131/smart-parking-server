import { ParkingStatus, ReservationStatus } from "src/constants/config";
import { ParkingArea } from "src/parking-areas/entities/parking-area.entity";
import { Vehicle } from "src/vehicles/entities/vehicles.entity";
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('reservations')
@Index('IDX_reservations_vehicle_id', ['vehicle'])
@Index('IDX_reservations_parking_area_id', ['parking_area'])
@Index('IDX_reservations_status', ['status'])
@Index('IDX_reservations_parking_status', ['parking_status'])
@Index('IDX_reservations_check_in', ['check_in'])
@Index('IDX_reservations_created_at', ['created_at'])
export class Reservation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({nullable: false})
    check_in: Date;

    @ManyToOne(() => Vehicle, (vehicle) => vehicle.reservation)
    @JoinColumn({ name: 'vehicle_id'})
    vehicle: Vehicle;

    @ManyToOne(() => ParkingArea, (parkingArea) => parkingArea.reservations)
    @JoinColumn({ name: 'parking_area_id'})
    parking_area: ParkingArea;

    @Column({
        type: 'enum',
        enum: ReservationStatus,
        default: ReservationStatus.PENDING,
    })
    status: ReservationStatus;

    @Column({
        type: 'enum',
        enum: ParkingStatus,
        default: ParkingStatus.PENDING,
    })
    parking_status: ParkingStatus;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @Column({unique: true})
    reservation_code: string;
}