import { Injectable } from '@nestjs/common';
import { NotificationsRepository } from './notifications.repository';
import { NotificationGateway } from 'src/gateways/notification.gateway';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly notificationGateway: NotificationGateway,
  ) { }
  
  @OnEvent('notification.created')
  async handleNotification(payload: {
    userId: string;
    message: string;
    metadata?: any;
  }) {
    const notification = await this.notificationsRepository.createNotification(
      {
        message: payload.message,
        metadata: payload.metadata,
      },
      payload.userId,
    );

    this.notificationGateway.sendNotification({
      message: notification.message,
      metadata: notification.metadata,
      userId: payload.userId,
    });

    return notification;
  }

  async getNotificationsByUserId(userId: string) {
    return await this.notificationsRepository.getNotificationsByUserId(userId);
  }

  async deleteNotification(notificationId: string, userId: string) {
    return await this.notificationsRepository.deleteNotification(notificationId, userId);
  }

  async markAsRead(notificationId: string, userId: string) {
    return await this.notificationsRepository.markAsRead(notificationId, userId);
  }
}
