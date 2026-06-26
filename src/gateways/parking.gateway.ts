import {
    ConnectedSocket,
    OnGatewayConnection,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import { UserRole } from 'src/constants/config';
import { ADMIN_ROOM, PARKING_AREA_CHANGED_EVENT, PARKING_HISTORY_CHANGED_EVENT } from './constants';
export interface ParkingHistoryChangedPayload {
    action: 'checkin' | 'checkout';
    userId: string;
    parkingAreaId?: string;
    historyId?: string;
}

export interface ParkingAreaChangedPayload {
    action:
    | 'created'
    | 'updated'
    | 'activated'
    | 'deactivated'
    | 'slot-occupied'
    | 'slot-released'
    | 'slots-updated'
    | 'maintenance-updated'
    | 'reserved-incremented'
    | 'reserved-decremented';
    areaId: string;
}

@WebSocketGateway({
    cors: {
        origin: 'http://localhost:5173',
    },
})
export class ParkingGateway implements OnGatewayConnection {
    @WebSocketServer()
    server: Server;

    async handleConnection(@ConnectedSocket() client: Socket) {
        const token = client.handshake.auth?.token;
        if (!token) {
            return;
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET as string,
        ) as { role?: string };

        if (decoded.role === UserRole.ADMIN) {
            await client.join(ADMIN_ROOM);
        }

    }

    emitParkingHistoryChanged(payload: ParkingHistoryChangedPayload) {
        this.server.to(payload.userId).emit(PARKING_HISTORY_CHANGED_EVENT, payload);
        this.server.to(ADMIN_ROOM).emit(PARKING_HISTORY_CHANGED_EVENT, payload);
    }

    emitParkingAreaChanged(payload: ParkingAreaChangedPayload) {
        this.server.emit(PARKING_AREA_CHANGED_EVENT, payload);
    }
}
