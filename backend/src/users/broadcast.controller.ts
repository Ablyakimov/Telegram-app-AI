import {
  Controller,
  Post,
  Body,
  BadRequestException,
  UseGuards,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Subscription } from "./entities/subscription.entity";
import { User } from "./entities/user.entity";
import { AdminGuard } from "./admin.guard";
import { TelegramGuard } from "../telegram-auth/telegram.guard";

@Controller("broadcast")
@UseGuards(TelegramGuard, AdminGuard)
export class BroadcastController {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private configService: ConfigService,
  ) {}

  @Post("send")
  async sendBroadcast(@Body() body: { message: string }) {
    if (!body.message || !body.message.trim()) {
      throw new BadRequestException("Message is required");
    }

    const botToken = this.configService.get<string>("TELEGRAM_BOT_TOKEN");
    if (!botToken) {
      throw new BadRequestException("Telegram bot token not configured");
    }

    const users = await this.userRepository.find();
    const subscriptions = await this.subscriptionRepository.find();
    
    const telegramUserIds = new Set<number>();
    
    users.forEach((user) => {
      if (user.id > 1000) {
        telegramUserIds.add(user.id);
      }
    });
    
    subscriptions.forEach((sub) => {
      if (sub.userId > 1000) {
        telegramUserIds.add(sub.userId);
      }
    });
    
    const uniqueUserIds = Array.from(telegramUserIds);

    if (uniqueUserIds.length === 0) {
      return {
        success: false,
        message: "No Telegram users found",
        sent: 0,
        failed: 0,
      };
    }

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as Array<{ userId: number; error: string }>,
    };

    for (const userId of uniqueUserIds) {
      try {
        const response = await fetch(
          `https://api.telegram.org/bot${botToken}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: userId,
              text: body.message,
              parse_mode: "HTML",
            }),
            signal: AbortSignal.timeout(5000),
          },
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.description || "Failed to send message");
        }

        results.sent++;
      } catch (error: any) {
        results.failed++;
        const errorMessage = error.message || "Unknown error";
        results.errors.push({ userId, error: errorMessage });
      }
    }

    return {
      success: true,
      total: uniqueUserIds.length,
      sent: results.sent,
      failed: results.failed,
      errors: results.errors,
    };
  }

  @Post("test")
  async testBroadcast(@Body() body: { userId: number; message?: string }) {
    if (!body.userId) {
      throw new BadRequestException("User ID is required");
    }

    const botToken = this.configService.get<string>("TELEGRAM_BOT_TOKEN");
    if (!botToken) {
      throw new BadRequestException("Telegram bot token not configured");
    }

    const testMessage =
      body.message ||
      "🧪 Тестовое сообщение от бота. Если вы получили это сообщение, рассылка работает!";

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: body.userId,
            text: testMessage,
            parse_mode: "HTML",
          }),
          signal: AbortSignal.timeout(5000),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.description || "Failed to send message");
      }

      const data = await response.json();

      return {
        success: true,
        message: "Message sent successfully",
        response: data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Unknown error",
      };
    }
  }
}

