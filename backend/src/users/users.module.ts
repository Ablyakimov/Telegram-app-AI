import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { Subscription } from "./entities/subscription.entity";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";
import { SubscriptionService } from "./subscription.service";
import { SubscriptionController } from "./subscription.controller";
import { PaymentController } from "./payment.controller";
import { BroadcastController } from "./broadcast.controller";
import { AdminGuard } from "./admin.guard";
import { TelegramAuthModule } from "../telegram-auth/telegram-auth.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Subscription]),
    TelegramAuthModule,
  ],
  controllers: [
    UsersController,
    SubscriptionController,
    PaymentController,
    BroadcastController,
  ],
  providers: [UsersService, SubscriptionService, AdminGuard],
  exports: [UsersService, SubscriptionService],
})
export class UsersModule {}
