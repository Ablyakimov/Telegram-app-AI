import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useUserStore } from '@entities/user/model/userStore'
import { post } from '@shared/api/http'

export default function AdminPage({ onBack }) {
  const { t } = useTranslation()
  const { role, fetchUser } = useUserStore()
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  if (role !== 'admin') {
    return (
      <div className="min-h-screen bg-tg-bg text-tg-text p-4 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Доступ запрещен</h1>
          <p className="text-tg-hint">У вас нет прав администратора</p>
        </div>
      </div>
    )
  }

  const handleSendBroadcast = async (e) => {
    e.preventDefault()
    if (!message.trim()) {
      alert('Введите сообщение')
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await post('/broadcast/send', { message })
      setResult(response)
    } catch (error) {
      setResult({
        success: false,
        error: error.message || 'Ошибка при отправке',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-tg-bg text-tg-text p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          {onBack && (
            <button
              onClick={onBack}
              className="text-tg-button hover:opacity-80 transition-opacity"
            >
              ← Назад
            </button>
          )}
          <h1 className="text-2xl font-bold">Панель администратора</h1>
        </div>

        <div className="bg-tg-secondary-bg rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Массовая рассылка</h2>
          
          <form onSubmit={handleSendBroadcast} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Сообщение для всех пользователей
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Введите сообщение, которое будет отправлено всем пользователям бота..."
                className="w-full bg-tg-bg border border-tg-hint rounded-xl p-3 text-tg-text resize-none focus:outline-none focus:border-tg-button focus:ring-2 focus:ring-tg-button/20"
                rows={6}
                disabled={loading}
              />
              <div className="text-xs text-tg-hint mt-1">
                {message.length} символов
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !message.trim()}
              className="w-full bg-tg-button text-tg-button-text rounded-xl px-4 py-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            >
              {loading ? 'Отправка...' : 'Отправить всем пользователям'}
            </button>
          </form>

          {result && (
            <div className={`mt-4 p-4 rounded-xl ${
              result.success 
                ? 'bg-green-500/20 border border-green-500/50' 
                : 'bg-red-500/20 border border-red-500/50'
            }`}>
              {result.success ? (
                <div>
                  <div className="font-semibold mb-2">✅ Рассылка завершена</div>
                  <div className="text-sm space-y-1">
                    <div>Всего получателей: {result.total}</div>
                    <div className="text-green-400">Успешно отправлено: {result.sent}</div>
                    {result.failed > 0 && (
                      <div className="text-red-400">Ошибок: {result.failed}</div>
                    )}
                  </div>
                  {result.errors && result.errors.length > 0 && (
                    <details className="mt-2">
                      <summary className="text-sm cursor-pointer">Показать ошибки</summary>
                      <div className="mt-2 text-xs space-y-1">
                        {result.errors.map((err, idx) => (
                          <div key={idx} className="opacity-80">
                            User {err.userId}: {err.error}
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              ) : (
                <div>
                  <div className="font-semibold mb-2">❌ Ошибка</div>
                  <div className="text-sm">{result.error || result.message}</div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-tg-secondary-bg rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-4">Информация</h2>
          <div className="text-sm text-tg-hint space-y-2">
            <p>
              • Сообщения отправляются всем пользователям, которые хотя бы раз запускали бота
            </p>
            <p>
              • Если пользователь заблокировал бота, отправка не удастся (будет в списке ошибок)
            </p>
            <p>
              • Рассылка выполняется последовательно, чтобы не превысить лимиты Telegram API
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

