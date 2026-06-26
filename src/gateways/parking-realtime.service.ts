import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
    ParkingAreaChangedPayload,
    ParkingGateway,
    ParkingHistoryChangedPayload,
} from './parking.gateway';

@Injectable()
export class ParkingRealtimeService {
    constructor(private readonly parkingGateway: ParkingGateway) {}

    @OnEvent('parking-history.changed')
    handleParkingHistoryChanged(payload: ParkingHistoryChangedPayload) {
        this.parkingGateway.emitParkingHistoryChanged(payload);
    }

    @OnEvent('parking-area.changed')
    handleParkingAreaChanged(payload: ParkingAreaChangedPayload) {
        this.parkingGateway.emitParkingAreaChanged(payload);
    }
}
