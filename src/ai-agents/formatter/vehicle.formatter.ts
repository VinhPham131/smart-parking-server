import { Vehicle } from "src/vehicles/entities/vehicles.entity";

export function formatVehicleList(result: any) {
    return {
        type: 'list',
        list_type: 'vehicle',
        meta: {
            total: result.total
        },
        items: result.vehicles.map((vehicle: Vehicle) => ({
            id: vehicle.id,
            license_plate: vehicle.license_plate,
            brand: vehicle.brand,
            color: vehicle.color,
            user: vehicle.user,
            rfid: vehicle.rfid,
        })),
    }
}

export function formatVehicleByUserName(result: any) {
    return {
        type: 'list',
        list_type: 'vehicle',
        meta: {
            total: result.total
        },
        items: result.vehicles.map((vehicle: Vehicle) => ({
            id: vehicle.id,
            license_plate: vehicle.license_plate,
            brand: vehicle.brand,
            color: vehicle.color,
            user: vehicle.user,
            rfid: vehicle.rfid,
        })),
    }
}
