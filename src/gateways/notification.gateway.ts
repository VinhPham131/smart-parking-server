import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';

@WebSocketGateway({
    cors: {
        origin: 'http://localhost:5173',
    },
})
export class NotificationGateway implements OnGatewayConnection {
    @WebSocketServer()
    server: Server;

    async handleConnection(@ConnectedSocket() client: Socket) {
        try {
            const token = client.handshake.auth?.token;

            if (!token) {
                client.disconnect();
                return;
            }

            const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);

            const userId = decoded.sub || decoded.id;

            if (!userId) {
                client.disconnect();
                return;
            }

            await client.join(userId);

            console.log(`Client ${client.id} joined room ${userId}`);
        } catch (err) {
            console.error('WS Auth error:', err.message);
            client.disconnect();
        }
    }

    sendNotification(payload: {
        userId: string;
        message: string;
        metadata?: any;
    }) {
        this.server.to(payload.userId).emit('notification', payload);
    }
}