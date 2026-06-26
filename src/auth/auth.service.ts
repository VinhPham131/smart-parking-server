import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UsersRepository } from 'src/users/user.repository';
import { UsersService } from 'src/users/users.service';
import { UserRole } from 'src/constants/config';
import { forgotPasswordTemplate } from 'src/mail/mail.template';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class AuthService {
    constructor(
        private usersRepository: UsersRepository,
        private jwtService: JwtService,
        private usersService: UsersService,
        private mailService: MailService,
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

        const expiresIn = loginDto.remember_me ? '30d' : '1d';

        const accessToken = await this.jwtService.signAsync(payload, {
            expiresIn,
        });
        return {
            message: 'Login successfully',
            access_token: accessToken,
        };
    }

    async register(registerDto: RegisterDto) {
        const user = await this.usersService.createUser({
            ...registerDto,
            role: UserRole.USER
        } as CreateUserDto);

        const payload = { username: user.email, sub: user.id, role: user.role };
        return {
            message: 'Register successfully',
            access_token: await this.jwtService.signAsync(payload),
        };
    }

    async forgotPassword(email: string) {
        const user = await this.usersRepository.findUserByEmail(email);
        if (!user) {
            throw new UnauthorizedException('Invalid email');
        }

        const passwordResetToken = await this.jwtService.signAsync({ email: user.email }, { expiresIn: '5m' });
        await this.mailService.sendMail(user.email, 'Password Reset', forgotPasswordTemplate(passwordResetToken));

        return {
            message: 'Forgot password email sent',
        };
    }

    async resetPassword(token: string, newPassword: string) {
        const payload = await this.jwtService.verifyAsync(token);

        if (!payload) {
            throw new UnauthorizedException('Invalid or expired reset link');
        }

        const user = await this.usersRepository.findUserByEmail(payload.email);
        
        if (!user) {
            throw new UnauthorizedException('Invalid or expired reset link');
        }

        const hashed = await bcrypt.hash(newPassword, 10);
        await this.usersRepository.update(user.id, { password: hashed });

        return {
            message: 'Password reset successfully',
        };
    }
}
