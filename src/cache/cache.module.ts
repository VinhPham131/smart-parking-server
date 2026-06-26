import { Global, Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-ioredis-yet';
import { AppCacheService } from './app-cache.service';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const ttlSeconds = Number(configService.get<string>('CACHE_TTL_SECONDS', '60'));
        const ttlMs = ttlSeconds * 1000;
        const redisEnabled = configService.get<string>('REDIS_ENABLED', 'true') !== 'false';

        if (!redisEnabled) {
          return { ttl: ttlMs };
        }

        const store = await redisStore({
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: Number(configService.get<string>('REDIS_PORT', '6379')),
          password: configService.get<string>('REDIS_PASSWORD') || undefined,
          ttl: ttlMs,
        });

        return { store, ttl: ttlMs };
      },
    }),
  ],
  providers: [AppCacheService],
  exports: [AppCacheService, CacheModule],
})
export class AppCacheModule {}
