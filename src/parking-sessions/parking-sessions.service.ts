import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CameraService } from 'src/camera/camera.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ParkingSessionsRepository } from './parking-sessions.repository';
import { MqttService } from 'src/mqtt/mqtt.service';
import { ParkingStatus, PaymentMethod, ProcessParkingType, ReservationStatus, RfidType } from 'src/constants/config';
import { ParkingHistoryService } from 'src/parking-history/parking-history.service';
import { RfidService } from 'src/rfid/rfid.service';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { UsersService } from 'src/users/users.service';
import { ParkingAreasService } from 'src/parking-areas/parking-areas.service';
import { ReservationsService } from 'src/reservations/reservations.service';
import { MEMBER_RATE } from 'src/constants/constants';
import { PaymentsService } from 'src/payments/payments.service';
import { FeeCalculationService } from 'src/payments/fee-calculation.service';
import { ParkingSession } from './entities/parking-session.entity';
import { Rfid } from 'src/rfid/entities/rfid.entity';

@Injectable()
export class ParkingSessionsService {
  private readonly logger = new Logger(ParkingSessionsService.name);

  constructor(
    private readonly parkingSessionsRepository: ParkingSessionsRepository,
    private readonly mqttService: MqttService,
    private readonly rfidService: RfidService,
    private readonly parkingHistoryService: ParkingHistoryService,
    private readonly eventEmitter: EventEmitter2,
    private readonly userService: UsersService,
    private readonly parkingAreasService: ParkingAreasService,
    private readonly reservationsService: ReservationsService,
    private readonly paymentsService: PaymentsService,
    private readonly feeCalculationService: FeeCalculationService,
    private readonly cameraService: CameraService,
  ) { }

  @Cron(CronExpression.EVERY_MINUTE)
  async updateHourlyParkingFees() {
    const activeSessions = await this.parkingSessionsRepository.findActiveRegularSessions();
    let updated = false;

    for (const session of activeSessions) {
      try {
        await this.syncSessionAmount(session);
        updated = true;
      } catch (error) {
        this.logger.error(`Failed to update fee for session ${session.id}`, error);
      }
    }

    if (updated) {
      await this.parkingHistoryService.invalidateAdminCaches();
    }
  }

  private async syncSessionAmount(session: ParkingSession) {
    const amount = this.feeCalculationService.calculateRegularFee(
      session.check_in_time,
      new Date(),
    );
    await this.parkingSessionsRepository.updateSessionAmount(session.id, amount);
    return amount;
  }

  @OnEvent('rfid.checkin')
  async handleRfidCheckin(payload: { rfid: string; area: string }) {
    const rfid = await this.rfidService.findRfidByRfidCode(payload.rfid);
    if (!rfid) return;

    const activeSession = await this.parkingSessionsRepository.findActiveByVehicleId(rfid.vehicle.id);
    if (activeSession) {
      throw new BadRequestException(`RFID ${payload.rfid}: already checked in`);
    }

    const capture = await this.verifyAndCapturePlate(rfid.vehicle.license_plate, rfid.vehicle.user.id);
    console.log('Expected license plate:', rfid.vehicle.license_plate);
    console.log('Captured license plate:', capture?.plate);
    await this.checkInWithRfid(rfid, payload.area, capture?.capture_image_base64);
  }

  @OnEvent('rfid.checkout')
  async handleRfidCheckout(payload: { rfid: string }) {
    const rfid = await this.rfidService.findRfidByRfidCode(payload.rfid);
    if (!rfid) return;

    const activeSession = await this.parkingSessionsRepository.findActiveByVehicleId(rfid.vehicle.id);
    if (!activeSession) {
      throw new BadRequestException(`RFID ${payload.rfid}: no active session, ignoring check-out scan`);
    }

    const capture = await this.verifyAndCapturePlate(rfid.vehicle.license_plate, rfid.vehicle.user.id);
    console.log('Expected license plate:', rfid.vehicle.license_plate);
    console.log('Captured license plate:', capture?.plate);
    await this.checkOutWithRfid(rfid, capture?.capture_image_base64);
  }

  private async verifyAndCapturePlate(registeredPlate: string, userId: string) {
    const result = await this.cameraService.capturePlateOrThrow();

    if (!this.platesMatch(result.plate, registeredPlate)) {
      this.eventEmitter.emit('notification.created', {
        userId: userId,
        message: `Invalid license plate, please use your registered license plate ${registeredPlate}`,
        metadata: {
          title: 'License Plate Mismatch',
          category: 'user',
        }
      });
      throw new BadRequestException(
        `detected license plate ${result.plate} does not match registered license plate ${registeredPlate}`,
      );
    }

    return result;
  }

  private platesMatch(detected: string, registered: string): boolean {
    const normalize = (plate: string) =>
      plate.replace(/[.\s-]/gi, '').toUpperCase();
    return normalize(detected) === normalize(registered);
  }

  private assertRfidActive(rfid: Rfid) {
    if (rfid.is_active === false) {
      throw new BadRequestException(`RFID code ${rfid.rfid_code} is inactive`);
    }
  }

  async checkIn(rfidCode: string, parkingName: string, checkInImage?: string) {
    const rfid = await this.rfidService.findRfidByRfidCode(rfidCode);
    if (!rfid) {
      throw new NotFoundException(`RFID code ${rfidCode} not found`);
    }
    return this.checkInWithRfid(rfid, parkingName, checkInImage);
  }

