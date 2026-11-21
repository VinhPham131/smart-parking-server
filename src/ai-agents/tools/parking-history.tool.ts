import { Injectable, OnModuleInit } from "@nestjs/common";
import { ToolRegistry } from "../core/tool.registry";
import { ParkingHistoryRepository } from '../../parking-history/parking-history.repository';
import { formatDayFromPrompt } from "../utils/day-format";

@Injectable()
export class ParkingHistoryTool implements OnModuleInit {
    constructor(
        private registry: ToolRegistry,
        private ParkingHistoryRepository: ParkingHistoryRepository,
    ) { }

    onModuleInit() {
        this.registry.register(
            'get_parking_histories',
            {
                name: 'get_parking_histories',
                description: `Get parking history.
                            - Input: optional date, optional plate (e.g. "43A-12346")
                            - Date: prefer the user's original string (e.g. "08/07/2026"); backend converts DD/MM/YYYY → YYYY-MM-DD. If converting yourself: "08/07/2026" → "2026-07-08" (day first, not US month/day)
                            - Returns parking history filtered by provided parameters`,
                input_schema: {
                    type: 'object',
                    properties: {
                        date: {
                            type: 'string',
                            description: 'Target date. Prefer as written by user (DD/MM/YYYY). Example: "08/07/2026" means 8 July → backend yields 2026-07-08. Never pass "2026-08-07" for "08/07/2026".',
                        },
                        plate: {
                            type: 'string',
                            description: 'License plate number, e.g. "43A-12346"',
                        },
                    },
                },
            },
            this.getParkingHistories.bind(this),
        ); 
    }
    
    async getParkingHistories(input: { date?: string; plate?: string }) {
        let fromDate: string | undefined;
        let toDate: string | undefined;

        if (input.date) {
            fromDate = formatDayFromPrompt(input.date);
            toDate = fromDate;
        }

        const query: any = {
            from_date: fromDate,
            to_date: toDate,
            keyword: input.plate,
            page: 1,
            limit: 50,
        };

        const histories = await this.ParkingHistoryRepository.findWithFilters(query);

        const formatted = histories.data.map(h => ({
            plate: h.vehicle.license_plate,
            checkin: h.parking_session.check_in_time,
            checkout: h.parking_session.check_out_time,
            status: h.parking_session.status,
            amount: h.parking_session.amount,
            payment_method: h.payment_method,
        }));

        return {
            data: formatted,
        };
    }
}