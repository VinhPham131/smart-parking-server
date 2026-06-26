import { Rfid } from "src/rfid/entities/rfid.entity";

export function formatRfidList(result: any) {
    return {
        type: 'list',
        list_type: 'rfid',
        meta: {
            total: result.total
        },
        items: result.rfids.map((rfid: Rfid) => ({
            id: rfid.id,
            rfid_code: rfid.rfid_code,
            is_active: rfid.is_active,
            vehicle: rfid.vehicle,
            type: rfid.type,
            issued_date: rfid.issued_date,
            expired_date: rfid.expired_date,
        })),
    }
}

export function formatRfidByType(result: any) {
    return {
        type: 'list',
        list_type: 'rfid',
        meta: {
            total: result.total
        },
        items: result.rfids.map((rfid: Rfid) => ({
            id: rfid.id,
            rfid_code: rfid.rfid_code,
            is_active: rfid.is_active,
            vehicle: rfid.vehicle,
            type: rfid.type,
            issued_date: rfid.issued_date,
            expired_date: rfid.expired_date,
        })),
    }
}

export function formatRfidByStatus(result: any) {
    return {
        type: 'list',
        list_type: 'rfid',
        meta: {
            total: result.total
        },
        items: result.rfids.map((rfid: Rfid) => ({
            id: rfid.id,
            rfid_code: rfid.rfid_code,
            is_active: rfid.is_active,
            vehicle: rfid.vehicle,
            type: rfid.type,
            issued_date: rfid.issued_date,
            expired_date: rfid.expired_date,
        })),
    }
}