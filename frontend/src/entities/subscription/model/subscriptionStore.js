import { create } from 'zustand'
import { SubscriptionsApi } from '@shared/api/subscriptions'

export const useSubscriptionStore = create((set, get) => ({
  subscription: null,
  pricing: null,
  isLoading: false,
  error: null,

  fetchSubscription: async () => {
    set({ isLoading: true, error: null })
    try {
      const subscription = await SubscriptionsApi.getMySubscription()
      set({ subscription, isLoading: false })
      return subscription
    } catch (e) {
      set({ error: e, isLoading: false })
      throw e
    }
  },

  fetchPricing: async () => {
    try {
      const pricing = await SubscriptionsApi.getPricing()
      set({ pricing })
      return pricing
    } catch (e) {
      console.error('Failed to fetch pricing:', e)
      throw e
    }
  },

  createInvoice: async (type, item) => {
    try {
      return await SubscriptionsApi.createInvoice(type, item)
    } catch (e) {
      console.error('Failed to create invoice:', e)
      throw e
    }
  },

  refreshSubscription: async () => {
    return get().fetchSubscription()
  },
}))

