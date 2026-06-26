import { Module } from '@nestjs/common';
import { AiAgentService } from './ai-agent.service';
import { AiAgentController } from './ai-agent.controller';

import { ToolRegistry } from './core/tool.registry';
import { ReservationTool } from './tools/reservation.tool';
import { ReservationsModule } from 'src/reservations/reservations.module';
import { MemoryService } from './core/memory.service';
import { LlmService } from './core/llm.service';
import { ParkingHistoryTool } from './tools/parking-history.tool';
import { ParkingHistoryRepository } from 'src/parking-history/parking-history.repository';
import { VehiclesRepository } from 'src/vehicles/vehicles.repository';
import { ParkingSessionsRepository } from 'src/parking-sessions/parking-sessions.repository';
import { ParkingAreasRepository } from 'src/parking-areas/parking-areas.repository';
import { ParkingAreasService } from 'src/parking-areas/parking-areas.service';
import { UsersService } from 'src/users/users.service';
import { UsersRepository } from 'src/users/user.repository';
import { ParkingAreaTool } from './tools/parking-area.tool';
import { VehicleTool } from './tools/vehicle.tool';
import { VehiclesService } from 'src/vehicles/vehicles.service';
import { RfidTool } from './tools/rfid.tool';
import { RfidRepository } from 'src/rfid/rfid.repository';
import { RfidRequestTool } from './tools/rfid-request.tool';
import { RfidRequestsRepository } from 'src/rfid_requests/rfid-requests.repository';
import { PaymentTool } from './tools/payment.tool';
import { PaymentsRepository } from 'src/payments/payments.repository';
import { ParkingSessionTool } from './tools/parking-session.tool';

@Module({
    imports: [ReservationsModule],
    providers: [
        AiAgentService,
        ToolRegistry,
        ReservationTool,
        ParkingHistoryRepository,
        VehiclesRepository,
        ParkingSessionsRepository,
        ParkingHistoryTool,
        ParkingAreaTool,
        MemoryService,
        LlmService,
        ParkingAreasService,
        ParkingAreasRepository,
        UsersService,
        UsersRepository,
        VehiclesService,
        VehicleTool,
        RfidTool,
        RfidRepository,
        RfidRequestTool,
        RfidRequestsRepository,
        PaymentTool,
        PaymentsRepository,
        ParkingSessionTool,
    ],
    controllers: [AiAgentController],
})
export class AiAgentModule { }