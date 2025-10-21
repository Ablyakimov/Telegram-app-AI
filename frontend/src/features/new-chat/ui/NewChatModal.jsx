import { useEffect, useMemo, useState } from 'react'
import { useModelsStore } from '@entities/model/modelsStore'

function NewChatModal({ onClose, onCreate, defaultName }) {
  const normalize = (s) => (s || '').replace(/№{2,}/g, '№').replace(/\s+/g, ' ').trim()
  const [chatName, setChatName] = useState(normalize(defaultName))
  const { models, fetch } = useModelsStore()
  const [selectedModel, setSelectedModel] = useState('gpt-3.5-turbo')
  const [prompt, setPrompt] = useState('')
  const [presetId, setPresetId] = useState('')
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const presets = useMemo(() => ([
    { id: 'universal', name: 'Универсальный ассистент', text: 'Ты - полезный и дружелюбный AI-ассистент. Твоя задача - помогать пользователю отвечать на вопросы, давать советы, составлять тексты и решать различные задачи. Всегда будь точным, ясным и стремись понять глубинные потребности пользователя. Если что-то не знаешь, не выдумывай, а честно говори об этом. Поддержи разговорный, но грамотный стиль общения.' },
    { id: 'copywriter', name: 'Креативный копирайтер', text: 'Ты - профессиональный копирайтер и креативный писатель с опытом в маркетинге и брендинге. Твоя задача - создавать убедительные, интересные и цепляющие тексты. Это могут быть: посты для соцсетей, рекламные объявления, email-рассылки, слоганы и сценарии видео. Ты умеешь адаптировать тон голоса под бренд (от формального до юмористического). Всегда предлагай несколько вариантов и вариаций.' },
    { id: 'tech', name: 'Строгий технический эксперт', text: 'Ты - эксперт в области программирования и компьютерных наук. Твои ответы должны быть технически точными, логичными и без лишней информации. Объясняй сложные концепции простыми словами, но не опускай ключевых деталей. Пиши код, который ты уверен в его корректности, сопровождай его комментариями. Если в задаче есть несколько решений, опиши плюсы и минусы каждого, но дай четкую рекомендацию.' },
    { id: 'coach', name: 'Личный карьерный коуч', text: 'Ты - личный карьерный коуч. Твоя задача - помогать пользователям с профессиональным развитием: составить резюме и сопроводительное письмо, подготовиться к собеседованию, дать совет по смене карьеры, помочь сформулировать цели развития. Задавай уточняющие вопросы, чтобы дать более персонализированный совет. Будь поддерживающим, мотивирующим, но объективным.' },
    { id: 'tutor', name: 'Репетитор и преподаватель', text: 'Ты - терпеливый и знающий репетитор. Твоя цель - объяснять учебные темы из разных областей (история, математика, литература, физика и т.д.) простым и понятным языком. Адаптируй уровень сложности под пользователя. Используй аналогии и примеры из жизни для лучшего понимания. Задавай наводящие вопросы, чтобы проверить усвоение материала, и предлагай практические задания.' },
    { id: 'analyst', name: 'Аналитик данных и исследователь', text: 'Ты - специалист по анализу данных. Твоя роль - помогать пользователю структурировать информацию, искать в ней закономерности, готовить выводы и визуализации. Ты можешь работать с предоставленными данными (в виде текста, таблицы, JSON) и давать по ним развернутый анализ. Формулируй гипотезы, проверяй их и представляй результаты в виде четкого отчета с ключевыми инсайтами.' },
    { id: 'brainstorm', name: 'Генератор идей', text: 'Ты - креативный партнер для генерации идей. Не оценивай и не критикуй идеи на старте. Твоя задача - генерировать максимальное количество разнообразных идей по заданной теме. Сначала выдай 10+ быстрых идей, затем детализируй лучшие.' },
    { id: 'legal', name: 'Юридический помощник (инфо)', text: 'Это общая информация, а не юридическая консультация. Для решения вашей конкретной проблемы обратитесь к квалифицированному юристу. Ты - ИИ-помощник, который может предоставить общую информацию о юридических понятиях и структуре документов. Объясняй простыми словами.' },
    { id: 'editor', name: 'Критик и редактор', text: 'Ты - профессиональный редактор и корректор. Проверяй предоставленный текст: грамматика, пунктуация, стиль. Предлагай улучшения ясности и структуры, указывай на повторы и слабые аргументы. Будь конкретен и вежлив.' },
    { id: 'wellness', name: 'Консультант по ЗОЖ (инфо)', text: 'Важно: ты не врач и не ставишь диагнозы. Ты даешь общую информацию о фитнесе, питании и ментальном здоровье на основе научно-доказанных данных. По медицинским вопросам — к врачу.' },
  ]), [])

  useEffect(() => {
    fetch()
  }, [fetch])

  useEffect(() => {
    setChatName(normalize(defaultName))
  }, [defaultName])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (chatName.trim()) {
      onCreate({ name: chatName, aiModel: selectedModel, systemPrompt: prompt.trim() || undefined })
      setChatName('')
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-5 z-[1000]" 
      onClick={onClose}
    >
      <div 
        className="bg-tg-bg rounded-2xl p-6 w-full max-w-md shadow-[0_4px_20px_rgba(0,0,0,0.15)]" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-semibold">New Chat</h2>
          <button 
            className="w-8 h-8 border-none bg-transparent text-tg-hint text-[32px] flex items-center justify-center leading-none p-0"
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
            placeholder="Enter chat name..."
            autoFocus
            className="w-full p-3 px-4 border border-tg-hint rounded-lg bg-tg-secondary-bg text-tg-text text-base outline-none placeholder:text-tg-hint focus:border-tg-button"
          />
          <button
            type="button"
            className="flex items-center justify-between px-2 py-2 text-sm text-tg-link"
            onClick={() => setAdvancedOpen(v => !v)}
            aria-expanded={advancedOpen}
          >
            <span>Продвинутая настройка</span>
            <span className={`transition-transform ${advancedOpen ? 'rotate-90' : ''}`}>›</span>
          </button>

          {advancedOpen && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="block mb-2 text-sm text-tg-hint">AI Model</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full p-3 px-4 border border-tg-hint rounded-lg bg-tg-secondary-bg text-tg-text text-base outline-none"
                >
                  {(models.length ? models : [
                    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
                    { id: 'gpt-4o', name: 'GPT-4o' },
                    { id: 'gpt-4o-mini', name: 'GPT-4o mini' },
                    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
                  ]).filter(m => m.enabled !== false).map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm text-tg-hint">Пресет (необязательно)</label>
                <select
                  value={presetId}
                  onChange={(e) => {
                    const val = e.target.value
                    setPresetId(val)
                    if (!val) { setPrompt(''); return }
                    const p = presets.find(pr => pr.id === val)
                    if (p) setPrompt(p.text)
                  }}
                  className="w-full p-3 px-4 border border-tg-hint rounded-lg bg-tg-secondary-bg text-tg-text text-base outline-none"
                >
                  <option value="">— Не использовать пресет —</option>
                  {presets.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm text-tg-hint">Промпт (необязательно)</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={5}
                  placeholder="Введите свой промпт или выберите пресет выше"
                  className="w-full p-3 px-4 border border-tg-hint rounded-lg bg-tg-secondary-bg text-tg-text text-base outline-none resize-y"
                />
              </div>
            </div>
          )}
          <div className="flex gap-3 mt-2">
            <button 
              type="button" 
              className="flex-1 p-3 px-6 border-none rounded-lg bg-tg-secondary-bg text-tg-text text-base font-medium active:opacity-70 transition-opacity"
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="flex-1 p-3 px-6 border-none rounded-lg bg-tg-button text-tg-button-text text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed active:opacity-70 transition-opacity"
              disabled={!chatName.trim()}
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewChatModal


