import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import MessageInput from '@features/send-message/ui/MessageInput'
import { useMessagesStore } from '@entities/message/model/messagesStore'
import Markdown from '@shared/ui/Markdown'

function ChatWindow({ chat, user, onBack }) {
  const { t } = useTranslation()
  const { messagesByChatId, loadMessages, sendMessage, uploadFile, loadingByChatId, replyingByChatId } = useMessagesStore()
  const [viewportHeight, setViewportHeight] = useState('100vh')
  const messages = useMemo(() => messagesByChatId[chat.id] || [], [messagesByChatId, chat.id])
  const messagesEndRef = useRef(null)

  useEffect(() => {
    loadMessages(chat.id)
  }, [chat.id, loadMessages])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, chat.id])

  useEffect(() => {
    const updateViewportHeight = () => {
      setViewportHeight(`${window.innerHeight}px`)
    }

    updateViewportHeight()

    window.addEventListener('resize', updateViewportHeight)
    window.addEventListener('orientationchange', updateViewportHeight)

    if (window.visualViewport) {
      const handleVisualViewportChange = () => {
        if (window.visualViewport) {
          setViewportHeight(`${window.visualViewport.height}px`)
        }
      }
      window.visualViewport.addEventListener('resize', handleVisualViewportChange)

      return () => {
        window.removeEventListener('resize', updateViewportHeight)
        window.removeEventListener('orientationchange', updateViewportHeight)
        window.visualViewport.removeEventListener('resize', handleVisualViewportChange)
      }
    }

    return () => {
      window.removeEventListener('resize', updateViewportHeight)
      window.removeEventListener('orientationchange', updateViewportHeight)
    }
  }, [])


  const handleSendMessage = async (message) => {
    if (!message.trim()) return
    try {
      await sendMessage(chat.id, message)
    } catch (error) {
      console.error('Failed to send message:', error)
      
      if (error.response?.data) {
        const { message: errorMsg, reason } = error.response.data
        const tg = window.Telegram?.WebApp
        
        if (reason === 'duplicate_message') {
          if (tg?.showAlert) {
            tg.showAlert(t('chat.duplicateMessage'))
          } else {
            alert(t('chat.duplicateMessage'))
          }
          return
        }
        
        if (reason === 'model_not_allowed' || reason === 'monthly_limit_reached') {
          if (tg?.showConfirm) {
            tg.showConfirm(errorMsg + '\n\nOpen subscription page?', (confirmed) => {
              if (confirmed) {
                // Need to navigate back and show subscription
                // This requires lifting state up or using a router
                alert('Please navigate to subscription page from chat list.')
              }
            })
          } else {
            alert(errorMsg + '\n\nPlease upgrade your subscription from the chat list.')
          }
          return
        }
        
        // Generic error with message
        if (errorMsg) {
          if (tg?.showAlert) {
            tg.showAlert(errorMsg)
          } else {
            alert(errorMsg)
          }
        }
      }
    }
  }

  const handleUploadFile = async (file) => {
    try {
      await uploadFile(chat.id, file)
    } catch (error) {
      console.error('❌ ChatWindow: file upload error', error)
    }
  }

  return (
    <div className="flex flex-col bg-tg-bg" style={{ height: viewportHeight }}>
      <div className="flex items-center gap-3 p-3 px-4 bg-tg-bg sticky top-0 z-10 anim-fade-in">
        <button 
          className="w-10 h-10 border-none bg-transparent text-tg-link text-[32px] flex items-center justify-center mr-2"
          onClick={onBack}
        >
          ‹
        </button>
        <div className="flex flex-col">
          <h2 className="text-[17px] font-semibold leading-tight">{chat.name}</h2>
          <div className="text-[12px] text-tg-hint leading-none mt-0.5">
            {(function map(id){
              const m = { 'gpt-3.5-turbo':'GPT-3.5 Turbo','gpt-3.5-turbo-16k':'GPT-3.5 Turbo 16K','gpt-4o':'GPT-4o','gpt-4o-mini':'GPT-4o mini','gpt-4-turbo':'GPT-4 Turbo','gpt-4.1':'GPT-4.1' };
              return m[id] || id;
            })(chat.aiModel)}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`max-w-[80%] flex flex-col gap-1 anim-msg ${
              message.role === 'user' ? 'self-end' : 'self-start'
            }`}
          >
            <div 
              className={`p-3 px-4 text-[15px] leading-relaxed break-words shadow-sm ${
                message.role === 'user' 
                  ? 'bg-tg-button text-tg-button-text rounded-2xl rounded-br-sm' 
                  : 'bg-tg-secondary-bg text-tg-text rounded-2xl rounded-bl-sm'
              }`}
            >
              <Markdown text={message.content} />
            </div>
            <div className="text-[11px] text-tg-hint px-2 self-end">
              {new Date(message.timestamp || Date.now()).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        ))}
        {replyingByChatId[chat.id] && (
          <div className="max-w-[80%] flex flex-col gap-1 self-start">
            <div className="bg-tg-secondary-bg text-tg-text rounded-2xl rounded-bl-sm p-3 px-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-tg-hint animate-bounce [animation-delay:0ms]"></span>
              <span className="w-2 h-2 rounded-full bg-tg-hint animate-bounce [animation-delay:200ms]"></span>
              <span className="w-2 h-2 rounded-full bg-tg-hint animate-bounce [animation-delay:400ms]"></span>
              <span className="text-sm text-tg-hint ml-2">{t('chat.typing')}</span>
            </div>
          </div>
        )}
        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} />
      </div>

      <MessageInput onSend={handleSendMessage} onUpload={handleUploadFile} disabled={!!replyingByChatId[chat.id]} replying={!!replyingByChatId[chat.id]} />
    </div>
  )
}

export default ChatWindow


