import { DataSource, Repository } from "typeorm";
import { CreateNotificationDto } from "./dto/create-notification.dto";
import { User } from "src/users/entities/user.entity";
import { Notification } from "./entities/notification.entity";
import { InjectDataSource } from "@nestjs/typeorm";

export class NotificationsRepository extends Repository<Notification> {
    constructor(@InjectDataSource() private dataSource: DataSource) {
        super(Notification, dataSource.createEntityManager());
    }

    async createNotification(createDto : CreateNotificationDto, userId: string) {

        const notification = this.create({
            message: createDto.message,
            metadata: createDto.metadata,
            user: { id: userId } as User,
            is_read: false
        });

        await this.save(notification);
        return notification;
    }

    async getNotificationsByUserId(userId: string) {
        return this.find({
            where: { user: { id: userId } },
            order: { created_at: 'DESC' },
        });
    }

    async deleteNotification(notificationId: string, userId: string) {
        return await this.delete({ id: notificationId, user: { id: userId } });
    }

    async markAsRead(notificationId: string, userId: string) {
        const notification = await this.findOne({ where: { id: notificationId, user: { id: userId } } });
        if (notification) {
            notification.is_read = true;
            await this.save(notification);
            return notification;
        }
        return null;
    }
}