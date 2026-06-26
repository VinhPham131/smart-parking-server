import { RfidRequest } from "src/rfid_requests/entity/rfid-requests.entity";

export function formatRfidRequestList(result: any) {
    return {
        type: 'list',
        list_type: 'rfid_request',
        meta: {
            total: result.total
        },
        items: result.rfidRequests.map((rfidRequest: any) => ({
            id: rfidRequest.id,
            vehicle: rfidRequest.vehicle,
            status: rfidRequest.status,
            user: rfidRequest.user
        })),
    }
}