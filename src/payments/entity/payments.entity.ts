import { PaymentStatus, PaymentType } from "src/constants/config";
import { User } from "src/users/entities/user.entity";
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('payments_history')
@Index('IDX_payments_history_user_id', ['user'])
@Index('IDX_payments_history_status', ['status'])
@Index('IDX_payments_history_payment_type', ['payment_type'])
@Index('IDX_payments_history_created_at', ['created_at'])
export class PaymentsHistory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, user => user.id)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column()
    amount: number;

    @Column({ nullable: true })
    description: string;

    @Column({
        type: 'enum',
        enum: PaymentType,
        nullable: true,
    })
    payment_type: PaymentType;

    @Column({
        type: 'enum',
        enum: PaymentStatus,
        default: PaymentStatus.PENDING,
    })
    status: PaymentStatus;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}