import { BadRequestException, Injectable, OnModuleInit } from "@nestjs/common";
import { ToolRegistry } from "../core/tool.registry";
import { RfidService } from "src/rfid/rfid.service";
import { Rfid } from "src/rfid/entities/rfid.entity";
import { RfidRepository } from "src/rfid/rfid.repository";
import { RfidType } from "src/constants/config";

@Injectable()
export class RfidTool implements OnModuleInit {
    constructor(
        private registry: ToolRegistry,
        private rfidRepository: RfidRepository,
    ) { }

    onModuleInit() {
        this.registry.register(
            'get_rfids',
            {
                name: 'get_rfids',
                description: 'Get all rfids.',
            },
            this.getRfids.bind(this),
        );

        this.registry.register(
            'get_rfids_by_type',
            {
                name: 'get_rfids_by_type',
                description: 'Get rfids by type.',
                input_schema: {
                    type: 'object',
                    properties: {
                        type: { type: 'string', enum: RfidType },
                    },
                },
            },
            
            this.getRfidsByType.bind(this),
        );

        this.registry.register(
            'get_rfids_by_status',
            {
                name: 'get_rfids_by_status',
                description: 'Get rfids by status.',
                input_schema: {
                    type: 'object',
                    properties: {
                        status: { type: 'boolean' },
                    },
                },
            },
            
            this.getRfidsByStatus.bind(this),
        );
    }

    async getRfids() {
        const rfids = await this.rfidRepository.findAllRfids();
        const formattedRfids = rfids.map((rfid: Rfid) => ({
            id: rfid.id,
            rfid_code: rfid.rfid_code,
            is_active: rfid.is_active,
            vehicle: rfid.vehicle?.license_plate,
            type: rfid.type,
            issued_date: rfid.issued_date,
            expired_date: rfid.expired_date,
        }));
        return {
            total: rfids.length,
            rfids: formattedRfids,
        }
    }

    async getRfidsByType(input: { type: RfidType }) {
        const rfids = await this.rfidRepository.findRfidByType(input.type);
        const formattedRfids = rfids.map((rfid: Rfid) => ({
            id: rfid.id,
            rfid_code: rfid.rfid_code,
            is_active: rfid.is_active,
            vehicle: rfid.vehicle?.license_plate,
            type: rfid.type,
            issued_date: rfid.issued_date,
            expired_date: rfid.expired_date,
        }));

        return {
            total: rfids.length,
            rfids: formattedRfids,
        }
    }

    async getRfidsByStatus(input: { status: string }) {
        let status: boolean;
        if (input.status === 'inactive') {
            status = false;
        } else if (input.status === 'active') {
            status = true;
        } else {
            throw new BadRequestException('Invalid status');
        }

        const rfids = await this.rfidRepository.findRfidByStatus(status);

        const formattedRfids = rfids.map((rfid: Rfid) => ({
            id: rfid.id,
            rfid_code: rfid.rfid_code,
            is_active: rfid.is_active,
            vehicle: rfid.vehicle?.license_plate,
            type: rfid.type,
        }));

        return {
            total: rfids.length,
            rfids: formattedRfids,
        };
    }
}