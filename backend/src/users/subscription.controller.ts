import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Req,
  UseGuards,
} from "@nestjs/common";
import { SubscriptionService } from "./subscription.service";
import { BuyCreditsDto, UpgradePlanDto } from "./dto/subscription.dto";
import { PlanType } from "./entities/subscription.entity";
import { TelegramGuard } from "../telegram-auth/telegram.guard";

@Controller("subscriptions")
@UseGuards(TelegramGuard)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get("me")
  async getMySubscription(@Req() req: Request) {
    const telegramUser = req["telegramUser"];
    const subscription = await this.subscriptionService.getSubscription(
      telegramUser.id,
    );
    const limits = this.subscriptionService.getPlanLimits(subscription.plan);

    return {
      ...subscription,
      limits,
      isActive:
        subscription.plan !== PlanType.FREE &&
        subscription.expiresAt &&
        subscription.expiresAt > new Date(),
    };
  }

  @Get(":userId")
  async getSubscription(@Param("userId", ParseIntPipe) userId: number) {
    return this.subscriptionService.getSubscription(userId);
  }

  @Post("buy-credits")
  async buyCredits(@Body() buyCreditsDto: BuyCreditsDto, @Req() req: Request) {
    const telegramUser = req["telegramUser"];

    // In production, this should only be called after successful payment
    return this.subscriptionService.addCredits(
      telegramUser.id,
      buyCreditsDto.amount,
    );
  }

  @Post("upgrade")
  async upgradePlan(
    @Body() upgradePlanDto: UpgradePlanDto,
    @Req() req: Request,
  ) {
    const telegramUser = req["telegramUser"];

    // In production, this should only be called after successful payment
    return this.subscriptionService.upgradePlan(
      telegramUser.id,
      upgradePlanDto.plan,
      upgradePlanDto.durationDays,
    );
  }

  @Get("plans/limits")
  async getPlanLimits() {
    return {
      [PlanType.FREE]: this.subscriptionService.getPlanLimits(PlanType.FREE),
      [PlanType.PRO]: this.subscriptionService.getPlanLimits(PlanType.PRO),
      [PlanType.ENTERPRISE]: this.subscriptionService.getPlanLimits(
        PlanType.ENTERPRISE,
      ),
    };
  }

  @Get("models/costs")
  async getModelCosts() {
    return {
      "gpt-3.5-turbo": this.subscriptionService.getModelCost("gpt-3.5-turbo"),
      "gpt-4o-mini": this.subscriptionService.getModelCost("gpt-4o-mini"),
      "gpt-4o": this.subscriptionService.getModelCost("gpt-4o"),
      "gpt-4-turbo": this.subscriptionService.getModelCost("gpt-4-turbo"),
      "gpt-4.1": this.subscriptionService.getModelCost("gpt-4.1"),
    };
  }
}
