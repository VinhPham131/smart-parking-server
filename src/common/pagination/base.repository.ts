import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { PaginationUtil } from '../utils/pagination.util';


export class BaseRepository {
    async paginate<T extends ObjectLiteral>(
        qb: SelectQueryBuilder<T>,
        page: number,
        limit: number,
    ) {
        const skip = PaginationUtil.getSkip(page, limit);

        const [data, total] = await qb
            .skip(skip)
            .take(limit)
            .getManyAndCount();

        return PaginationUtil.buildResult(data, total, page, limit);
    }
}