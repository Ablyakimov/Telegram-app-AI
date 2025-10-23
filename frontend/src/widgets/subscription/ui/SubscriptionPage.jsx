import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSubscriptionStore } from '@entities/subscription/model/subscriptionStore'

function SubscriptionPage({ onBack }) {
  const { t } = useTranslation()
  const { subscription, pricing, fetchSubscription, fetchPricing, createInvoice } = useSubscriptionStore()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        await Promise.all([fetchSubscription(), fetchPricing()])
      } catch (e) {
        console.error('Failed to load subscription data:', e)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [fetchSubscription, fetchPricing])

  const handleBuyPlan = async (planId) => {
    try {
      const invoice = await createInvoice('subscription', planId)
      
      // Open Telegram invoice
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.openInvoice(invoice.payload, (status) => {
          if (status === 'paid') {
            // Refresh subscription after payment
            fetchSubscription()
            window.Telegram.WebApp.showAlert('Subscription activated! 🎉')
          } else if (status === 'cancelled') {
            window.Telegram.WebApp.showAlert('Payment cancelled')
          } else if (status === 'failed') {
            window.Telegram.WebApp.showAlert('Payment failed. Please try again.')
          }
        })
      }
    } catch (e) {
      console.error('Failed to create invoice:', e)
      alert('Failed to create invoice')
    }
  }

  const handleBuyCredits = async (creditsId) => {
    try {
      const invoice = await createInvoice('credits', creditsId)
      
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.openInvoice(invoice.payload, (status) => {
          if (status === 'paid') {
            fetchSubscription()
            window.Telegram.WebApp.showAlert('Credits added! 💰')
          }
        })
      }
    } catch (e) {
      console.error('Failed to create invoice:', e)
      alert('Failed to create invoice')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-tg-bg">
        <div className="text-tg-hint">{t('common.loading')}</div>
      </div>
    )
  }

  const planName = {
    free: 'Free',
    pro: 'PRO',
    enterprise: 'Enterprise',
  }

  const daysUntilExpiry = subscription?.expiresAt 
    ? Math.ceil((new Date(subscription.expiresAt) - new Date()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <div className="flex flex-col h-screen bg-tg-bg text-tg-text">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 px-4 bg-tg-bg border-b border-tg-hint/20">
        <button 
          className="w-10 h-10 border-none bg-transparent text-tg-link text-[32px] flex items-center justify-center mr-2"
          onClick={onBack}
        >
          ‹
        </button>
        <div>
          <h2 className="text-[17px] font-semibold leading-tight">Subscription</h2>
          <div className="text-[12px] text-tg-hint leading-none mt-0.5">
            Manage your plan and credits
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Current Plan Card */}
        <div className="bg-tg-secondary-bg rounded-2xl p-4 mb-4 border border-black/5 dark:border-white/5">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="text-sm text-tg-hint">Current Plan</div>
              <div className="text-2xl font-bold mt-1">{planName[subscription?.plan] || 'Free'}</div>
            </div>
            {subscription?.plan !== 'free' && subscription?.isActive && (
              <div className="px-3 py-1 rounded-full bg-green-500/20 text-green-500 text-xs font-medium">
                Active
              </div>
            )}
          </div>

          {subscription?.plan !== 'free' && subscription?.expiresAt && (
            <div className="text-sm text-tg-hint mb-3">
              {subscription.isActive 
                ? `Expires in ${daysUntilExpiry} days`
                : 'Expired'}
            </div>
          )}

          {/* Usage Stats */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-tg-bg rounded-xl p-3">
              <div className="text-xs text-tg-hint">Messages Used</div>
              <div className="text-lg font-semibold mt-1">
                {subscription?.monthlyMessagesUsed || 0}
                <span className="text-sm text-tg-hint">
                  /{subscription?.limits?.monthlyMessages === Infinity ? '∞' : subscription?.limits?.monthlyMessages}
                </span>
              </div>
            </div>
            <div className="bg-tg-bg rounded-xl p-3">
              <div className="text-xs text-tg-hint">Credits</div>
              <div className="text-lg font-semibold mt-1">{subscription?.credits || 0}</div>
            </div>
          </div>
        </div>

        {/* Subscription Plans */}
        {subscription?.plan === 'free' && (
          <>
            <div className="text-sm font-semibold text-tg-hint mb-3 px-1">⭐ Upgrade to PRO</div>
            
            {pricing?.plans && Object.entries(pricing.plans).map(([key, plan]) => (
              <div 
                key={key}
                className="bg-tg-secondary-bg rounded-2xl p-4 mb-3 border border-black/5 dark:border-white/5"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-lg font-semibold">{plan.duration}</div>
                    <div className="text-sm text-tg-hint mt-1">
                      {plan.price} ⭐ {key.includes('yearly') && <span className="text-green-500">Save 17%</span>}
                    </div>
                  </div>
                  <button
                    className="px-4 py-2 rounded-xl bg-tg-button text-tg-button-text font-medium active:opacity-80 transition"
                    onClick={() => handleBuyPlan(key)}
                  >
                    Buy
                  </button>
                </div>
                <div className="space-y-2">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <span className="text-green-500">✓</span>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}

        {/* Buy Credits */}
        <div className="text-sm font-semibold text-tg-hint mb-3 px-1 mt-6">💰 Buy Credits</div>
        <div className="grid grid-cols-1 gap-3">
          {pricing?.credits && Object.entries(pricing.credits).map(([key, credit]) => (
            <div 
              key={key}
              className="bg-tg-secondary-bg rounded-xl p-4 flex justify-between items-center border border-black/5 dark:border-white/5"
            >
              <div>
                <div className="font-semibold">{credit.amount} Credits</div>
                <div className="text-sm text-tg-hint">{credit.price} ⭐</div>
              </div>
              <button
                className="px-4 py-2 rounded-xl bg-tg-button text-tg-button-text font-medium active:opacity-80 transition"
                onClick={() => handleBuyCredits(key)}
              >
                Buy
              </button>
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-tg-secondary-bg/50 rounded-xl border border-black/5 dark:border-white/5">
          <div className="text-xs text-tg-hint">
            <p className="mb-2">💡 <strong>How it works:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Free plan: 100 messages/month with GPT-3.5</li>
              <li>PRO plan: 5000 messages/month + GPT-4 access</li>
              <li>Credits: Pay per message when limit is reached</li>
              <li>1 message costs 1-4 credits depending on model</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SubscriptionPage

