import { Injectable } from "@nestjs/common";
import { ParkingSessionsService } from "src/parking-sessions/parking-sessions.service";

@Injectable()
export class MqttListenerService {
    constructor(
        private readonly parkingSessionsService: ParkingSessionsService,
    ) { }
}