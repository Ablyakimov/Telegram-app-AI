import { useState } from 'react'

function NewChatModal({ onClose, onCreate }) {
  const [chatName, setChatName] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (chatName.trim()) {
      onCreate(chatName)
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


