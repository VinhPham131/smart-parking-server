import { Global, Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationsRepository } from './notifications.repository';
import { NotificationGateway } from 'src/gateways/notification.gateway';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Notification])],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsRepository, NotificationGateway],
  exports: [NotificationsService,],
})
export class NotificationsModule {}
