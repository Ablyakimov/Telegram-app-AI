import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useModelsStore } from '@entities/model/modelsStore'
import { useSubscriptionStore } from '@entities/subscription/model/subscriptionStore'

function NewChatModal({ onClose, onCreate, defaultName }) {
  const { t } = useTranslation()
  const normalize = (s) => (s || '').replace(/№{2,}/g, '№').replace(/\s+/g, ' ').trim()
  const [chatName, setChatName] = useState(normalize(defaultName))
  const { models, fetch } = useModelsStore()
  const { subscription, fetchSubscription } = useSubscriptionStore()
  const [selectedModel, setSelectedModel] = useState('gpt-3.5-turbo')
  const [prompt, setPrompt] = useState('')
  const [presetId, setPresetId] = useState('')
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const presets = useMemo(() => ([
    { id: 'universal', name: t('presets.universal'), text: t('presets.universalPrompt') },
    { id: 'copywriter', name: t('presets.copywriter'), text: t('presets.copywriterPrompt') },
    { id: 'tech', name: t('presets.tech'), text: t('presets.techPrompt') },
    { id: 'coach', name: t('presets.coach'), text: t('presets.coachPrompt') },
    { id: 'tutor', name: t('presets.tutor'), text: t('presets.tutorPrompt') },
    { id: 'analyst', name: t('presets.analyst'), text: t('presets.analystPrompt') },
    { id: 'brainstorm', name: t('presets.brainstorm'), text: t('presets.brainstormPrompt') },
    { id: 'legal', name: t('presets.legal'), text: t('presets.legalPrompt') },
    { id: 'editor', name: t('presets.editor'), text: t('presets.editorPrompt') },
    { id: 'wellness', name: t('presets.wellness'), text: t('presets.wellnessPrompt') },
  ]), [t])

  useEffect(() => {
    fetch()
    fetchSubscription()
  }, [fetch, fetchSubscription])

  useEffect(() => {
    setChatName(normalize(defaultName))
  }, [defaultName])

  // Get all models with availability status
  const availableModels = useMemo(() => {
    const allModels = models.length ? models : [
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
      { id: 'gpt-4o-mini', name: 'GPT-4o mini' },
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
    ]
    
    if (!subscription) {
      return allModels.map(m => ({ ...m, disabled: false }))
    }
    
    const isFree = subscription.plan === 'free'
    const isPro = subscription.plan === 'pro' && subscription.expiresAt && new Date(subscription.expiresAt) > new Date()
    
    return allModels.map(m => {
      // Free users can only use GPT-3.5
      if (isFree && m.id !== 'gpt-3.5-turbo') {
        return { ...m, disabled: true, disabledReason: 'PRO required' }
      }
      
      // Check if model is in allowed list (if limits exist)
      if (subscription.limits?.allowedModels) {
        const allowed = subscription.limits.allowedModels.includes(m.id)
        return { ...m, disabled: !allowed, disabledReason: allowed ? null : 'Not available' }
      }
      
      return { ...m, disabled: false }
    })
  }, [subscription, models])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!chatName.trim()) return

    // Check if user has access to selected model
    if (subscription) {
      const isFree = subscription.plan === 'free'
      const isPro = subscription.plan === 'pro' && subscription.expiresAt && new Date(subscription.expiresAt) > new Date()
      
      // If free user tries to use non-GPT-3.5 model
      if (isFree && selectedModel !== 'gpt-3.5-turbo') {
        const tg = window.Telegram?.WebApp
        const message = t('subscription.upgradeRequired')
        
        if (tg?.showConfirm) {
          tg.showConfirm(message + '\n\n' + t('subscription.upgradePrompt'), (confirmed) => {
            if (confirmed) {
              onClose()
              // Signal parent to show subscription page
              window.dispatchEvent(new CustomEvent('show-subscription'))
            }
          })
        } else {
          const shouldUpgrade = window.confirm(message + '\n\n' + t('subscription.upgradePrompt'))
          if (shouldUpgrade) {
            onClose()
            window.dispatchEvent(new CustomEvent('show-subscription'))
          }
        }
        return
      }
    }

    onCreate({ name: chatName, aiModel: selectedModel, systemPrompt: prompt.trim() || undefined })
    setChatName('')
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-5 z-[1000] anim-backdrop" 
      onClick={onClose}
    >
      <div 
        className="bg-tg-bg rounded-2xl p-6 w-full max-w-md border border-black/5 dark:border-white/5 shadow-lg anim-scale-in" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-semibold">{t('chat.newChat')}</h2>
          <button 
            className="w-8 h-8 border border-black/10 dark:border-white/10 rounded-full bg-transparent text-tg-hint text-[20px] flex items-center justify-center leading-none p-0 shadow-sm"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <input
            type="text"
            value={chatName}
            onChange={(e) => setChatName(e.target.value)}
            placeholder={t('chat.chatTitle')}
            className="w-full p-3 px-4 border border-black/5 dark:border-white/5 rounded-xl bg-tg-secondary-bg text-tg-text text-base outline-none placeholder:text-tg-hint focus:outline-none"
          />
          <button
            type="button"
            className="flex items-center justify-between px-2 py-2 text-sm text-tg-link active:opacity-80 transition"
            onClick={() => setAdvancedOpen(v => !v)}
            aria-expanded={advancedOpen}
          >
            <span>{t('settings.advanced')}</span>
            <span className={`transition-transform duration-200 ${advancedOpen ? 'rotate-90' : ''}`}>›</span>
          </button>

          <div className={`overflow-hidden transition-all duration-300 ${advancedOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="flex flex-col gap-4 bg-tg-secondary-bg/50 rounded-2xl p-4 border border-black/5 dark:border-white/5">
              <div>
                <label className="block mb-2 text-sm text-tg-hint">{t('models.selectModel')}</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full p-3 px-4 border border-black/5 dark:border-white/5 rounded-xl bg-tg-bg text-tg-text text-base outline-none"
                >
                  {availableModels.filter(m => m.enabled !== false).map((m) => (
                    <option 
                      key={m.id} 
                      value={m.id}
                      disabled={m.disabled}
                    >
                      {m.name}{m.disabled && m.disabledReason ? ` (🔒 ${m.disabledReason})` : ''}
                    </option>
                  ))}
                </select>
                {subscription?.plan === 'free' && (
                  <p className="text-xs text-tg-hint mt-2">
                    {t('subscription.freeModelHint')}
                  </p>
                )}
              </div>

              <div>
                <label className="block mb-2 text-sm text-tg-hint">{t('settings.preset')}</label>
                <select
                  value={presetId}
                  onChange={(e) => {
                    const val = e.target.value
                    setPresetId(val)
                    if (!val) { setPrompt(''); return }
                    const p = presets.find(pr => pr.id === val)
                    if (p) setPrompt(p.text)
                  }}
                  className="w-full p-3 px-4 border border-black/5 dark:border-white/5 rounded-xl bg-tg-bg text-tg-text text-base outline-none"
                >
                  <option value="">{t('settings.noPreset')}</option>
                  {presets.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm text-tg-hint">{t('settings.prompt')}</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={5}
                  placeholder={t('settings.customPrompt')}
                  className="w-full p-3 px-4 border border-black/5 dark:border-white/5 rounded-xl bg-tg-bg text-tg-text text-base outline-none resize-y"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-2">
            <button 
              type="button" 
            className="flex-1 p-3 px-6 rounded-xl bg-tg-secondary-bg text-tg-text text-base font-medium active:opacity-80 transition border border-black/10 dark:border-white/10 shadow-sm"
              onClick={onClose}
            >
              {t('common.cancel')}
            </button>
            <button 
              type="submit" 
            className="flex-1 p-3 px-6 rounded-xl bg-tg-button text-tg-button-text text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed active:opacity-80 transition border border-black/10 dark:border-white/10 shadow-md"
              disabled={!chatName.trim()}
            >
              {t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewChatModal


