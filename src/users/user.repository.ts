import { DataSource, Repository } from "typeorm";
import { InjectDataSource } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { CreateUserDto } from "./dto/create-user.dto";

export class UsersRepository extends Repository<User> {
    constructor(@InjectDataSource() private dataSource: DataSource) {
        super(User, dataSource.createEntityManager());
    }

    async findUserByEmail(username: string) {
        return await this.findOne({ where: { email: username } });
    }

    async findUserById(id: string) {
        return await this.findOne({ where: { id: id } });
    }

    async findUserByPhone(phone: string) {
        return await this.findOne({ where: { phone: phone } });
    }

    async createUser(user: CreateUserDto) {
        return await this.save(user);
    }

    async findAllUsers() {
        return await this.find();
    }

    async findVehiclesByUserId(id: string) {
        const user = await this.findOne({ where: { id: id }, relations: ['vehicles'] });
        return user?.vehicles || [];
    }
}