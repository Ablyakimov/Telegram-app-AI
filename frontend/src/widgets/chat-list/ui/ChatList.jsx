import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'

function ChatList({ chats, onSelectChat, onNewChat, onRenameChat, onDeleteChat }) {
  const { t } = useTranslation()
  const [openMenuChatId, setOpenMenuChatId] = useState(null)
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 })

  const modelName = (id) => {
    const map = {
      'gpt-4o': 'GPT-4o',
      'gpt-4o-mini': 'GPT-4o mini',
      'gpt-4-turbo': 'GPT-4 Turbo',
      'gpt-3.5-turbo': 'GPT-3.5 Turbo',
    }
    return map[id] || id || 'GPT-4o'
  }

  const handleRename = (chat) => {
    const newName = prompt('Введите новое название чата:', chat.name)
    if (newName && newName.trim() && newName !== chat.name) {
      onRenameChat(chat.id, newName.trim())
    }
    setOpenMenuChatId(null)
  }

  const handleDelete = (chat) => {
    if (window.confirm(`Удалить чат "${chat.name}"?`)) {
      onDeleteChat(chat.id)
    }
    setOpenMenuChatId(null)
  }

  const toggleMenu = (e, chatId) => {
    e.stopPropagation()
    
    if (openMenuChatId === chatId) {
      setOpenMenuChatId(null)
      return
    }
    
    // Calculate menu position based on button position
    const rect = e.currentTarget.getBoundingClientRect()
    setMenuPosition({
      top: rect.bottom + 4, // 4px below the button
      right: window.innerWidth - rect.right
    })
    setOpenMenuChatId(chatId)
  }

  return (
    <div className="flex flex-col h-screen bg-tg-bg">
      <div className="px-4 pt-4 anim-fade-up">
        <div className="flex items-center justify-between bg-tg-secondary-bg/60 backdrop-blur rounded-2xl px-4 py-3 border border-black/5 dark:border-white/5 shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight">Telegram Mini App</h1>
          <button 
            className="w-9 h-9 rounded-full bg-tg-button text-tg-button-text flex items-center justify-center active:opacity-80 transition border border-black/10 dark:border-white/10 shadow-md shadow-black/10"
            onClick={onNewChat}
            aria-label="Create chat"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 mt-3">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-5 text-center text-tg-hint">
            <p className="mb-4 text-base">{t('chat.noMessages')}</p>
            <button 
              className="px-6 py-3 rounded-xl bg-tg-button text-tg-button-text text-base active:opacity-80 transition"
              onClick={onNewChat}
            >
              {t('chat.newChat')}
            </button>
          </div>
        ) : (
          chats.map((chat, i) => (
            <div
              key={chat.id}
              className="relative flex items-center p-3 px-4 bg-tg-secondary-bg rounded-2xl border border-black/5 dark:border-white/5 shadow-sm active:opacity-90 transition mb-3 anim-fade-up"
              style={{ animationDelay: `${Math.min(i*40,200)}ms` }}
            >
              <div
                className="flex items-center flex-1 min-w-0 cursor-pointer"
                onClick={() => onSelectChat(chat)}
              >
                <div className="w-10 h-10 rounded-full bg-tg-bg text-tg-text/70 flex items-center justify-center mr-3 flex-shrink-0 border border-black/5 dark:border-white/5">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-medium leading-tight">{chat.name}</div>
                  <div className="text-xs text-tg-hint overflow-hidden text-ellipsis whitespace-nowrap mt-0.5">
                    {modelName(chat.aiModel)}
                  </div>
                </div>
              </div>
              
              {/* Three dots menu button */}
              <button
                className="w-10 h-10 flex items-center justify-center text-tg-hint hover:bg-tg-secondary-bg rounded-full transition-colors ml-2 flex-shrink-0"
                onClick={(e) => toggleMenu(e, chat.id)}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="5" r="1.5" fill="currentColor"/>
                  <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
                  <circle cx="12" cy="19" r="1.5" fill="currentColor"/>
                </svg>
              </button>

            </div>
          ))
        )}
      </div>

      {/* Dropdown menu - rendered outside scroll container with fixed positioning */}
      {openMenuChatId !== null && (
        <>
          {/* Backdrop to close menu */}
          <div 
            className="fixed inset-0 z-[100]"
            onClick={() => setOpenMenuChatId(null)}
          />
          
          {/* Menu popup */}
          <div 
            className="fixed z-[110] bg-tg-bg border border-black/5 dark:border-white/5 rounded-xl shadow-lg overflow-hidden min-w-[180px] anim-dropdown"
            style={{ 
              top: `${menuPosition.top}px`, 
              right: `${menuPosition.right}px` 
            }}
          >
            <button
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-tg-secondary-bg active:bg-tg-secondary-bg transition"
              onClick={(e) => {
                e.stopPropagation()
                const chat = chats.find(c => c.id === openMenuChatId)
                if (chat) handleRename(chat)
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-blue-500">
                <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Переименовать</span>
            </button>
            <button
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-tg-secondary-bg active:bg-tg-secondary-bg transition text-red-500"
              onClick={(e) => {
                e.stopPropagation()
                const chat = chats.find(c => c.id === openMenuChatId)
                if (chat) handleDelete(chat)
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-red-500">
                <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Удалить</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default ChatList
