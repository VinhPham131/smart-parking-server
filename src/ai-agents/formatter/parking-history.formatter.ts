import { DateTimeFormat } from "src/constants/config";
import { formatDateTime } from "src/common/utils/date-format.util";
export function formatParkingHistoryList(result: any) {
    return {
        type: 'list',
        list_type: 'parking_history',
        meta: {
            
        },

        items: result.data.map((r: any) => ({
            slot_code: r.slot_code,
            plate: r.plate,
            checkin: r.checkin
                ? formatDateTime(new Date(r.checkin), DateTimeFormat.DATE_TIME)
                : null,
            checkout: r.checkout
                ? formatDateTime(new Date(r.checkout), DateTimeFormat.DATE_TIME)
                : null,
            status: r.status,
            amount: r.amount,
            payment_method: r.payment_method,
        })),
    };
}