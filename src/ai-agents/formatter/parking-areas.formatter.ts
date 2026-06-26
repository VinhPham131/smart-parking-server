
export function getParkingAreaStatus(result: any) {
    const rows = Array.isArray(result) ? result : [result];

    const items = rows.map((row) => ({
        name: row.name,
        available_slots: row.available_slots,
        maintenance_slots: row.maintenance_slots,
        total_slots: row.total_slots ?? row.slots_quantity ?? 0,
        reserved_slots: row.reserved_slots,
    }));

    return {
        type: 'list',
        list_type: 'parking_area',
        meta: {
            total: items.length,
        },
        items,
    };
}

export function getParkingAreaStatusByName(result: any) {
    return {
        type: 'list',
        list_type: 'parking_area',
        meta: {},
        items: {
            name: result.name,
            available_slots: result.available_slots,
            maintenance_slots: result.maintenance_slots,
            total_slots: result.slots_quantity,
            reserved_slots: result.reserved_slots,
        },
    }
}

export function formatActivateParkingArea(result: any) {
    return {
        type: 'action_result',
        status: !result.success
            ? 'error'
            : 'success',

        message: !result.success
            ? 'Parking area not found to activate.'
            : `Parking area ${result.name} has been activated.`,

        meta: {
        },
    };
}

export function formatDeactivateParkingArea(result: any) {

    return {
        type: 'action_result',
        status: !result.success
            ? 'error'
            : 'success',

        message: !result.success
            ? 'Parking area not found to deactivate.'
            : `Parking area ${result.name} has been deactivated.`,

        meta: {
        },
    };
}

export function formatUpdateMaintenanceSlots(result: any) {
    const isEmpty = result.affected === 0;
    return {
        type: 'action_result',
        status: isEmpty
            ? 'no_change'
            : 'success',

        message: isEmpty
            ? `No parking area found to update maintenance slots.`
            : `Parking area ${result.area_name} has been updated maintenance slots.`,
    }
}

export function formatUpdateSlotsQuantity(result: any) {
    const isEmpty = result.affected === 0;
    return {
        type: 'action_result',
        status: isEmpty
            ? 'no_change'
            : 'success',

        message: isEmpty
            ? `No parking area found to update slots quantity.`
            : `Parking area ${result.area_name} has been updated slots quantity.`,
    }
}