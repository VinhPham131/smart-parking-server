import { BadRequestException, forwardRef, Inject, Injectable } from '@nestjs/common';
import { ReservationsRepository } from './reservations.repository';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ParkingStatus, ReservationStatus, RfidType } from 'src/constants/config';
import { RESERVATION_CHECKIN_WINDOW_MS } from 'src/constants/constants';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ParkingAreasService } from 'src/parking-areas/parking-areas.service';
import { UsersService } from 'src/users/users.service';
import { ReservationListQuery } from './dto/reservations-list-querry.dto';
import { MyReservationListQuery } from './dto/my-reservations-list-querry.dto';
import { AppCacheService } from 'src/cache/app-cache.service';
import { CacheVersionKeys } from 'src/cache/cache.keys';
import { VehiclesRepository } from 'src/vehicles/vehicles.repository';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LIMIT_DELAY_MS } from 'src/constants/constants';
import { Reservation } from './entity/reservations.entity';

@Injectable()
export class ReservationsService {
    constructor(
        private readonly reservationsRepository: ReservationsRepository,
        @Inject(forwardRef(() => ParkingAreasService))
        private readonly parkingAreasService: ParkingAreasService,
        private readonly eventEmitter: EventEmitter2,
        private readonly usersService: UsersService,
        private readonly appCache: AppCacheService,
        private readonly vehiclesRepository: VehiclesRepository,
    ) { }

    isWithinCheckInWindow(scheduledCheckIn: Date, now: Date = new Date()): boolean {
        const diff = Math.abs(now.getTime() - scheduledCheckIn.getTime());
        return diff <= RESERVATION_CHECKIN_WINDOW_MS;
    }

    private async invalidateReservationCaches(userId?: string) {
        await this.appCache.invalidateAdminReservations();
        if (userId) {
            await this.appCache.invalidateUserReservations(userId);
        }
    }

    private async releaseReservedSlotIfHeld(
        reservation: Reservation,
    ) {
        if (
            reservation?.status === ReservationStatus.APPROVED
            && reservation.parking_status === ParkingStatus.PENDING
            && reservation.parking_area?.id
        ) {
            await this.parkingAreasService.decrementReservedSlots(reservation.parking_area.id);
        }
    }

    async findReservationsWithFilters(query: ReservationListQuery) {
        return this.appCache.cachedAdminList(
            'reservations',
            CacheVersionKeys.admin.reservations,
            query,
            () => this.reservationsRepository.findReservationsWithFilters(query),
        );
    }

    async createReservation(dto: CreateReservationDto) {
        const vehicle = await this.vehiclesRepository.findVehicleById(dto.vehicle_id);

        if (!vehicle) {
            throw new BadRequestException('Vehicle not found');
        }

        if (!vehicle.rfid || vehicle.rfid.type !== RfidType.MEMBER) {
            throw new BadRequestException('Only vehicles with member RFID can make reservations');
        }

        const activeReservation = await this.reservationsRepository.findActiveReservationByVehicleId(dto.vehicle_id);
        if (activeReservation) {
            throw new BadRequestException('This vehicle already has an active reservation');
        }

        const existingReservation = await this.reservationsRepository.checkIfReservationOverlaps(dto.check_in, dto.parking_area_id);

        if (existingReservation) {
            throw new BadRequestException("Parking area is already reserved for this time");
        }
        const parkingArea = await this.parkingAreasService.findParkingAreaById(dto.parking_area_id);

        if (!parkingArea) {
            throw new BadRequestException("Parking area not found");
        }
        if (parkingArea.is_active === false) {
            throw new BadRequestException("Parking area is not active, please try again later");
        }

        const reservation = await this.reservationsRepository.createReservation(dto);

        const createdReservation = await this.reservationsRepository.findReservationById(reservation.id);

        if (!createdReservation) {
            throw new BadRequestException("Reservation not found");
        }

        const adminIds = await this.usersService.findAllAdminUsers();
        for (const adminId of adminIds) {
            this.eventEmitter.emit('notification.created', {
                userId: adminId,
                message: `New reservation from ${createdReservation.vehicle.license_plate} at Area ${createdReservation.parking_area.name} — ${new Date(reservation.check_in).toLocaleString('vi-VN')}.`,
                metadata: { title: 'New Reservation', category: 'admin', reservationId: reservation.id },
            });
            console.log(`Notification sent to ${adminId}`);
        }

        await this.invalidateReservationCaches(vehicle.user?.id);

        return reservation;
    }

    async deleteReservation(id: string) {
        const reservation = await this.reservationsRepository.findReservationById(id);
        if (reservation) {
            await this.releaseReservedSlotIfHeld(reservation);
        }
        const result = await this.reservationsRepository.deleteReservation(id);
        await this.invalidateReservationCaches(reservation?.vehicle?.user?.id);
        return result;
    }

