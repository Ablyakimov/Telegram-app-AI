import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription, PlanType } from './entities/subscription.entity';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
  ) {}

  // Plan limits configuration
  private readonly PLAN_LIMITS = {
    [PlanType.FREE]: {
      monthlyMessages: 100,
      allowedModels: ['gpt-3.5-turbo'],
      allowFileUpload: false,
    },
    [PlanType.PRO]: {
      monthlyMessages: 5000,
      allowedModels: ['gpt-3.5-turbo', 'gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
      allowFileUpload: true,
    },
    [PlanType.ENTERPRISE]: {
      monthlyMessages: Infinity,
      allowedModels: ['gpt-3.5-turbo', 'gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4.1'],
      allowFileUpload: true,
    },
  };

  // Credit costs per model
  private readonly MODEL_COSTS = {
    'gpt-3.5-turbo': 1,
    'gpt-3.5-turbo-16k': 1,
    'gpt-4o-mini': 2,
    'gpt-4o': 3,
    'gpt-4-turbo': 3,
    'gpt-4.1': 4,
  };

  async findOrCreateSubscription(userId: number): Promise<Subscription> {
    let subscription = await this.subscriptionRepository.findOne({ where: { userId } });
    
    if (!subscription) {
      subscription = this.subscriptionRepository.create({
        userId,
        plan: PlanType.FREE,
        credits: 0,
        monthlyMessagesUsed: 0,
        totalTokensUsed: 0,
        lastResetAt: new Date(),
      });
      await this.subscriptionRepository.save(subscription);
    }

    // Reset monthly counter if needed
    await this.resetMonthlyUsageIfNeeded(subscription);

    return subscription;
  }

  async checkAccess(userId: number, model: string): Promise<{
    allowed: boolean;
    reason?: string;
    subscription: Subscription;
  }> {
    const subscription = await this.findOrCreateSubscription(userId);
    const limits = this.PLAN_LIMITS[subscription.plan];

    // Check if subscription is active
    if (subscription.plan !== PlanType.FREE) {
      if (!subscription.expiresAt || subscription.expiresAt < new Date()) {
        // Subscription expired, downgrade to free
        subscription.plan = PlanType.FREE;
        await this.subscriptionRepository.save(subscription);
        return {
          allowed: false,
          reason: 'subscription_expired',
          subscription,
        };
      }
    }

    // Check model access
    if (!limits.allowedModels.includes(model)) {
      return {
        allowed: false,
        reason: 'model_not_allowed',
        subscription,
      };
    }

    // Check monthly message limit
    if (subscription.monthlyMessagesUsed >= limits.monthlyMessages) {
      // Try to use credits instead
      const cost = this.MODEL_COSTS[model] || 1;
      if (subscription.credits >= cost) {
        return {
          allowed: true,
          subscription,
        };
      }
      return {
        allowed: false,
        reason: 'monthly_limit_reached',
        subscription,
      };
    }

    return {
      allowed: true,
      subscription,
    };
  }

  async deductUsage(userId: number, model: string, tokensUsed: number = 0): Promise<void> {
    const subscription = await this.findOrCreateSubscription(userId);
    const limits = this.PLAN_LIMITS[subscription.plan];
    const cost = this.MODEL_COSTS[model] || 1;

    // If within monthly limit, just increment counter
    if (subscription.monthlyMessagesUsed < limits.monthlyMessages) {
      subscription.monthlyMessagesUsed += 1;
      subscription.totalTokensUsed += tokensUsed;
    } else {
      // Use credits
      if (subscription.credits >= cost) {
        subscription.credits -= cost;
        subscription.totalTokensUsed += tokensUsed;
      } else {
        throw new BadRequestException('Insufficient credits');
      }
    }

    await this.subscriptionRepository.save(subscription);
  }

  async addCredits(userId: number, amount: number): Promise<Subscription> {
    const subscription = await this.findOrCreateSubscription(userId);
    subscription.credits += amount;
    return this.subscriptionRepository.save(subscription);
  }

  async upgradePlan(userId: number, plan: PlanType, durationDays: number): Promise<Subscription> {
    const subscription = await this.findOrCreateSubscription(userId);
    
    subscription.plan = plan;
    
    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
    
    // If already has active subscription, extend it
    if (subscription.expiresAt && subscription.expiresAt > now) {
      subscription.expiresAt = new Date(subscription.expiresAt.getTime() + durationDays * 24 * 60 * 60 * 1000);
    } else {
      subscription.expiresAt = expiresAt;
    }

    return this.subscriptionRepository.save(subscription);
  }

  private async resetMonthlyUsageIfNeeded(subscription: Subscription): Promise<void> {
    if (!subscription.lastResetAt) {
      subscription.lastResetAt = new Date();
      return;
    }

    const now = new Date();
    const lastReset = new Date(subscription.lastResetAt);
    
    // Reset if more than 30 days have passed
    const daysSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceReset >= 30) {
      subscription.monthlyMessagesUsed = 0;
      subscription.lastResetAt = now;
      await this.subscriptionRepository.save(subscription);
    }
  }

  async getSubscription(userId: number): Promise<Subscription> {
    return this.findOrCreateSubscription(userId);
  }

  getPlanLimits(plan: PlanType) {
    return this.PLAN_LIMITS[plan];
  }

  getModelCost(model: string): number {
    return this.MODEL_COSTS[model] || 1;
  }
}

