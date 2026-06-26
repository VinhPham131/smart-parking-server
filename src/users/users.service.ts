import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersRepository } from './user.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';
import { UserListQuery } from './dto/user-list-querry.dto';
import { AppCacheService } from 'src/cache/app-cache.service';
import { CacheKeys, CacheVersionKeys } from 'src/cache/cache.keys';

@Injectable()
export class UsersService {
    constructor(
        private usersRepository: UsersRepository,
        private readonly appCache: AppCacheService,
    ) {}

    async findAllUsers(query: UserListQuery) {
        return this.appCache.cachedAdminList(
            'users',
            CacheVersionKeys.admin.users,
            query,
            () => this.usersRepository.findUsersWithFilters(query),
        );
    }

    async createUser(dto: CreateUserDto) {
        const existingUser = await this.usersRepository.findUserByEmail(dto.email);

        if (existingUser) {
            throw new BadRequestException('User with this email already exists');
        }

        const existingPhoneUser = await this.usersRepository.findUserByPhone(dto.phone);

        if (existingPhoneUser) {
            throw new BadRequestException('User with this phone number already exists');
        }

        dto.password = await bcrypt.hash(dto.password, 10)

        const createUserDto: CreateUserDto = {
            ...dto
        };

        const user = await this.usersRepository.createUser(createUserDto);
        await this.appCache.invalidateAdminUsers();
        return user;
    }

    async updateUser(id: string, user: Partial<CreateUserDto>) {
        const existingUser = await this.usersRepository.findOne({ where: { id } });
        if (!existingUser) {
            throw new BadRequestException("User not found.");
        }
        if (user.email && user.email !== existingUser.email) {
            const userWithSameEmail = await this.usersRepository.findUserByEmail(user.email);
            if (userWithSameEmail) {
                throw new BadRequestException("Another user with this email already exists.");
            }

        }

        if (user.phone && user.phone !== existingUser.phone) {
            const userWithSamePhone = await this.usersRepository.findUserByPhone(user.phone);
            if (userWithSamePhone) {
                throw new BadRequestException("Another user with this phone number already exists.");
            }
        }

        const updated = await this.usersRepository.updateUser(id, user);
        await this.appCache.invalidateUserProfile(id);
        await this.appCache.invalidateAdminUsers();
        return updated;
    }

    async deleteUser(id: string) {
        const deleted = await this.usersRepository.deleteUser(id);
        await this.appCache.invalidateUserProfile(id);
        await this.appCache.invalidateAdminUsers();
        return deleted;
    }

    async findUserByUserId(userId: string) {
        return this.appCache.getOrSet(
            CacheKeys.userProfile(userId),
            this.appCache.ttlMs('CACHE_TTL_USER_PROFILE_SECONDS', 300),
            () => this.usersRepository.findUserById(userId),
        );
    }

    async findUserByVehicleId(vehicleId: string) {
        return await this.usersRepository.findUserByVehicleId(vehicleId);
    }

    async changePassword(userId: string, dto: ChangePasswordDto) {
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new BadRequestException('User not found');
        }

        const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
        if (!isMatch) {
            throw new BadRequestException('Current password is incorrect');
        }
        
        const hashed = await bcrypt.hash(dto.newPassword, 10);
        await this.usersRepository.updateUser(userId, { password: hashed });
        return { message: 'Password changed successfully' };
    }

    async findAllAdminUsers() {
        return await this.usersRepository.findAllAdminUsers();
    }
}
