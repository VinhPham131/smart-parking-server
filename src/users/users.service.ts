import { Injectable } from '@nestjs/common';
import { UsersRepository } from './user.repository';

@Injectable()
export class UsersService {
    constructor(private usersRepository: UsersRepository) {
    }

    async findAllUsers() {
        return await this.usersRepository.findAllUsers();
    }

    async findVehiclesByUserId(userId: string) {
        return await this.usersRepository.findVehiclesByUserId(userId);
    }

    async findUserByUserId(userId : string) {
        return await this.usersRepository.findUserById(userId)
    }
}