    async updateReservationStatus(id: string, status: ReservationStatus) {
        const reservation = await this.reservationsRepository.findReservationById(id);
        if (!reservation) {
            throw new BadRequestException('Reservation not found');
        }
        if (status === ReservationStatus.APPROVED) {
            if (reservation.parking_area?.id) {
                await this.parkingAreasService.incrementReservedSlots(reservation.parking_area.id);
            }
        }
        if (status === ReservationStatus.REJECTED) {
            await this.releaseReservedSlotIfHeld(reservation);
            await this.reservationsRepository.updateParkingStatus(id, ParkingStatus.CANCELLED);
        }
        await this.reservationsRepository.updateReservationStatus(id, status);
        if (reservation?.vehicle?.user?.id) {
            const isApproved = status === ReservationStatus.APPROVED;
            this.eventEmitter.emit('notification.created', {
                userId: reservation.vehicle.user.id,
                message: isApproved
                    ? `Your reservation (${reservation.reservation_code}) has been approved. See you at Area ${reservation.parking_area?.name}!`
                    : `Your reservation (${reservation.reservation_code}) has been rejected.`,
                metadata: {
                    title: isApproved ? 'Reservation Approved' : 'Reservation Rejected',
                    category: 'user',
                    reservationId: id,
                },
            });
            console.log(`Notification sent to ${reservation.vehicle.user.id}`);
        }
        await this.invalidateReservationCaches(reservation?.vehicle?.user?.id);
        return { message: `Reservation ${status.toLowerCase()} successfully` };
    }

    async bulkUpdateReservationStatusByDate(date: Date, status: ReservationStatus) {
        if (status === ReservationStatus.APPROVED) {
            const pendingReservations = await this.reservationsRepository.findPendingReservationsByDate(date);
            let affected = 0;
            for (const reservation of pendingReservations) {
                try {
                    await this.updateReservationStatus(reservation.id, ReservationStatus.APPROVED);
                    affected++;
                } catch {
                    // skip when area is full or reservation is no longer pending
                }
            }
            await this.invalidateReservationCaches();
            return { affected };
        }
        const result = await this.reservationsRepository.bulkUpdateReservationStatus(date, status);
        await this.invalidateReservationCaches();
        return result;
    }

    async countReservationsByDay(day: string) {
        return this.reservationsRepository.countAllReservationsByDay(day);
    }

    async getReservationsByDate(date: string) {
        const reservations = await this.reservationsRepository.findReservationsByDate(new Date(date));

        return reservations.map(r => ({
            id: r.id,
            reservation_code: r.reservation_code,
            vehicle: {
                id: r.vehicle.id,
                license_plate: r.vehicle.license_plate,
            },
            parking_area: {
                id: r.parking_area.id,
                name: r.parking_area.name,
            },
            check_in: r.check_in,
            status: r.status,
        }));
    }

    async findReservationByVehicleId(vehicleId: string) {
        return await this.reservationsRepository.findReservationByVehicleId(vehicleId);
    }

    async updateParkingStatus(reservationId: string, parkingStatus: ParkingStatus) {
        const reservation = await this.reservationsRepository.findReservationById(reservationId);
        const shouldDecrement =
            reservation?.status === ReservationStatus.APPROVED
            && reservation.parking_status === ParkingStatus.PENDING
            && (parkingStatus === ParkingStatus.CHECKED_IN || parkingStatus === ParkingStatus.CANCELLED);

        const updated = await this.reservationsRepository.updateParkingStatusFromPending(
            reservationId,
            parkingStatus,
        );

        if (!updated) {
            return false;
        }

        if (shouldDecrement && reservation?.parking_area?.id) {
            await this.parkingAreasService.decrementReservedSlots(reservation.parking_area.id);
        }

        await this.invalidateReservationCaches(reservation?.vehicle?.user?.id);
        return true;
    }

    async findReservationByUserId(userId: string, query: MyReservationListQuery) {
        return this.appCache.cachedUserList(
            'reservations',
            userId,
            CacheVersionKeys.user.reservations(userId),
            query,
            () => this.reservationsRepository.findReservationByUserIdWithFilters(userId, query),
        );
    }

    async findReservationByLicensePlate(licensePlate: string) {
        return await this.reservationsRepository.findReservationByLicensePlate(licensePlate);
    }

    @Cron(CronExpression.EVERY_MINUTE)
    async checkParkingPendingReservations() {
        const reservations = await this.reservationsRepository.findParkingPendingReservations();
        const now = Date.now();

        for (const reservation of reservations) {
            if (reservation.status !== ReservationStatus.APPROVED) {
                continue;
            }

            const deadline = reservation.check_in.getTime() + LIMIT_DELAY_MS;
            if (now <= deadline) {
                continue;
            }

            const cancelled = await this.updateParkingStatus(reservation.id, ParkingStatus.CANCELLED);
            if (!cancelled || !reservation.vehicle?.user?.id) {
                continue;
            }

            this.eventEmitter.emit('notification.created', {
                userId: reservation.vehicle.user.id,
                message: `Your reservation (${reservation.reservation_code}) has been cancelled because it is past the check-in time.`,
                metadata: {
                    title: 'Reservation Cancelled',
                    category: 'user',
                    reservationId: reservation.id,
                },
            });
        }
    }
}
