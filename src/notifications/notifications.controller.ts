import { Controller, Delete, Get, Param, Req } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) { }

  @Get()
  async getNotifications(@Req() req) {
    return await this.notificationsService.getNotificationsByUserId(req.user.id);
  }

  @Delete(':id')
  async deleteNotification(@Req() req, @Param('id') id: string) {
    return await this.notificationsService.deleteNotification(id, req.user.id);
  }

  @Delete(':id/read')
  async markAsRead(@Req() req, @Param('id') id: string) {
    return await this.notificationsService.markAsRead(id, req.user.id);
  }
}
