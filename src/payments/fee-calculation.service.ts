import { Injectable } from "@nestjs/common";
import { ONE_HOUR_IN_MILLISECONDS, OVERNIGHT_END, OVERNIGHT_RATE, OVERNIGHT_START, REGULAR_RATE } from "src/constants/constants";

@Injectable()
export class FeeCalculationService {
    calculateRegularFee(checkIn: Date, asOf: Date): number {
        const billableHours = this.countBillableHours(checkIn, asOf);

        let fee = 0;
        let cursor = new Date(checkIn);
        let billed = 0;

        while (billed < billableHours) {
            const hour = cursor.getHours();
            if (hour === OVERNIGHT_START) {
                fee += OVERNIGHT_RATE;
                cursor.setDate(cursor.getDate() + 1);
                cursor.setHours(OVERNIGHT_END, 0, 0, 0);
            } else {
                fee += REGULAR_RATE;
                cursor = new Date(cursor.getTime() + ONE_HOUR_IN_MILLISECONDS);
            }
            billed++;
        }

        return fee;
    }

    private countBillableHours(checkIn: Date, asOf: Date): number {
        let billableHours = 1;
        let boundary = new Date(checkIn.getTime() + ONE_HOUR_IN_MILLISECONDS);

        while (asOf.getTime() > boundary.getTime()) {
            billableHours++;
            boundary = new Date(boundary.getTime() + ONE_HOUR_IN_MILLISECONDS);
        }

        return billableHours;
    }
}
