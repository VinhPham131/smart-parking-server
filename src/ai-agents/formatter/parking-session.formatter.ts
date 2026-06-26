import { formatDateTime } from "src/common/utils/date-format.util";
import { DateTimeFormat } from "src/constants/config";

export function formatParkingSessionList(result: any) {
    return {
        type: 'list',
        list_type: 'parking_session',
        meta: {
            total: result.total,
        },

        items: result.parking_sessions.map((r: any) => ({
            id: r.id,
            vehicle: r.vehicle,
            type: r.type,
            parking_area: r.parking_area,
            amount: r.amount,
            status: r.status,
            check_in: formatDateTime(new Date(r.check_in), DateTimeFormat.DATE_TIME),
        })),
    };
}

export function formatInsufficientBalanceForParkingSession(result: any) {
    const isEmpty = result.affected === 0;

    return {
        type: 'action_result',
        status: !result.success
            ? 'error'
            : isEmpty
                ? 'no_change'
                : 'success',

        message: isEmpty
            ? `No user has insufficient balance for parking session`
            : `${result.affected} user(s) have insufficient balance for parking session`,
    };
}