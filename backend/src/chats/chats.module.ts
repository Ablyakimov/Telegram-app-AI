import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chat } from './entities/chat.entity';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';
import { UsersModule } from '../users/users.module';
import { AiModule } from '../ai/ai.module';
import { TelegramAuthModule } from '../telegram-auth/telegram-auth.module';
import { TelegramGuard } from '../telegram-auth/telegram.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Chat]),
    UsersModule,
    AiModule,
    TelegramAuthModule,
  ],
  controllers: [ChatsController],
  providers: [ChatsService, TelegramGuard],
  exports: [ChatsService],
})
export class ChatsModule {}

