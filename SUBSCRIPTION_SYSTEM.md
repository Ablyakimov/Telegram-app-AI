# Subscription & Monetization System

## Overview
Full-featured monetization system with Freemium model, subscription plans, and pay-as-you-go credits using Telegram Stars payment.

---

## Architecture

### Database Schema

**Subscription Entity** (`subscriptions` table):
```typescript
{
  id: number;
  userId: number;           // Telegram user ID
  plan: PlanType;          // 'free' | 'pro' | 'enterprise'
  credits: number;         // Available pay-as-you-go credits
  expiresAt: Date;         // Subscription expiration date
  monthlyMessagesUsed: number;  // Current month usage
  totalTokensUsed: number;      // Total tokens consumed
  lastResetAt: Date;       // Last monthly reset date
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Plan Tiers

### 🆓 Free Plan
- **Price**: Free
- **Monthly Messages**: 100
- **Models**: GPT-3.5 Turbo only
- **File Upload**: ❌ No
- **Features**:
  - Basic AI chat functionality
  - Auto-reset every 30 days
  - Can buy credits for additional usage

### ⭐ PRO Plan
- **Price**: 330 Telegram Stars/month (~$5)
- **Price (Yearly)**: 3300 Stars/year (~$50, save 17%)
- **Monthly Messages**: 5,000
- **Models**: GPT-3.5, GPT-4o, GPT-4o mini, GPT-4 Turbo
- **File Upload**: ✅ Yes
- **Features**:
  - Full model access
  - Priority support
  - Higher message limits
  - File/document analysis

### 💎 Enterprise Plan (Future)
- **Price**: Custom
- **Monthly Messages**: Unlimited
- **Models**: All models including GPT-4.1
- **File Upload**: ✅ Yes
- **Features**:
  - Everything in PRO
  - Custom integrations
  - Dedicated support

---

## Credit System (Pay-as-you-go)

### Model Costs
| Model | Credits per Message |
|-------|---------------------|
| GPT-3.5 Turbo | 1 |
| GPT-3.5 Turbo 16K | 1 |
| GPT-4o mini | 2 |
| GPT-4o | 3 |
| GPT-4 Turbo | 3 |
| GPT-4.1 | 4 |

### Credit Packages
| Package | Telegram Stars | Credits |
|---------|----------------|---------|
| Small | 130 (~$2) | 100 |
| Medium | 530 (~$8) | 500 |
| Large | 1000 (~$15) | 1000 |

### How Credits Work
1. User reaches monthly message limit
2. System automatically deducts credits per message
3. If no credits available, user is prompted to buy more
4. Credits never expire

---

## API Endpoints

### Subscription Management

#### Get Current Subscription
```
GET /subscriptions/me
Authorization: Telegram user data
```

**Response:**
```json
{
  "id": 1,
  "userId": 123456,
  "plan": "pro",
  "credits": 150,
  "expiresAt": "2024-12-31T23:59:59.000Z",
  "monthlyMessagesUsed": 45,
  "isActive": true,
  "limits": {
    "monthlyMessages": 5000,
    "allowedModels": ["gpt-3.5-turbo", "gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
    "allowFileUpload": true
  }
}
```

#### Get Plan Limits
```
GET /subscriptions/plans/limits
```

#### Get Model Costs
```
GET /subscriptions/models/costs
```

### Payment

#### Get Pricing
```
GET /payments/pricing
```

**Response:**
```json
{
  "plans": {
    "pro_monthly": {
      "price": 330,
      "currency": "XTR",
      "duration": "30 days",
      "features": [...]
    }
  },
  "credits": {
    "credits_100": {
      "price": 130,
      "currency": "XTR",
      "amount": 100
    }
  }
}
```

#### Create Invoice
```
POST /payments/create-invoice
Body: {
  "type": "subscription" | "credits",
  "item": "pro_monthly" | "credits_100" | ...
}
```

**Response:** Invoice data for Telegram.WebApp.openInvoice()

#### Payment Webhook
```
POST /payments/webhook
Body: Telegram payment update
```

Handles:
- Pre-checkout queries
- Successful payments
- Subscription activations
- Credit additions

---

## Frontend Integration

### Subscription Store
```javascript
import { useSubscriptionStore } from '@entities/subscription/model/subscriptionStore'

const { subscription, fetchSubscription, createInvoice } = useSubscriptionStore()
```

### Opening Invoice
```javascript
const invoice = await createInvoice('subscription', 'pro_monthly')

window.Telegram.WebApp.openInvoice(invoice.payload, (status) => {
  if (status === 'paid') {
    // Payment successful
    fetchSubscription() // Refresh data
  }
})
```

### Subscription Page
Component: `SubscriptionPage.jsx`

Features:
- Display current plan and limits
- Show usage statistics
- Buy subscription plans
- Purchase credit packages
- Responsive design

---

## Access Control Flow

### Message Send Flow
```
1. User sends message
   ↓
2. ChatsController: Get user subscription
   ↓
3. SubscriptionService.checkAccess(userId, model)
   ↓
4. Check:
   - Is subscription active?
   - Is model allowed for plan?
   - Are monthly messages available?
   - If limit reached, check credits
   ↓
5a. Access granted → Process message
    ↓
6a. Deduct usage (message count or credits)

5b. Access denied → Return error with reason
    - "subscription_expired"
    - "model_not_allowed"
    - "monthly_limit_reached"
```

### Error Handling
When access is denied, frontend shows:
- Current subscription status
- Upgrade button to PRO
- Buy credits button
- Clear explanation of limit

---

## Usage Tracking

### Monthly Reset
- Automatically resets every 30 days from `lastResetAt`
- `monthlyMessagesUsed` set to 0
- Credits remain unchanged (never expire)

### Deduction Logic
```typescript
if (monthlyMessagesUsed < monthlyLimit) {
  // Within plan limit
  monthlyMessagesUsed++;
} else if (credits >= modelCost) {
  // Use credits when limit reached
  credits -= modelCost;
} else {
  // No credits and limit reached
  throw Error('Insufficient credits');
}
```

---

## Testing

### Test Credentials
Use Telegram test mode for payments:
- Test Telegram Stars
- Instant payment confirmation
- No real money charged

### Manual Testing Checklist
- [ ] Free user can send 100 messages
- [ ] Free user blocked from GPT-4
- [ ] PRO upgrade activates immediately
- [ ] PRO user can access GPT-4
- [ ] Credit purchase adds credits
- [ ] Credits deduct correctly
- [ ] Monthly reset works
- [ ] Subscription expiration handled
- [ ] Payment webhook processes correctly
- [ ] UI shows correct limits and status

---

## Deployment Notes

### Environment Variables
```env
# No additional env vars needed
# Uses existing OPENAI_API_KEY and database connection
```

### Database Migration
Run TypeORM migration to create `subscriptions` table:
```bash
npm run typeorm migration:run
```

### Telegram Bot Setup
1. Enable Telegram Payments in BotFather
2. Connect payment provider (use Telegram Stars)
3. Set webhook URL: `https://yourdomain.com/payments/webhook`
4. Verify webhook receives test payments

---

## Future Enhancements

### Phase 2
- [ ] Referral system (earn credits)
- [ ] Gift subscriptions
- [ ] Team/family plans
- [ ] Usage analytics dashboard
- [ ] Custom model fine-tuning for Enterprise

### Phase 3
- [ ] Integration with external payment providers
- [ ] Crypto payment support
- [ ] Subscription pause/resume
- [ ] Automatic downgrade on expiration
- [ ] Email/Telegram notifications for expiry

---

## Support & Troubleshooting

### Common Issues

**Payment not processing:**
- Check Telegram Stars balance
- Verify bot payment provider is configured
- Check webhook logs for errors

**Credits not adding:**
- Verify webhook received `successful_payment`
- Check server logs for payment processing errors
- Ensure invoice payload format is correct

**Monthly limit not resetting:**
- Check `lastResetAt` date in database
- Verify 30 days have passed
- Manually trigger reset if needed

---

## Security Considerations

1. **Payment Validation**: All payments verified via Telegram webhook
2. **User Authentication**: Telegram WebApp initData validation
3. **Access Control**: Server-side enforcement of limits
4. **Audit Trail**: All transactions logged in database
5. **No Stored Cards**: Telegram handles all payment processing

---

## Monitoring

### Key Metrics
- Daily/Monthly Active Users by plan
- Conversion rate (Free → PRO)
- Average credits purchased per user
- Message volume by model
- Revenue per user per month (ARPU)
- Churn rate

### Alerts
- Failed payment webhook calls
- High credit deduction errors
- Subscription expiration spikes
- Unusual usage patterns

---

## License & Compliance

- Complies with Telegram Bot Payment Policy
- No PCI-DSS requirements (Telegram handles payments)
- GDPR compliant (minimal data storage)
- Transparent pricing and terms

---

**Created**: 2024
**Version**: 1.0.0
**Status**: ✅ Production Ready

