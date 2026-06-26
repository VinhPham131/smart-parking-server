import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserListQuery } from './dto/user-list-querry.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/constants/config';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Roles(UserRole.USER)
    @Get('my-profile')
    async getUserProfile(@Req() req) {
        const userId = req.user.id;
        return await this.usersService.findUserByUserId(userId);
    }

    @Roles(UserRole.USER)
    @HttpCode(HttpStatus.OK)
    @Patch('my-profile')
    async updateMyProfile(@Req() req, @Body() dto: UpdateMyProfileDto) {
        const userId = req.user.id;
        return await this.usersService.updateUser(userId, dto);
    }

    @Roles(UserRole.USER)
    @HttpCode(HttpStatus.OK)
    @Post('my-profile/change-password')
    async changePassword(@Req() req, @Body() dto: ChangePasswordDto) {
        const userId = req.user.id;
        return await this.usersService.changePassword(userId, dto);
    }

    @Roles(UserRole.ADMIN)
    @Get()
    async getAllUsers(@Query() query: UserListQuery) {
        return await this.usersService.findAllUsers(query);
    }

    @HttpCode(HttpStatus.OK)
    @Patch(':id')
    async updateUser(@Param('id') userId: string, @Body() user: Partial<CreateUserDto>) {
        const updatedUser = await this.usersService.updateUser(userId, user);
        return {
            message: "User updated successfully",
            user: updatedUser,
        };
    }

    @HttpCode(HttpStatus.OK)
    @Delete(':id')
    async deleteUser(@Param('id') userId: string) {
        const deletedUser = await this.usersService.deleteUser(userId);
        return {
            message: "User deleted successfully",
            user: deletedUser,
        };
    }

    @HttpCode(HttpStatus.OK)
    @Post()
    async createUser(@Body() createUserDto: CreateUserDto) {
        const createdUser = await this.usersService.createUser(createUserDto);
        return {
            message: "User created successfully",
            user: createdUser,
        };
    }

}
