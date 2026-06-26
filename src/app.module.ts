import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { ParkingSessionsModule } from './parking-sessions/parking-sessions.module';
import { AuthModule } from './auth/auth.module';
import { QrCodeModule } from './qr-code/qr-code.module';
import { ParkingAreasModule } from './parking-areas/parking-areas.module';
import { ParkingHistoryModule } from './parking-history/parking-history.module';
import { RfidModule } from './rfid/rfid.module';
import { MqttModule } from './mqtt/mqtt.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ReservationsModule } from './reservations/reservations.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { PaymentsModule } from './payments/payments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AiAgentModule } from './ai-agents/ai-agent.module';
import { BasePaginationModule } from './common/pagination/base-pagination.module';
import { RfidRequestsModule } from './rfid_requests/rfid-requests.module';
import { MailModule } from './mail/mail.module';
import { AppCacheModule } from './cache/cache.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AppCacheModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: true,
      extra: {
        max: Number(process.env.DB_POOL_MAX || 30),
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 10_000,
      },
    }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    UsersModule,
    VehiclesModule,
    ParkingSessionsModule,
    AuthModule,
    QrCodeModule,
    ParkingAreasModule,
    ParkingHistoryModule,
    RfidModule,
    MqttModule,
    ReservationsModule,
    AnalyticsModule,
    PaymentsModule,
    NotificationsModule,
    AiAgentModule,
    BasePaginationModule,
    RfidRequestsModule,
    MailModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
