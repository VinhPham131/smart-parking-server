import { PaginatedResponse } from "../pagination/pagination.interface";

export class PaginationUtil {
    static getSkip(page: number, limit: number): number {
        return (page - 1) * limit;
    }

    static buildMeta(total: number, page: number, limit: number) {
        return {
            total,
            page,
            limit,
            total_pages: Math.ceil(total / limit),
        };
    }

    static buildResult<T>(
        data: T[],
        total: number,
        page: number,
        limit: number,
    ): PaginatedResponse<T> {
        return {
            data,
            pagination: this.buildMeta(total, page, limit),
        };
    }
}