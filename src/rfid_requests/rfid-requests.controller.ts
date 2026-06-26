import { Body, Controller, Get, NotFoundException, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { RfidRequestsService } from './rfid-requests.service';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RfidRequestStatus, UserRole } from 'src/constants/config';
import { RfidRequestQuerry } from './dto/list-rfid-request-querry.dto';
import { RfidService } from 'src/rfid/rfid.service';

@Controller('rfid-requests')
export class RfidRequestsController {
  constructor(
    private readonly rfidRequestsService: RfidRequestsService,
  ) {}

  @Roles(UserRole.ADMIN)
  @Get()
  async findAllRfidRequestsWithFilters(@Query() query: RfidRequestQuerry) {
    return this.rfidRequestsService.findAllRfidRequestsWithFilters(query);
  }

  @Roles(UserRole.USER)
  @Get('my-rfid-requests')
  async findMyRfidRequestsWithFilters(@Query('status') status: RfidRequestStatus, @Req() req) {
    const userId = req.user.id;
    return this.rfidRequestsService.findMyRfidRequestsWithFilters(userId, status);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id')
  async updateRfidRequestStatus(@Param('id') id: string, @Body('status') status: RfidRequestStatus) {
   await this.rfidRequestsService.updateRfidRequestStatus(id, status);
   return {
    message: 'Rfid request status updated successfully',
   };
  }

  @Roles(UserRole.USER)
  @Post()
  async createRfidRequest(@Body('vehicleId') vehicleId: string) {
    return this.rfidRequestsService.createRfidRequest(vehicleId);
  }
}
