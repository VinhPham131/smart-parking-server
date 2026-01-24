import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('vehicles')
@UseGuards(JwtAuthGuard)

export class VehiclesController {
    constructor(private readonly vehiclesService: VehiclesService) { }

    @HttpCode(HttpStatus.OK)
    @Post()
    async createVehicle(@Body() vehicleDto: CreateVehicleDto, @Req() req) {
        const userId = req.user.id;
        return await this.vehiclesService.createVehicle(vehicleDto, userId);
    }

    @Get()
    async getVehiclesByUser(@Req() req) {
        const userId = req.user.id;
        return await this.vehiclesService.findVehicleByUserId(userId);
    }
}
