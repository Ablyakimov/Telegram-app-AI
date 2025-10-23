import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { PlanType } from '../entities/subscription.entity';

export class UpdateSubscriptionDto {
  @IsOptional()
  @IsEnum(PlanType)
  plan?: PlanType;

  @IsOptional()
  @IsNumber()
  credits?: number;

  @IsOptional()
  expiresAt?: Date;
}

export class BuyCreditsDto {
  @IsNumber()
  amount: number;
}

export class UpgradePlanDto {
  @IsEnum(PlanType)
  plan: PlanType;

  @IsNumber()
  durationDays: number;
}

