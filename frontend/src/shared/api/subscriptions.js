import { http } from './http'

export const SubscriptionsApi = {
  // Get current user's subscription
  async getMySubscription() {
    const { data } = await http.get('/subscriptions/me')
    return data
  },

  // Get plan limits
  async getPlanLimits() {
    const { data } = await http.get('/subscriptions/plans/limits')
    return data
  },

  // Get model costs
  async getModelCosts() {
    const { data } = await http.get('/subscriptions/models/costs')
    return data
  },

  // Get pricing
  async getPricing() {
    const { data } = await http.get('/payments/pricing')
    return data
  },

  // Create invoice for payment
  async createInvoice(type, item) {
    const { data } = await http.post('/payments/create-invoice', { type, item })
    return data
  },

  // Buy credits (called after successful payment)
  async buyCredits(amount) {
    const { data } = await http.post('/subscriptions/buy-credits', { amount })
    return data
  },

  // Upgrade plan (called after successful payment)
  async upgradePlan(plan, durationDays) {
    const { data } = await http.post('/subscriptions/upgrade', { plan, durationDays })
    return data
  },
}

