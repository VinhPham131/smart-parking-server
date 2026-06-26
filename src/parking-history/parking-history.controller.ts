import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { ParkingHistoryService } from './parking-history.service';
import { ParkingHistoryListQuery } from './dto/parking-history-list-query.dto';
import { MyParkingHistoryListQuery } from './dto/my-parking-history-list-querry.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/constants/config';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('parking-history')
export class ParkingHistoryController {
    constructor(private readonly parkingHistoryService: ParkingHistoryService) { }

    @Roles(UserRole.USER)
    @Get('my-histories')
    async getVehiclesByUser(@Req() req, @Query() query: MyParkingHistoryListQuery) {
        const userId = req.user.id;
        return await this.parkingHistoryService.findParkingHistoryByUserId(userId, query);
    }

    @Public()
    @Get(':id')
    async getParkingHistoryById(@Param('id') id: string) {
        return await this.parkingHistoryService.findParkingHistoryById(id);
    }

    @Roles(UserRole.ADMIN)
    @Get()
    async getAllParkingHistories(@Query() query: ParkingHistoryListQuery) {
        return await this.parkingHistoryService.findAllParkingHistories(query);
    }
}
