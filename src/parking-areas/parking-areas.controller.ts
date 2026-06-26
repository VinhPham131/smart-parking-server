import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ParkingAreasService } from './parking-areas.service';
import { CreateParkingAreaDto } from './dto/create-parking-areas.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/constants/config';
import { Public } from 'src/common/decorators/public.decorator';
import { ParkingAreaQuerry } from './dto/list-parking-area-querry.dto';

@Controller('parking-areas')
export class ParkingAreasController {
    constructor(private readonly parkingAreasService: ParkingAreasService) {}

    @Public()
    @HttpCode(HttpStatus.OK)
    @Get()
    findAllParkingAreas(@Query() filter: ParkingAreaQuerry) {
        return this.parkingAreasService.findAllParkingAreasByFilter(filter);
    }

    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    @Post()
    async createParkingArea(@Body() dto: CreateParkingAreaDto) {
        const createdParkingArea = await this.parkingAreasService.createParkingArea(dto);
        return {
            message: "Parking area created successfully",
            parkingArea: createdParkingArea,
        };
    }

    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    @Patch(':id/slots-quantity')
    async updateSlotsQuantity(@Param('id') id: string, @Body('slotsQuantity') slotsQuantity: number) {
        const updatedSlotsQuantity = await this.parkingAreasService.updateSlotsQuantity(id, slotsQuantity);
        return {
            message: "Slots quantity updated successfully",
            slotsQuantity: updatedSlotsQuantity,
        };
    }

    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    @Patch(':id/maintenance-slots')
    async updateMaintenanceSlots(@Param('id') id: string, @Body('maintenanceSlots') maintenanceSlots: number) {
        const updatedMaintenanceSlots = await this.parkingAreasService.updateMaintenanceSlots(id, maintenanceSlots);
        return {
            message: "Maintenance slots updated successfully",
            maintenanceSlots: updatedMaintenanceSlots.affected,
        };
    }

    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    @Patch(':id/deactivate')
    async deactivateParkingArea(@Param('id') id: string) {
        const deactivatedParkingArea = await this.parkingAreasService.deactivateParkingArea(id);
        return {
            message: "Parking area deactivated successfully",
            parkingArea: deactivatedParkingArea,
        };
    }

    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    @Patch(':id/activate')
    async activateParkingArea(@Param('id') id: string) {
        const activatedParkingArea = await this.parkingAreasService.activateParkingArea(id);
        return {
            message: "Parking area activated successfully",
            parkingArea: activatedParkingArea,
        };
    }
}
