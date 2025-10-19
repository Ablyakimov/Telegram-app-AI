import { useState } from 'react'

function MessageInput({ onSend, disabled }) {
  const [message, setMessage] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (message.trim() && !disabled) {
      onSend(message)
      setMessage('')
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form className="flex items-end gap-2 p-3 px-4 border-t border-tg-hint bg-tg-bg" onSubmit={handleSubmit}>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Type a message..."
        disabled={disabled}
        rows="1"
        className="flex-1 min-h-[40px] max-h-[120px] p-2.5 px-3 border border-tg-hint rounded-[20px] bg-tg-secondary-bg text-tg-text text-[15px] resize-none outline-none placeholder:text-tg-hint"
      />
      <button 
        type="submit" 
        disabled={disabled || !message.trim()}
        className="w-10 h-10 border-none rounded-full bg-tg-button text-tg-button-text flex items-center justify-center flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed active:opacity-70 transition-opacity"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </form>
  )
}

export default MessageInput


