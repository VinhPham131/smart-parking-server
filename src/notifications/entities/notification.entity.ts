import { User } from "src/users/entities/user.entity";
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('notifications')
@Index('IDX_notifications_user_id', ['user'])
@Index('IDX_notifications_created_at', ['created_at'])
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id: string;
    
    @Column()
    message: string;

    @ManyToOne(() => User, user => user.notifications)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ type: 'json', nullable: true })
    metadata: any;

    @Column({ default: false })
    is_read: boolean;
        
    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
