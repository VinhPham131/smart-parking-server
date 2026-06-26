import { Injectable } from '@nestjs/common';
import { ParkingHistoryRepository } from 'src/parking-history/parking-history.repository';
import { ParkingSessionsRepository } from 'src/parking-sessions/parking-sessions.repository';
import { RfidRepository } from 'src/rfid/rfid.repository';

@Injectable()
export class AnalyticsService {
    constructor(
        private readonly parkingSessionRepository: ParkingSessionsRepository,
        private readonly parkingHistoryRepository: ParkingHistoryRepository,
        private readonly rfidRepository: RfidRepository,    
    ) { }
    
    async totalParkingSessions(day?: string, month?: string, year?: string) {
        if (day) {
            return await this.parkingSessionRepository.countTotalSessionsByDay(day);
        }
        if (month) {
            return await this.parkingSessionRepository.countTotalSessionsByMonth(month);
        }
        if (year) {
            return await this.parkingSessionRepository.countTotalSessionsByYear(year);
        }
    }

    async totalRevenue(day?: string, month?: string, year?: string) {
        if (day) {
            const result = await this.parkingHistoryRepository.calculateTotalRevenueByDay(day);
            return Number(result.total_revenue);
        }
        if (month) {
            const result = await this.parkingHistoryRepository.calculateTotalRevenueByMonth(month);
            return Number(result.total_revenue);
        }
        if (year) {
            const result = await this.parkingHistoryRepository.calculateTotalRevenueByYear(year);
            return Number(result.total_revenue);
        }
    }

    async averageParkingDuration() {
        const durations = await this.parkingSessionRepository.getParkingSessionsDuration();
        if (durations.length === 0) {
            return 0;
        }
        const totalDuration = durations.reduce((sum, record) => sum + Number(record.duration), 0);
        const averageDuration = totalDuration / durations.length;
        return Number(averageDuration.toFixed(2));
    }

    async reservationSuccessRate(day?: string, month?: string, year?: string) {
        let totalReservations = 0;

        if (day) {
            totalReservations = await this.parkingSessionRepository.countTotalSessionsByDay(day);
        } else if (month) {
            totalReservations = await this.parkingSessionRepository.countTotalSessionsByMonth(month);
        } else if (year) {
            totalReservations = await this.parkingSessionRepository.countTotalSessionsByYear(year);
        }

        if (totalReservations === 0) {
            return 0;
        }

        let successfulReservations = 0;

        if (day) {
            successfulReservations = await this.parkingSessionRepository.countSuccessfulSessionsByDay(day);
        } else if (month) {
            successfulReservations = await this.parkingSessionRepository.countSuccessfulSessionsByMonth(month);
        } else if (year) {
            successfulReservations = await this.parkingSessionRepository.countSuccessfulSessionsByYear(year);
        }

        const successRate = (successfulReservations / totalReservations) * 100;
        return Number(successRate.toFixed(2));
    }

    async rfidTypeRate() {
        const totalRfids = await this.rfidRepository.countAllRfids();
        const memberRfids = await this.rfidRepository.countMemberRfids();

        if (totalRfids === 0) {
            return 0;
        }

        const memberRfidRate = (memberRfids / totalRfids) * 100;
        const regularRfidRate = 100 - memberRfidRate;
        return {
            memberRfidRate: Number(memberRfidRate.toFixed(2)),
            totalRfids: totalRfids,
            regularRfids: Number(regularRfidRate.toFixed(2)),
        }
    }

    async sessionsOverTime() {
        const sessions = await this.parkingSessionRepository.findAllSessions();
        const sessionsByHour = Array(24).fill(0);

        sessions.forEach(session => {
            const checkInHour = session.check_in_time.getHours();
            sessionsByHour[checkInHour]++;
        });

        return sessionsByHour;
    }

    async peakHours() {
        const sessionsByHour = await this.sessionsOverTime();
        const maxSessions = Math.max(...sessionsByHour);
        const peakHours = sessionsByHour
            .map((count, hour) => ({ hour, count }))
            .filter(item => item.count === maxSessions)
            .map(item => item.hour);

        return peakHours;
    }

    async overview(days?: string, month?: string, year?: string) {
        const totalSessions = await this.totalParkingSessions(days, month, year);
        const totalRevenue = await this.totalRevenue(days, month, year);
        const reservationSuccessRate = await this.reservationSuccessRate(days, month, year);
        const averageDuration = await this.averageParkingDuration();
        return {
            totalSessions,
            totalRevenue,
            reservationSuccessRate,
            averageDuration,
        };
    }

    // async occupancyRate(day?: string, month?: string, year?: string) {
    //     const totalSessions = await this.totalParkingSessions(day, month, year);
    //     const totalParkingAreas = await this.parkingAreaRepository.countAllParkingAreas();
    //     return Number(((totalSessions / totalParkingAreas) * 100).toFixed(2));
    // }
}
