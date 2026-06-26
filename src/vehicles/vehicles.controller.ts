import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { VehicleListQuery } from './dto/vehicle-list-querry.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/constants/config';

@Controller('vehicles')
export class VehiclesController {
    constructor(private readonly vehiclesService: VehiclesService) { }

    @HttpCode(HttpStatus.OK)
    @Post()
    async createVehicle(@Body() vehicleDto: CreateVehicleDto, @Req() req) {
        const userId = req.user.id;
        const createdVehicle = await this.vehiclesService.createVehicle(vehicleDto, userId);
        return {
            message: "Vehicle created successfully",
            vehicle: createdVehicle,
        };
    }

    @Roles(UserRole.USER)
    @Get('my-vehicles')
    async getVehiclesByUser(@Req() req) {
        const userId = req.user.id;
        return await this.vehiclesService.findVehicleByUserId(userId);
    }

    @Roles(UserRole.ADMIN)
    @Get()
    async getAllVehicles(@Query() query: VehicleListQuery) {
        return await this.vehiclesService.findVehiclesWithFilters(query);
    }

    @Patch(':id')
    async updateVehicle(@Param('id') vehicleId: string, @Body() vehicleDto: Partial<CreateVehicleDto>) {
        const updatedVehicle = await this.vehiclesService.updateVehicle(vehicleId, vehicleDto);
        return {
            message: "Vehicle updated successfully",
            vehicle: updatedVehicle,
        };
    }

    @Delete(':id')
    async deleteVehicle(@Param('id') vehicleId: string) {
        const deletedVehicle = await this.vehiclesService.deleteVehicle(vehicleId);
        return {
            message: "Vehicle deleted successfully",
            vehicle: deletedVehicle,
        };
    }
}
