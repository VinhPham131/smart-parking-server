import { Injectable, OnModuleInit } from '@nestjs/common';
import { ToolRegistry } from '../core/tool.registry';
import { ReservationsService } from 'src/reservations/reservations.service';
import { ReservationStatus } from 'src/constants/config';
import { Reservation } from 'src/reservations/entity/reservations.entity';
import { ReservationsRepository } from 'src/reservations/reservations.repository';
import { formatDayFromPrompt } from '../utils/day-format';

@Injectable()
export class ReservationTool implements OnModuleInit {
    constructor(
        private registry: ToolRegistry,
        private reservationsService: ReservationsService,
        private reservationsRepository: ReservationsRepository,
    ) { }

    onModuleInit() {
        this.registry.register(
            'bulk_update_reservation_status',
            {
                name: 'bulk_update_reservation_status',
                description: `Approve or reject all Pending reservations on a specific date.
                            - Requires: date (YYYY-MM-DD) and status ("approve" or "reject")
                            - Only affects reservations with Pending status
                            - Returns message with number of affected reservations`,
                input_schema: {
                    type: 'object',
                    properties: {
                        date: {
                            type: 'string',
                            format: 'date',
                            description: 'Target date, e.g. "2026-04-07"',
                        },
                        action: {
                            type: 'string',
                            enum: ['approve', 'reject'],
                        },
                    },
                    required: ['date', 'action'],
                },
            },
            this.bulkUpdateReservationStatusByDate.bind(this),
        );

        this.registry.register(
            'get_reservations',
            {
                name: 'get_reservations',
                description: `Get list of reservations for a specific date.
                            - Requires: date (DD-MM-YYYY)
                            - Returns list of reservations for that date, grouped by status (Pending, Approved, Rejected)
                            - Use when user asks about reservations on a specific date`,
                input_schema: {
                    type: 'object',
                    properties: {
                        date: {
                            type: 'string',
                            format: 'date',
                            description: 'Target date, e.g. "07-04-2026"',
                        },
                    },
                    required: ['date'],
                },
            },
            this.getReservationsByDate.bind(this),
        ); 
        this.registry.register(
            'get_reservations_by_license_plate',
            {
                name: 'get_reservations_by_license_plate',
                description: `Get reservation by license plate.
                            - Requires: license_plate (e.g. "43A-12346")
                            - Returns reservation by license plate`,
                input_schema: {
                    type: 'object',
                    properties: {
                        license_plate: { type: 'string', description: 'The license plate of the vehicle' },
                    },
                    required: ['license_plate'],
                },
            },
            this.getReservationsByLicensePlate.bind(this),
        );

        this.registry.register(
            'get_user_has_several_cancel_reservation',
            {
                name: 'get_user_has_several_cancel_reservation',
                description: `Get user who reserve several times but not check in.
                            - Returns user who reserve several times but not check in`,
            },
            this.getUserHasSeveralCancelReservation.bind(this),
        );
    }
    
    async updateReservationStatus(input: { reservation_id: string; action: 'approve' | 'reject' }) {
        
        const status = input.action === 'approve'
            ? ReservationStatus.APPROVED
            : ReservationStatus.REJECTED;

        await this.reservationsService.updateReservationStatus(input.reservation_id, status);

        return {
            success: true,
            reservation_id: input.reservation_id,
            new_status: status,
            message: `Reservation ${input.reservation_id} has been ${status.toLowerCase()}.`,
        };
    }

    async bulkUpdateReservationStatusByDate(input: { date: string; action: 'approve' | 'reject' }) {
        const status = input.action === 'approve'
            ? ReservationStatus.APPROVED
            : ReservationStatus.REJECTED;
        
        const formattedDate = formatDayFromPrompt(input.date);
        const result = await this.reservationsService.bulkUpdateReservationStatusByDate(
            new Date(formattedDate), 
            status,
        );

        return {
            success: true,
            date: input.date,
            new_status: status,
            affected: result.affected,
            message: `${result.affected} reservation(s) on ${input.date} have been ${status.toLowerCase()}.`,
        };
    }

    async getReservationsByDate(input: { date: string }) {
        if (input.date === 'today') {
            input.date = new Date().toISOString().split('T')[0];
        }
        const formattedDate = formatDayFromPrompt(input.date);
        const reservations = await this.reservationsService.getReservationsByDate(formattedDate);
        const { total, approved, rejected, pending } = this.countReservationsByStatus(reservations);
        const reservation = reservations.map(r => ({
            reservation_id: r.id,
            parking_area: {
                id: r.parking_area.id,
               name: r.parking_area.name,
            },
            reservation_code: r.reservation_code,
            license_plate: r.vehicle.license_plate,
            check_in: r.check_in.toISOString(),
            status: r.status,
        }));
        return { total, approved, rejected, pending, reservations: reservation };
    }

    async getReservationsByLicensePlate(input: { license_plate: string }) {
        const reservations = await this.reservationsService.findReservationByLicensePlate(input.license_plate);
        const { total, approved, rejected, pending } = this.countReservationsByStatus(reservations);
        if (!reservations) {
            return { total: 0, reservations: [] };
        }
        const reservation = reservations.map(r => ({
            reservation_id: r.id,
            parking_area: {
                id: r.parking_area.id,
                name: r.parking_area.name,
            },
            reservation_code: r.reservation_code,
            license_plate: r.vehicle.license_plate,
            check_in: r.check_in.toISOString(),
            status: r.status,
        }));
        return { total, approved, rejected, pending, reservations: reservation };
    }

    private countReservationsByStatus(reservations: any[]) {
        const total = reservations.length;
        const approved = reservations.filter(r => r.status === ReservationStatus.APPROVED).length;
        const rejected = reservations.filter(r => r.status === ReservationStatus.REJECTED).length;
        const pending = reservations.filter(r => r.status === ReservationStatus.PENDING).length;
        return { total, approved, rejected, pending };
    }

    async getUserHasSeveralCancelReservation() {
        const reservations = await this.reservationsRepository.findCancelReservations();
        const userHasSeveralCancelReservation = reservations.reduce((acc, r) => {
            acc[r.vehicle.user.id] = acc[r.vehicle.user.id] || 0;
            acc[r.vehicle.user.id]++;
            return acc;
        }, {});
        return {
            success: true,
            total: Object.keys(userHasSeveralCancelReservation).length,
            user_has_several_cancel_reservation: Object.keys(userHasSeveralCancelReservation).map((userId) => ({
                user_id: userId,
                user_name: reservations.find(r => r.vehicle.user.id === userId)?.vehicle.user.name,
                user_email: reservations.find(r => r.vehicle.user.id === userId)?.vehicle.user.email,
                user_phone: reservations.find(r => r.vehicle.user.id === userId)?.vehicle.user.phone,
                count: userHasSeveralCancelReservation[userId],
            })),
        };
    }
}
