import { Injectable, OnModuleInit } from "@nestjs/common";
import { AnalyticsService } from "src/analytics/analytics.service";
import { ToolRegistry } from "../core/tool.registry";

@Injectable()
export class AnalyticsTool implements OnModuleInit {
    constructor(
        private readonly registry: ToolRegistry,
        private readonly analyticsService: AnalyticsService,
    ) { }

    onModuleInit() {
        this.registry.register(
            'get_overview',
            { name: 'get_overview', description: 'Get overview data' },
            this.getOverview.bind(this),
        );
    }

    async getOverview() {
        const overview = await this.analyticsService.overview();
        return {
            totalSessions: overview.totalSessions,
            totalRevenue: overview.totalRevenue,
            reservationSuccessRate: overview.reservationSuccessRate,
            averageDuration: overview.averageDuration,
        };
    }
}