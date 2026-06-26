import { DataSource, Repository } from "typeorm";
import { InjectDataSource } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { CreateUserDto } from "./dto/create-user.dto";
import { NotFoundException } from "@nestjs/common";
import { RfidType, UserRole } from "src/constants/config";
import { UserListQuery } from "./dto/user-list-querry.dto";
import { BaseRepository } from "src/common/pagination/base.repository";
import { toIlikePattern } from "src/common/utils/search.util";

export class UsersRepository extends Repository<User> {
    constructor(
        @InjectDataSource() private dataSource: DataSource,
        private baseRepository: BaseRepository,
    ) {
        super(User, dataSource.createEntityManager());
    }

    async findUserByEmail(username: string) {
        return await this.findOne({ where: { email: username } });
    }

    async findUserById(id: string) {
        return await this.findOne({ where: { id: id }, select: ['id', 'name', 'email', 'phone', 'address', 'age', 'balance', 'role', 'created_at', 'updated_at'] });
    }

    async findUserByPhone(phone: string) {
        return await this.findOne({ where: { phone: phone } });
    }

    async createUser(user: CreateUserDto) {
        return await this.save(user);
    }

    async updateUser(id: string, user: Partial<CreateUserDto>) {
        await this.update(id, user);
        return await this.findOne({ where: { id: id } });
    }

    async deleteUser(id: string) {
        const user = await this.findOne({ where: { id } });

        if (!user) {
            throw new NotFoundException("User not found");
        }

        return await this.remove(user);
    }

    async findUsersWithFilters(query: UserListQuery) {
        const { page, limit, role, is_has_vehicle, keyword } = query;

        const qb = this.dataSource.getRepository(User).createQueryBuilder('user')
            .leftJoinAndSelect('user.vehicles', 'vehicles')
            .leftJoinAndSelect('vehicles.rfid', 'vehicle_rfid')

        if (role) {
            qb.andWhere('user.role = :role', { role });
        }

        if (is_has_vehicle === true) {
            qb.andWhere('vehicles.id IS NOT NULL');
        } else if (is_has_vehicle === false) {
            qb.andWhere('vehicles.id IS NULL');
        }

        const keywordPattern = toIlikePattern(keyword);
        if (keywordPattern) {
            qb.andWhere(
                '(user.name ILIKE :keyword OR user.email ILIKE :keyword OR user.phone ILIKE :keyword OR vehicles.license_plate ILIKE :keyword)',
                { keyword: keywordPattern },
            );
        }

        qb.orderBy('user.created_at', 'DESC');

        return this.baseRepository.paginate(qb, page, limit);
    }

    async findUserByVehicleId(vehicleId: string) {
        return await this.findOne({
            where: { vehicles: { id: vehicleId } },
        });
    }

    async findAllAdminUsers() {
        const admins = await this.find(
            {
                where: { role: UserRole.ADMIN },
                select: ['id']
            }
        );
        return admins.map((admin) => admin.id);
    }

    async findAllMemberUsers() {
        return await this.find({ where: { vehicles: { rfid: { type: RfidType.MEMBER } } } });
    }
}