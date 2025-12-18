// Database module - configures TypeORM connection to PostgreSQL with all entity registrations
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  School,
  Student,
  FeeBill,
  Payment,
  TransactionStatus,
  User,
  Role,
  Permission,
  FieldPermission,
  AuditLog,
} from '../entities';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_DATABASE', 'reporting_engine'),
        entities: [
          School,
          Student,
          FeeBill,
          Payment,
          TransactionStatus,
          User,
          Role,
          Permission,
          FieldPermission,
          AuditLog,
        ],
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',
        extra: {
          max: 20,
          connectionTimeoutMillis: 10000,
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
