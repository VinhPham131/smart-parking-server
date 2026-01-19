import { Module } from '@nestjs/common';
import { User } from './models/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
})
export class UsersModule {}