  private async checkInWithRfid(rfid: Rfid, parkingName: string, checkInImage?: string) {
    this.assertRfidActive(rfid);

    const vehicleId = rfid.vehicle.id;

    const parkingArea = await this.parkingAreasService.findParkingAreaByName(parkingName);
    if (!parkingArea) {
      throw new BadRequestException(`Parking area ${parkingName} not found`);
    }
    const parkingAreaId = parkingArea.id;

    const [user, reservation, availableSlots] = await Promise.all([
      this.userService.findUserByVehicleId(vehicleId),
      this.reservationsService.findReservationByVehicleId(vehicleId),
      this.parkingAreasService.countAvailableSlots(parkingAreaId),
    ]);

    if (!availableSlots) {
      throw new BadRequestException(`Parking area ${parkingName} not found`);
    }

    if (reservation) {
      if (!this.reservationsService.isWithinCheckInWindow(reservation.check_in)) {
        this.eventEmitter.emit('notification.created', {
          userId: user?.id,
          message: `Please checkin within 15 minutes before or after your reservation time`,
          metadata: {
            title: 'Check-in Window',
            category: 'user',
            reservationId: reservation.id,
          }
        });
        throw new BadRequestException('Please checkin within 15 minutes before or after your reservation time');
      }
      if (reservation.parking_area?.id !== parkingAreaId) {
        this.eventEmitter.emit('notification.created', {
          userId: user?.id,
          message: `Check-in parking area does not match your reservation`,
          metadata: {
            title: 'Check-in Area Mismatch',
            category: 'user',
            reservationId: reservation.id,
            }
          });
        throw new BadRequestException('Check-in parking area does not match your reservation');
      }
    }

    const validReservation = reservation
      && reservation.status === ReservationStatus.APPROVED
      && reservation.parking_status === ParkingStatus.PENDING;

    if (availableSlots.available_slots === 0 && !validReservation) {
      this.eventEmitter.emit('notification.created', {
        userId: user?.id,
        message: `Parking area is full, please try again later`,
        metadata: {
          title: 'Parking Area Full',
          category: 'user',
        }
      });
      throw new BadRequestException('Parking area is full, please try again later');
    }

    if (!user) {
      throw new NotFoundException(`No user associated with vehicle ID ${vehicleId}`);
    }
    const activeSession = await this.parkingSessionsRepository.createParkingSession({
      vehicleId: vehicleId,
      checkinTime: new Date(),
      userId: user.id,
      parkingAreaId: parkingAreaId,
      checkInImage,
    });

    let historyId: string | undefined;
    if (rfid.type === RfidType.REGULAR) {
      const history = await this.parkingHistoryService.createParkingHistory(activeSession.id, vehicleId, PaymentMethod.WALLET);
      historyId = history.id;
      await this.syncSessionAmount(activeSession);
    } else if (rfid.type === RfidType.MEMBER) {
      const history = await this.parkingHistoryService.createParkingHistory(activeSession.id, vehicleId, PaymentMethod.MEMBERSHIP);
      historyId = history.id;
    }

    if (validReservation) {
      await this.reservationsService.updateParkingStatus(reservation.id, ParkingStatus.CHECKED_IN);
    }

    await this.parkingAreasService.occupySlot(parkingAreaId);
    this.eventEmitter.emit('parking-history.changed', {
      action: 'checkin',
      userId: user.id,
      parkingAreaId,
      historyId,
    });
    this.eventEmitter.emit('notification.created', {
      userId: user.id,
      message: `Your vehicle has been checked in successfully at ${new Date().toISOString()}`,
    });

    this.mqttService.openGate(ProcessParkingType.CHECKIN);

    return {
      message: 'Check In successful',
      checkin_time: new Date(),
    };
  }

  async checkOut(rfidCode: string, checkOutImage?: string) {
    const rfid = await this.rfidService.findRfidByRfidCode(rfidCode);
    if (!rfid) {
      throw new NotFoundException(`RFID code ${rfidCode} not found`);
    }
    return this.checkOutWithRfid(rfid, checkOutImage);
  }

  private async checkOutWithRfid(rfid: Rfid, checkOutImage?: string) {
    this.assertRfidActive(rfid);

    const vehicleId = rfid.vehicle.id;
    const checkoutTime = new Date();

    const [activeSession, user] = await Promise.all([
      this.parkingSessionsRepository.findActiveByVehicleId(vehicleId),
      this.userService.findUserByVehicleId(vehicleId),
    ]);

    if (!activeSession) {
      throw new BadRequestException(`No active parking session found for vehicle ID ${vehicleId}`);
    }

    if (!user) {
      throw new NotFoundException(`No user associated with vehicle ID ${vehicleId}`);
    }

    if (rfid.type === RfidType.REGULAR) {
      const amount = await this.syncSessionAmount(activeSession);
      await this.paymentsService.deductParkingSessionFee(user.id, amount, activeSession.id);
      await this.parkingSessionsRepository.updateParkingSession(
        { checkoutTime: checkoutTime, checkOutImage },
        activeSession.id,
        amount,
      );
    } else if (rfid.type === RfidType.MEMBER) {
      await this.parkingSessionsRepository.updateParkingSession(
        { checkoutTime: checkoutTime, checkOutImage },
        activeSession.id,
        MEMBER_RATE,
      );
    }

    await this.parkingAreasService.releaseSlot(activeSession.parking_area.id);

    await this.parkingHistoryService.invalidateCachesForUser(user.id);

    this.eventEmitter.emit('parking-history.changed', {
      action: 'checkout',
      userId: user.id,
      parkingAreaId: activeSession.parking_area.id,
    });
    this.eventEmitter.emit('notification.created', {
      userId: user.id,
      message: `Your vehicle has been checked out successfully at ${checkoutTime.toISOString()}`,

    });

    this.mqttService.openGate(ProcessParkingType.CHECKOUT);

    return {
      message: 'Check Out successful',
      checkout_time: checkoutTime,
    };
  }
}
