import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query, Req } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ReservationStatus, UserRole } from 'src/constants/config';
import { ReservationListQuery } from './dto/reservations-list-querry.dto';
import { MyReservationListQuery } from './dto/my-reservations-list-querry.dto';
import { Roles } from 'src/common/decorators/roles.decorator';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) { }

  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @Get()
  async findReservationsWithFilters(@Query() query: ReservationListQuery) {
    return this.reservationsService.findReservationsWithFilters(query);
  }

  @Roles(UserRole.USER)
  @HttpCode(HttpStatus.OK)
  @Post()
  async createReservation(@Body() dto: CreateReservationDto) {
    const createdReservation = await this.reservationsService.createReservation(dto);
    return {
      message: "Reservation created successfully",
      reservation: createdReservation,
    };
  }

  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  async deleteReservation(@Param('id') id: string) {
    await this.reservationsService.deleteReservation(id);
    return {
      message: "Reservation deleted successfully",
    };
  }

  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @Post(':id/status')
  async updateReservationStatus(@Param('id') id: string, @Body('status') status: ReservationStatus) {
    await this.reservationsService.updateReservationStatus(id, status);
    return {
      message: "Reservation status updated successfully",
    };
  }

  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @Post('bulk-status')
  async bulkUpdateReservationStatus(
    @Body('date') date: string,
    @Body('status') status: ReservationStatus,
  ) {
    const dateObj = new Date(date);
    const result = await this.reservationsService.bulkUpdateReservationStatusByDate(dateObj, status);
    return {
      message: `${result.affected} reservation(s) updated to ${status}.`,
      affected: result.affected,
    };
  }

  @Roles(UserRole.USER)
  @HttpCode(HttpStatus.OK)
  @Get('my-reservations')
  async getMyReservations(@Req() req, @Query() query: MyReservationListQuery) {
    const userId = req.user.id;
    return await this.reservationsService.findReservationByUserId(userId, query);
  }
}
