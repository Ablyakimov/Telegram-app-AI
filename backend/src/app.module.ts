import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
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
    TypeOrmModule.forRoot({
      type: process.env.DATABASE_URL ? 'postgres' : 'sqlite',
      url: process.env.DATABASE_URL,
      database: process.env.DATABASE_URL ? undefined : (process.env.DATABASE_PATH || (process.env.NODE_ENV === 'production' ? '/app/data/database.sqlite' : 'database.sqlite')),
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } as any : undefined,
    }),
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

