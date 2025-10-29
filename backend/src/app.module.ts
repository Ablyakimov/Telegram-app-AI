import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { ChatsModule } from './chats/chats.module';
import { AiModule } from './ai/ai.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TelegramAuthModule } from './telegram-auth/telegram-auth.module';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Build ORM config with correct typing to satisfy union of Postgres/SQLite options
    TypeOrmModule.forRoot((() => {
      const isPostgres = Boolean(process.env.DATABASE_URL);
      const common = {
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true as const,
      };

      const pgConfig = {
        type: 'postgres' as const,
        url: process.env.DATABASE_URL as string,
        ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
      };

      const sqliteConfig = {
        type: 'sqlite' as const,
        database: process.env.DATABASE_PATH || (process.env.NODE_ENV === 'production' ? '/app/data/database.sqlite' : 'database.sqlite'),
      };

      return ({
        ...(isPostgres ? pgConfig : sqliteConfig),
        ...common,
      }) as TypeOrmModuleOptions;
    })()),
    ThrottlerModule.forRoot([{ ttl: 60, limit: 100 }]),
    TelegramAuthModule,
    UsersModule,
    ChatsModule,
    AiModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

