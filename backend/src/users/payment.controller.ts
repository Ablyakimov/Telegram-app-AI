import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  BadRequestException,
  Get,
} from "@nestjs/common";
import { SubscriptionService } from "./subscription.service";
import { PlanType } from "./entities/subscription.entity";
import { TelegramGuard } from "../telegram-auth/telegram.guard";

interface TelegramPaymentData {
  update_id: number;
  message?: {
    successful_payment?: {
      currency: string;
      total_amount: number;
      invoice_payload: string;
      telegram_payment_charge_id: string;
      provider_payment_charge_id: string;
    };
  };
  pre_checkout_query?: {
    id: string;
    from: {
      id: number;
      first_name: string;
      username?: string;
    };
    currency: string;
    total_amount: number;
    invoice_payload: string;
  };
}

interface InvoicePayload {
  type: "subscription" | "credits";
  plan?: string;
  credits?: number;
  userId: number;
}

@Controller("payments")
export class PaymentController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  // Pricing in Telegram Stars (1 Star ≈ $0.015)
  private readonly PRICING = {
    pro_monthly: { stars: 330, days: 30 }, // ≈ $5
    pro_yearly: { stars: 3300, days: 365 }, // ≈ $50
    credits_100: { stars: 130, credits: 100 }, // ≈ $2
    credits_500: { stars: 530, credits: 500 }, // ≈ $8
    credits_1000: { stars: 1000, credits: 1000 }, // ≈ $15
  };

  @Post("webhook")
  async handlePaymentWebhook(@Body() data: TelegramPaymentData) {
    // Handle pre-checkout query
    if (data.pre_checkout_query) {
      return {
        ok: true,
        pre_checkout_query_id: data.pre_checkout_query.id,
      };
    }

    // Handle successful payment
    if (data.message?.successful_payment) {
      const payment = data.message.successful_payment;

      try {
        const payload: InvoicePayload = JSON.parse(payment.invoice_payload);

        if (payload.type === "subscription" && payload.plan) {
          const planConfig = this.PRICING[payload.plan];
          if (!planConfig || !planConfig.days) {
            throw new BadRequestException("Invalid plan");
          }

          const planType = payload.plan.startsWith("pro")
            ? PlanType.PRO
            : PlanType.ENTERPRISE;

          await this.subscriptionService.upgradePlan(
            payload.userId,
            planType,
            planConfig.days,
          );
        } else if (payload.type === "credits" && payload.credits) {
          await this.subscriptionService.addCredits(
            payload.userId,
            payload.credits,
          );
        }

        return { ok: true, message: "Payment processed successfully" };
      } catch (error) {
        console.error("Payment processing error:", error);
        return { ok: false, error: error.message };
      }
    }

    return { ok: true };
  }

  @Post("create-invoice")
  @UseGuards(TelegramGuard)
  async createInvoice(
    @Body() body: { type: "subscription" | "credits"; item: string },
    @Req() req: Request,
  ) {
    const telegramUser = req["telegramUser"];
    const { type, item } = body;

    const pricing = this.PRICING[item];
    if (!pricing) {
      throw new BadRequestException("Invalid item");
    }

    const payload: InvoicePayload = {
      type,
      userId: telegramUser.id,
    };

    if (type === "subscription") {
      payload.plan = item;
    } else {
      payload.credits = pricing.credits;
    }

    // Return invoice data for Telegram Mini App
    return {
      title: this.getInvoiceTitle(item),
      description: this.getInvoiceDescription(item),
      payload: JSON.stringify(payload),
      currency: "XTR", // Telegram Stars
      prices: [{ label: this.getInvoiceTitle(item), amount: pricing.stars }],
    };
  }

  @Get("pricing")
  getPricing() {
    return {
      plans: {
        pro_monthly: {
          price: this.PRICING.pro_monthly.stars,
          currency: "XTR",
          duration: "30 days",
          features: [
            "5000 messages/month",
            "GPT-4 access",
            "File uploads",
            "Priority support",
          ],
        },
        pro_yearly: {
          price: this.PRICING.pro_yearly.stars,
          currency: "XTR",
          duration: "365 days",
          features: [
            "5000 messages/month",
            "GPT-4 access",
            "File uploads",
            "Priority support",
            "Save 17%",
          ],
        },
      },
      credits: {
        credits_100: {
          price: this.PRICING.credits_100.stars,
          currency: "XTR",
          amount: this.PRICING.credits_100.credits,
        },
        credits_500: {
          price: this.PRICING.credits_500.stars,
          currency: "XTR",
          amount: this.PRICING.credits_500.credits,
        },
        credits_1000: {
          price: this.PRICING.credits_1000.stars,
          currency: "XTR",
          amount: this.PRICING.credits_1000.credits,
        },
      },
    };
  }

  private getInvoiceTitle(item: string): string {
    const titles = {
      pro_monthly: "PRO Plan - Monthly",
      pro_yearly: "PRO Plan - Yearly",
      credits_100: "100 Credits",
      credits_500: "500 Credits",
      credits_1000: "1000 Credits",
    };
    return titles[item] || item;
  }

  private getInvoiceDescription(item: string): string {
    const descriptions = {
      pro_monthly: "Unlock GPT-4, 5000 messages/month, file uploads",
      pro_yearly: "Unlock GPT-4, 5000 messages/month, file uploads (Save 17%)",
      credits_100: "Buy 100 credits for pay-as-you-go usage",
      credits_500: "Buy 500 credits for pay-as-you-go usage",
      credits_1000: "Buy 1000 credits for pay-as-you-go usage",
    };
    return descriptions[item] || item;
  }
}
