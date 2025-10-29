import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import TextareaAutosize from 'react-textarea-autosize'
import { useSubscriptionStore } from '@entities/subscription/model/subscriptionStore'

function MessageInput({ onSend, onUpload, disabled, replying }) {
  const { t } = useTranslation()
  const [message, setMessage] = useState('')
  const [recording, setRecording] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const fileInputRef = useRef(null)
  const recognitionRef = useRef(null)
  const transcriptRef = useRef({ final: '', interim: '' })
  const { subscription } = useSubscriptionStore()

  useEffect(() => {
    const checkMobile = () => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      if (isMac) {
        setIsMobile(false)
        return
      }
      
      const telegramPlatform = window.Telegram?.WebApp?.platform
      
      if (telegramPlatform) {
        const desktopPlatforms = ['macos', 'tdesktop', 'unigram', 'web', 'weba', 'webk', 'unknown', 'linux', 'windows']
        const isDesktop = desktopPlatforms.includes(telegramPlatform.toLowerCase())
        
        if (isDesktop) {
          setIsMobile(false)
          return
        }
        
        const mobilePlatforms = ['android', 'ios', 'android_x']
        const isTelegramMobile = mobilePlatforms.includes(telegramPlatform.toLowerCase())
        setIsMobile(isTelegramMobile)
        return
      }
      
      const ua = (navigator.userAgent || navigator.vendor || window.opera || '').toLowerCase()
      const isDesktopUA = /mac|windows|linux|x11/i.test(ua) && !/mobile|android|iphone|ipad|ipod/i.test(ua)
      
      if (isDesktopUA) {
        setIsMobile(false)
        return
      }
      
      const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua)
      setIsMobile(isMobileUA)
    }
    checkMobile()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (message.trim() && !disabled && !replying) {
      // Check message length limit
      const isPro = subscription?.plan === 'pro' && subscription?.expiresAt && new Date(subscription.expiresAt) > new Date()
      const maxLength = isPro ? 4000 : 500
      
      if (message.length > maxLength) {
        const tg = window.Telegram?.WebApp
        const errorMsg = t('chat.messageTooLong', { maxLength })
        
        if (tg?.showAlert) {
          tg.showAlert(errorMsg)
        } else {
          alert(errorMsg)
        }
        return
      }
      
      await onSend(message)
      // Добавляем небольшую задержку перед очисткой, чтобы избежать мерцания кнопок
      setTimeout(() => setMessage(''), 50)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleAttachClick = () => {
    if (!disabled) fileInputRef.current?.click()
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) {
      return
    }
    
    try {
      if (onUpload) {
        await onUpload(file)
      } else {
      }
    } catch (error) {
      console.error('❌ MessageInput: error in handleFileChange', error)
      alert('Ошибка при загрузке файла: ' + (error.message || 'Unknown error'))
    } finally {
      e.target.value = ''
    }
  }

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition || !isMobile) return
    
    const recognition = new SpeechRecognition()
    recognition.lang = 'ru-RU'
    recognition.interimResults = true
    recognition.continuous = true
    recognition.maxAlternatives = 1
    
    recognition.onresult = (event) => {
      transcriptRef.current.interim = ''
      
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          transcriptRef.current.final += transcript + ' '
        } else {
          transcriptRef.current.interim += transcript
        }
      }
      
    }
    
    recognition.onend = () => {
      const fullTranscript = (transcriptRef.current.final + transcriptRef.current.interim).trim()

      setRecording(false)

      if (fullTranscript) {
        onSend(fullTranscript)
      }

      // Reset transcripts
      transcriptRef.current = { final: '', interim: '' }
    }
    
    recognition.onerror = (event) => {
      console.error('❌ Speech recognition error:', event.error)
      
      if (event.error === 'no-speech') return
      
      setRecording(false)
      
      if (event.error === 'not-allowed') {
        alert('Доступ к микрофону запрещен. Разрешите доступ в настройках Telegram.')
      }
    }
    
    recognitionRef.current = recognition
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [isMobile, onSend])

  const startRecognition = () => {
    if (!recognitionRef.current) {
      alert('Распознавание речи не поддерживается на этом устройстве')
      return
    }
    
    transcriptRef.current = { final: '', interim: '' }
    
    try {
      setRecording(true)
      recognitionRef.current.start()
    } catch (e) {
      console.error('Error starting recognition:', e)
      setRecording(false)
    }
  }

  const stopRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }

  return (
    <form className="p-3 px-4 pb-safe-offset-4 bg-tg-bg anim-fade-in" onSubmit={handleSubmit}>
      <div className="flex items-center gap-3">
        {/* Left side - attach button */}
        <button
          type="button"
          onClick={handleAttachClick}
          className="w-10 h-10 rounded-full bg-tg-secondary-bg text-tg-text/70 hover:text-tg-text flex items-center justify-center flex-shrink-0 active:scale-95 transition-all shadow-sm"
          disabled={disabled}
          aria-label="Attach file"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12V7a5 5 0 0 0-10 0v9a3 3 0 1 0 6 0V8"/>
          </svg>
        </button>

        {/* Right side - input with buttons */}
        <div className="flex items-center gap-3 bg-tg-secondary-bg rounded-full px-4 py-2 border border-black/10 dark:border-white/10 shadow-lg anim-scale-in flex-1">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="flex-1 flex flex-col">
            <TextareaAutosize
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={t('chat.placeholder')}
              disabled={disabled}
              minRows={1}
              maxRows={4}
              className="w-full bg-transparent text-tg-text text-[15px] resize-none outline-none placeholder:text-tg-hint leading-5"
            />
            {message.length > 0 && (() => {
              const isPro = subscription?.plan === 'pro' && subscription?.expiresAt && new Date(subscription.expiresAt) > new Date()
              const maxLength = isPro ? 4000 : 500
              const isNearLimit = message.length > maxLength * 0.8
              const isOverLimit = message.length > maxLength
              
              return (
                <div className={`text-[10px] mt-0.5 transition-colors ${
                  isOverLimit ? 'text-red-500 font-medium' : 
                  isNearLimit ? 'text-yellow-500' : 
                  'text-tg-hint'
                }`}>
                  {t('chat.messageLimit', { current: message.length, max: maxLength })}
                </div>
              )
            })()}
          </div>

          {/* Right side buttons - voice or send with smooth animations */}
          <div className="relative w-10 h-10 flex items-center justify-center">
        {/* Voice button - fades in when no text, not recording, and not replying */}
        <button
          type="button"
          onClick={startRecognition}
          className={`absolute w-10 h-10 rounded-full bg-tg-bg text-tg-text/70 hover:text-tg-text flex items-center justify-center flex-shrink-0 active:scale-95 shadow-sm transition-all duration-200 ${
            isMobile && !message.trim() && !recording && !replying
              ? 'opacity-100 scale-100 pointer-events-auto'
              : 'opacity-0 scale-90 pointer-events-none'
          }`}
          disabled={disabled}
          aria-label="Voice input"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 14a3 3 0 0 0 3-3V7a3 3 0 1 0-6 0v4a3 3 0 0 0 3 3Z"/>
            <path d="M19 11v1a7 7 0 0 1-14 0v-1"/>
            <path d="M12 19v3"/>
          </svg>
        </button>

        {/* Send button - fades in when there's text and not replying */}
        <button
          type="submit"
          disabled={disabled || replying}
          className={`absolute w-10 h-10 rounded-full bg-tg-button text-white flex items-center justify-center flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-lg disabled:shadow-sm transition-all duration-200 ${
            message.trim() && !replying ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-90 pointer-events-none'
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"/>
          </svg>
        </button>

        {/* Recording stop button - fades in when recording */}
        <button
          type="button"
          onClick={stopRecognition}
          className={`absolute w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center flex-shrink-0 active:scale-95 shadow-lg shadow-red-500/30 transition-all duration-200 ${
            recording ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-90 pointer-events-none'
          }`}
          disabled={disabled}
          aria-label="Stop recording"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12" rx="2"/>
          </svg>
        </button>
          </div>
        </div>
      </div>
    </form>
  )
}

export default MessageInput


