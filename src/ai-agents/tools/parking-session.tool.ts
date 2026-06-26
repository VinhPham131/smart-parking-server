import { Injectable, OnModuleInit } from "@nestjs/common";
import { ToolRegistry } from "../core/tool.registry";
import { ParkingSessionsRepository } from "src/parking-sessions/parking-sessions.repository";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { DateTimeFormat } from "src/constants/config";
import { formatDateTime } from "src/common/utils/date-format.util";

@Injectable()
export class ParkingSessionTool implements OnModuleInit {
    constructor(
        private readonly registry: ToolRegistry,
        private readonly parkingSessionsRepository: ParkingSessionsRepository,
        private readonly eventEmitter: EventEmitter2,
    ) { }

    onModuleInit() {
        this.registry.register(
            'get_current_parking_sessions',
            { 
                name: 'get_current_parking_sessions', 
                description: 'Get current parking sessions',
            },
            this.getCurrentParkingSessions.bind(this),
        );

        this.registry.register(
            'check_insufficient_balance_for_parking_session',
            { 
                name: 'check_insufficient_balance_for_parking_session', 
                description: 'Send notification to user when amount of parking session is more than balance of user',
            },
            this.sendNotificationForInsufficientBalance.bind(this),
        );
    }

    async getCurrentParkingSessions() {
        const parkingSessions = await this.parkingSessionsRepository.findCurrentSessions();
        const total = parkingSessions.length;
        return {
            total,
            parking_sessions: parkingSessions.map(session => ({
                id: session.id,
                vehicle: session.vehicle.license_plate,
                type: session.vehicle.rfid.type,
                parking_area: session.parking_area.name,
                amount: session.amount,
                status: session.status,
                check_in: session.check_in_time,
            })),
        };
    }

    async sendNotificationForInsufficientBalance() {
        const parkingSessions = await this.parkingSessionsRepository.findCurrentSessions();
        let affected = 0;
        for (const session of parkingSessions) {
            console.log(session.amount, session);
            if (session.amount > session.vehicle.user.balance) {
                this.eventEmitter.emit('notification.created', {
                    userId: session.vehicle.user.id,
                    message: 'Your parking session amount is more than your balance. Please check your balance.',
                    metadata: {
                        title: 'Insufficient balance',
                        category: 'user',
                        parkingSessionId: session.id,
                    },
                });
                affected++;
            }
        }
        return {
            success: true,
            affected: affected,
            message: 'Notification sent for insufficient balance for parking session',
        };
    }
}
