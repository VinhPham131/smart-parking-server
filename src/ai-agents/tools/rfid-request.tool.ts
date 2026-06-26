import { Injectable, OnModuleInit } from "@nestjs/common";
import { ToolRegistry } from "../core/tool.registry";
import { RfidRequestsService } from "src/rfid_requests/rfid-requests.service";
import { RfidRequestsRepository } from "src/rfid_requests/rfid-requests.repository";
import { RfidRequest } from "src/rfid_requests/entity/rfid-requests.entity";

@Injectable()
export class RfidRequestTool implements OnModuleInit {
    constructor(
        private registry: ToolRegistry,
        private rfidRequestsRepository: RfidRequestsRepository,
    ) { }

    onModuleInit() {
        this.registry.register(
            'get_rfid_requests',
            {
                name: 'get_rfid_requests',
                description: 'Get all rfid requests.',
            },
            this.getRfidRequests.bind(this),
        );
    }

    async getRfidRequests() {
        const rfidRequests = await this.rfidRequestsRepository.findAllRfidRequests();
        console.log(rfidRequests);
        return {
            total: rfidRequests.length,
            rfidRequests: rfidRequests.map((rfidRequest: RfidRequest) => ({
                id: rfidRequest.id,
                vehicle: rfidRequest.vehicle,
                status: rfidRequest.status,
                user: rfidRequest.vehicle.user.name,
            })),
        }
    }
}