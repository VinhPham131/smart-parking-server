import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UsersRepository } from 'src/users/user.repository';

@Injectable()
export class AuthService {
    constructor(
        private usersRepository: UsersRepository,
        private jwtService: JwtService
    ) { }

    async login(loginDto: LoginDto) {
        const user = await this.usersRepository.findUserByEmail(loginDto.email);
        
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
        
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload = { username: user.email, sub: user.id, role: user.role };
        return {
            message: 'Login successfully',
            access_token: await this.jwtService.signAsync(payload),
        };
    }

    async register(registerDto: RegisterDto) {
        const existingUser = await this.usersRepository.findUserByEmail(registerDto.email);
        
        if (existingUser) {
            throw new BadRequestException('User with this email already exists');
        }

        const existingPhoneUser = await this.usersRepository.findUserByPhone(registerDto.phone);
        
        if (existingPhoneUser) {
            throw new BadRequestException('User with this phone number already exists');
        }

        registerDto.password = await bcrypt.hash(registerDto.password, 10)

        const createUserDto: CreateUserDto = {
            ...registerDto,
            role: 'user'
        };

        const user = await this.usersRepository.save(createUserDto);
        
        const {...userWithoutPassword } = user;
        
        return {
            message: 'Register successfully',
            user: userWithoutPassword
        };
    }
}
