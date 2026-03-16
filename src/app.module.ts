import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import app_config from './config/app.config';
import auth_config from './config/auth.config';
import database_config from './config/database.config';
import { create_data_source } from './config/database.datasource';
import { database_entities } from './config/database.entities';
import { validate_env } from './config/env.validation';
import { AuthModule } from './modules/auth/auth.module';
import { BusinessesModule } from './modules/businesses/businesses.module';
import { BranchesModule } from './modules/branches/branches.module';
import { CommonModule } from './modules/common/common.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { PlatformModule } from './modules/platform/platform.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [app_config, auth_config, database_config],
      validate: validate_env,
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 20 }]),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config_service: ConfigService) => {
        const database_url = config_service.get<string>('database.url');

        return {
          type: 'postgres',
          ...(database_url
            ? {
                url: database_url,
              }
            : {
                host: config_service.get<string>('database.host'),
                port: config_service.get<number>('database.port'),
                username: config_service.get<string>('database.username'),
                password: config_service.get<string>('database.password'),
                database: config_service.get<string>('database.name'),
              }),
          synchronize: config_service.get<boolean>(
            'database.synchronize',
            true,
          ),
          logging: config_service.get<boolean>('database.logging', false),
          ssl: config_service.get<boolean>('database.ssl', false)
            ? { rejectUnauthorized: false }
            : false,
          entities: database_entities,
        };
      },
      dataSourceFactory: async (options) => create_data_source(options),
    }),
    CommonModule,
    RbacModule,
    BusinessesModule,
    BranchesModule,
    ContactsModule,
    InventoryModule,
    PlatformModule,
    UsersModule,
    AuthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
