import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { ToolRegistry } from '../core/tool.registry';
import { ParkingAreasService } from 'src/parking-areas/parking-areas.service';

@Injectable()
export class ParkingAreaTool implements OnModuleInit {
    constructor(
        private registry: ToolRegistry,
        private parkingAreasService: ParkingAreasService,
    ) { }

    onModuleInit() {
        this.registry.register(
            'get_parking_area_status',
            {
                name: 'get_parking_area_status',
                description: 'Get current parking area status, including counts of available, occupied, and reserved slots by parking area.',
                input_schema: {
                    type: 'object',
                    properties: {},
                },
            },
            this.getParkingAreaStatus.bind(this),
        );

        this.registry.register(
            'get_parking_area_status_by_name',
            {
                name: 'get_parking_area_status_by_name',
                description: 'Get current parking area status by parking area name, including counts of available, occupied, and reserved slots.',
                input_schema: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: 'The id of the parking area' },
                    },
                    required: ['name'],
                },
            },
            this.getParkingAreaStatusByName.bind(this),
        );

        this.registry.register(
            'activate_parking_area',
            {
                name: 'activate_parking_area',
                description: 'Activate a parking area by parking area name.',
                input_schema: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', description: 'The name of the parking area' },
                    },
                    required: ['name'],
                },
            },
            this.activateParkingArea.bind(this),
        );

        this.registry.register(
            'deactivate_parking_area',
            {
                name: 'deactivate_parking_area',
                description: 'Deactivate a parking area by parking area name.',
                input_schema: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', description: 'The name of the parking area' },
                    },
                    required: ['name'],
                },
            },
            this.deactivateParkingArea.bind(this),
        );

        this.registry.register(
            'update_maintenance_slots',
            {
                name: 'update_maintenance_slots',
                description: 'Update the maintenance slots of a parking area by parking area name.',
                input_schema: {
                    type: 'object',
                    properties: {
                        area_name: { type: 'string', description: 'The name of the parking area' },
                        quantity: { type: 'number', description: 'The number of maintenance slots' },
                    },
                },
                required: ['area_name', 'quantity'],
            },
            this.updateMaintenanceSlots.bind(this),
        );

        this.registry.register(
            'update_slots_quantity',
            {
                name: 'update_slots_quantity',
                description: 'Update the slots quantity of a parking area by parking area name.',
                input_schema: {
                    type: 'object',
                    properties: {
                        area_name: { type: 'string', description: 'The name of the parking area' },
                        quantity: { type: 'number', description: 'The number of slots quantity' },
                    },
                    required: ['area_name', 'quantity'],
                },
            },
            this.updateSlotsQuantity.bind(this),
        );
    }

    async getParkingAreaStatus() {
        const status = await this.parkingAreasService.findAllParkingAreas();
        return status.map((s: any) => ({
            name: s.name,
            available_slots: s.available_slots,
            maintenance_slots: s.maintenance_slots,
            total_slots: s.slots_quantity,
            reserved_slots: s.reserved_slots,
        }));
    }

    async getParkingAreaStatusByName(input: { name: string }) {
        const status = await this.parkingAreasService.findParkingAreaByName(input.name);
        if (!status) {
            throw new BadRequestException("Parking area not found");
        }
        return status;
    }

    async activateParkingArea(input: { name: string }) {
        const parkingArea = await this.parkingAreasService.findParkingAreaByName(input.name);
        if (!parkingArea) {
            throw new BadRequestException("Parking area not found");
        }
        return await this.parkingAreasService.activateParkingArea(parkingArea.id);
    }

    async deactivateParkingArea(input: { name: string }) {
        const parkingArea = await this.parkingAreasService.findParkingAreaByName(input.name);
        if (!parkingArea) {
            throw new BadRequestException("Parking area not found");
        }
        return await this.parkingAreasService.deactivateParkingArea(parkingArea.id);
    }

    async updateMaintenanceSlots(input: { area_name: string, quantity: number }) {
        const parkingArea = await this.parkingAreasService.findParkingAreaByName(input.area_name);
        if (!parkingArea) {
            throw new BadRequestException("Parking area not found");
        }
        const result = await this.parkingAreasService.updateMaintenanceSlots(parkingArea.id, input.quantity);
        return {
            area_name: input.area_name,
            affected: result.affected,
        }
    }

    async updateSlotsQuantity(input: { area_name: string, quantity: number }) {
        const parkingArea = await this.parkingAreasService.findParkingAreaByName(input.area_name);
        if (!parkingArea) {
            throw new BadRequestException("Parking area not found");
        }
        const result = await this.parkingAreasService.updateSlotsQuantity(parkingArea.id, input.quantity);
        return {
            area_name: input.area_name,
            affected: result.affected,
        }
    }
}