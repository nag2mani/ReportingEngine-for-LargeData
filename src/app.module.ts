import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerModuleOptions } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { DatabaseModule } from './config/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { StudentsModule } from './modules/students/students.module';
import { FeesModule } from './modules/fees/fees.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ReportsModule } from './modules/reports/reports.module';
import { HealthModule } from './modules/health/health.module';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): ThrottlerModuleOptions => {
        return {
          throttlers: [{
            ttl: configService.get<number>('THROTTLE_TTL', 60) * 1000,
            limit: configService.get<number>('THROTTLE_LIMIT', 100),
          }],
        };
      },
      inject: [ConfigService],
    }),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        return {
          store: await redisStore({
            socket: {
              host: configService.get('REDIS_HOST', 'localhost'),
              port: configService.get<number>('REDIS_PORT', 6379),
            },
            password: configService.get('REDIS_PASSWORD') || undefined,
          }),
          ttl: 300000, // 5 minutes in milliseconds
        };
      },
      inject: [ConfigService],
      isGlobal: true,
    }),
    DatabaseModule,
    TypeOrmModule.forFeature([AuditLog]),
    AuthModule,
    StudentsModule,
    FeesModule,
    PaymentsModule,
    ReportsModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
  ],
})
export class AppModule {}
