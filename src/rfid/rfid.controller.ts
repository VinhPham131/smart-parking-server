import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, Req } from "@nestjs/common";
import { RfidService } from "./rfid.service";
import { RfidType, UserRole } from "src/constants/config";
import { UpdateRfidDto } from "./dto/update-rfid.dto";
import { RfidListQuery } from "./dto/rfid-list-querry.dto";
import { Roles } from "src/common/decorators/roles.decorator";

@Controller('rfid')
export class RfidController {
    constructor(private readonly rfidService: RfidService) { }

    @Roles(UserRole.ADMIN)
    @Get()
    async findRfidsWithFilters(@Query() query: RfidListQuery) {
        return this.rfidService.findRfidsWithFilters(query);
    }

    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    @Post()
    async createRfid(@Body('rfid_code') rfid_code: string, @Body('type') type: RfidType) {
        return this.rfidService.createRfid(rfid_code, type);
    }

    @Roles(UserRole.USER)
    @HttpCode(HttpStatus.OK)
    @Patch('subscribe')
    async subscribeToMemberRfid(@Req() req) {
        const userId = req.user.id;
        await this.rfidService.updateRfidType(userId, RfidType.MEMBER);
        return {
            message: 'Subscribed to member RFID successfully'
        };
    }

    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    @Patch(':id')
    async updateRfid(@Param('id') id: string, @Body() dto: UpdateRfidDto) {
        return this.rfidService.updateRfid(id, dto);
    }

    @Roles(UserRole.ADMIN)
    @Delete()
    async deleteRfid(@Body('id') id: string) {
        return this.rfidService.deleteRfid(id);
    }

    @Roles(UserRole.USER)
    @Get('my-rfid')
    async getMyRfid(@Req() req) {
        const userId = req.user.id;
        return this.rfidService.findRfidByUserId(userId);
    }
}