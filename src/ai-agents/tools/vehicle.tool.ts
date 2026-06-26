import { Injectable, OnModuleInit } from "@nestjs/common";
import { ToolRegistry } from "../core/tool.registry";
import { VehiclesService } from "src/vehicles/vehicles.service";
import { Vehicle } from "src/vehicles/entities/vehicles.entity";
import { VehiclesRepository } from "src/vehicles/vehicles.repository";

@Injectable()
export class VehicleTool implements OnModuleInit {
    constructor(
        private registry: ToolRegistry,
        private vehiclesService: VehiclesService,
        private vehiclesRepository: VehiclesRepository,
    ) { }

    onModuleInit() {
        this.registry.register(
            'get_vehicles',
            {
                name: 'get_vehicles',
                description: 'Get all vehicles.',
            },
            this.getVehicles.bind(this),
        );

        this.registry.register(
            'get_vehicles_by_user_name',
            {
                name: 'get_vehicles_by_user_name',
                description: 'Get vehicles by user name.',
                input_schema: {
                    type: 'object',
                    properties: {
                        user_name: { type: 'string', description: 'The name of the user' },
                    },
                },
            },
            this.getVehiclesByUserName.bind(this),
        );
    }

    async getVehicles() {
        const vehicles = await this.vehiclesService.findAllVehicles();
        console.log(vehicles);
        const formattedVehicles = vehicles.map((vehicle: Vehicle) => ({
            id: vehicle.id,
            license_plate: vehicle.license_plate,
            brand: vehicle.brand,
            color: vehicle.color,
            user: vehicle.user.name,
            rfid: vehicle.rfid?.rfid_code,
        }));
        return {
            total: vehicles.length,
            vehicles: formattedVehicles,
        }
    }

    async getVehiclesByUserName(input: { user_name: string }) {
        const vehicles = await this.vehiclesService.findVehiclesByUserName(input.user_name);
        const formattedVehicles = vehicles.map((vehicle: Vehicle) => ({
            id: vehicle.id,
            license_plate: vehicle.license_plate,
            brand: vehicle.brand,
            color: vehicle.color,
            user: vehicle.user.name,
            rfid: vehicle.rfid?.rfid_code,
        }));
        return {
            total: vehicles.length,
            vehicles: formattedVehicles,
        }
    }
}