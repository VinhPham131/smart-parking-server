import { formatParkingHistoryList } from './parking-history.formatter';
import { formatActivateParkingArea, formatDeactivateParkingArea, formatUpdateMaintenanceSlots, formatUpdateSlotsQuantity, getParkingAreaStatus, getParkingAreaStatusByName } from './parking-areas.formatter';
import { formatBulkUpdateReservation, formatReservationByLicensePlate, formatReservationList, formatUserHasSeveralCancelReservation } from './reservation.formatter';
import { formatVehicleByUserName, formatVehicleList } from './vehicle.formatter';
import { formatRfidByStatus, formatRfidByType, formatRfidList } from './rfid.formatter';
import { formatRfidRequestList } from './rfid-request.formatter';
import { formatPaymentList, formatPaymentsByStatus, formatPaymentsByType, formatPaymentsByUserName, formatRevenueByDay, formatRevenueByMonth, formatRevenueByYear } from './payment.formatter';
import { formatInsufficientBalanceForParkingSession, formatParkingSessionList } from './parking-session.formatter';
export function mapToolResponse(toolName: string, result: any) {
    switch (toolName) {
        case 'get_reservations':
            return formatReservationList(result);

        case 'bulk_update_reservation_status':
            return formatBulkUpdateReservation(result);

        case 'get_parking_histories':
            return formatParkingHistoryList(result);

        case 'get_parking_area_status':
            return getParkingAreaStatus(result);

        case 'get_parking_area_status_by_name':
            return getParkingAreaStatusByName(result);

        case 'activate_parking_area':
            return formatActivateParkingArea(result);

        case 'deactivate_parking_area':
            return formatDeactivateParkingArea(result);

        case 'update_maintenance_slots':
            return formatUpdateMaintenanceSlots(result);

        case 'update_slots_quantity':
            return formatUpdateSlotsQuantity(result);

        case 'get_vehicles':
            return formatVehicleList(result);

        case 'get_vehicles_by_user_name':
            return formatVehicleByUserName(result);

        case 'get_rfids':
            return formatRfidList(result);

        case 'get_rfids_by_type':
            return formatRfidByType(result);

        case 'get_rfids_by_status':
            return formatRfidByStatus(result);

        case 'get_rfid_requests':
            return formatRfidRequestList(result);

        case 'get_all_payments':
            return formatPaymentList(result);

        case 'get_payments_by_payment_type':
            return formatPaymentsByType(result);

        case 'get_payments_by_status':
            return formatPaymentsByStatus(result);

        case 'get_payments_by_user_name':
            return formatPaymentsByUserName(result);

        case 'get_reservations_by_license_plate':
            return formatReservationByLicensePlate(result);
        
        case 'get_current_parking_sessions':
            return formatParkingSessionList(result);

        case 'check_insufficient_balance_for_parking_session':
            return formatInsufficientBalanceForParkingSession(result);

        case 'get_user_has_several_cancel_reservation':
            return formatUserHasSeveralCancelReservation(result);

        case 'compare_revenue_by_day':
            return formatRevenueByDay(result);

        case 'compare_revenue_by_month':
            return formatRevenueByMonth(result);

        case 'compare_revenue_by_year':
            return formatRevenueByYear(result);

        default:
            return {
                type: 'text',
                content: 'Unsupported tool response',
            };
    }
}