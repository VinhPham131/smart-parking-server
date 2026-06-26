import { formatDateTime } from "src/common/utils/date-format.util";
import { DateTimeFormat } from "src/constants/config";
export function formatReservationList(result: any) {
    return {
        type: 'list',
        list_type: 'reservation',

        meta: {
            total: result.total,
            approved: result.approved,
            rejected: result.rejected,
            pending: result.pending,
        },

        items: result.reservations.map((r: any) => ({
            reservation_id: r.reservation_id,
            code: r.reservation_code,
            slot_code: r.slot_code,
            plate: `${r.license_plate}`,
            checkin: formatDateTime(new Date(r.check_in), DateTimeFormat.TIME),
            checkout: formatDateTime(new Date(r.check_out), DateTimeFormat.TIME),
            parking_area: r.parking_area.name,
            status: r.status,
        })),
    };
}


export function formatBulkUpdateReservation(result: any) {
    const isEmpty = result.affected === 0;

    return {
        type: 'action_result',
        status: !result.success
            ? 'error'
            : isEmpty
                ? 'no_change'
                : 'success',

        message: isEmpty
            ? `No reservations found on ${result.date} to update.`
            : result.message,

        meta: {
            date: result.date,
            affected: result.affected,
            new_status: result.new_status,
        },
    };
}

export function formatReservationByLicensePlate(result: any) {
    return {
        type: 'list',
        list_type: 'reservation',

        meta: {
            total: result.total,
            approved: result.approved,
            rejected: result.rejected,
            pending: result.pending,
        },

        items: result.reservations.map((r: any) => ({
            reservation_id: r.reservation_id,
            code: r.reservation_code,
            slot_code: r.slot_code,
            plate: `${r.license_plate}`,
            checkin: formatDateTime(new Date(r.check_in), DateTimeFormat.TIME),
            checkout: formatDateTime(new Date(r.check_out), DateTimeFormat.TIME),
            parking_area: r.parking_area.name,
            status: r.status,
        })),
    };
}

export function formatUserHasSeveralCancelReservation(result: any) {
    return {
        type: 'list',
        list_type: 'user_has_several_cancel_reservation',
        meta: {
            total: result.total,
        },
        items: result.user_has_several_cancel_reservation.map((r: any) => ({
            user_id: r.user_id,
            user_name: r.user_name,
            user_email: r.user_email,
            user_phone: r.user_phone,
            count: r.count,
        })),
    };
}
