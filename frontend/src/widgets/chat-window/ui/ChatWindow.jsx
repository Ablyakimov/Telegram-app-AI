import { useEffect, useMemo, useRef } from 'react'
import MessageInput from '@features/send-message/ui/MessageInput'
import { useMessagesStore } from '@entities/message/model/messagesStore'

function ChatWindow({ chat, user, onBack }) {
  const { messagesByChatId, loadMessages, sendMessage, uploadFile, loadingByChatId } = useMessagesStore()
  const messagesEndRef = useRef(null)
  const messages = useMemo(() => messagesByChatId[chat.id] || [], [messagesByChatId, chat.id])

  useEffect(() => {
    loadMessages(chat.id)
  }, [chat.id, loadMessages])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (message) => {
    if (!message.trim()) return
    await sendMessage(chat.id, message)
  }

  const handleUploadFile = async (file) => {
    console.log('📎 ChatWindow: uploading file', { name: file.name, type: file.type, size: file.size })
    try {
      await uploadFile(chat.id, file)
      console.log('✅ ChatWindow: file uploaded successfully')
    } catch (error) {
      console.error('❌ ChatWindow: file upload error', error)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-tg-bg">
      <div className="flex items-center p-3 px-4 border-b border-tg-hint bg-tg-bg">
        <button 
          className="w-10 h-10 border-none bg-transparent text-tg-link text-[32px] flex items-center justify-center mr-2"
          onClick={onBack}
        >
          ‹
        </button>
        <div className="flex flex-col">
          <h2 className="text-lg font-semibold leading-tight">{chat.name}</h2>
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
            className={`max-w-[80%] flex flex-col gap-1 ${
              message.role === 'user' ? 'self-end' : 'self-start'
            }`}
          >
            <div 
              className={`p-3 px-4 text-[15px] leading-relaxed break-words ${
                message.role === 'user' 
                  ? 'bg-tg-button text-tg-button-text rounded-2xl rounded-br-sm' 
                  : 'bg-tg-secondary-bg text-tg-text rounded-2xl rounded-bl-sm'
              }`}
            >
              {message.content}
            </div>
            <div className="text-[11px] text-tg-hint px-2 self-end">
              {new Date(message.timestamp || Date.now()).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        ))}
        {loadingByChatId[chat.id] && (
          <div className="max-w-[80%] flex flex-col gap-1 self-start">
            <div className="bg-tg-secondary-bg text-tg-text rounded-2xl rounded-bl-sm p-3 px-4 flex gap-1">
              <span className="w-2 h-2 rounded-full bg-tg-hint animate-bounce [animation-delay:0ms]"></span>
              <span className="w-2 h-2 rounded-full bg-tg-hint animate-bounce [animation-delay:200ms]"></span>
              <span className="w-2 h-2 rounded-full bg-tg-hint animate-bounce [animation-delay:400ms]"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <MessageInput onSend={handleSendMessage} onUpload={handleUploadFile} disabled={!!loadingByChatId[chat.id]} />
    </div>
  )
}

export default ChatWindow


