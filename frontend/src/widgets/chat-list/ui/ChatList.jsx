import { useState } from 'react'

function ChatList({ chats, onSelectChat, onNewChat, onRenameChat, onDeleteChat }) {
  const [editingChatId, setEditingChatId] = useState(null)

  const handleRename = (chat) => {
    const newName = prompt('Введите новое название чата:', chat.name)
    if (newName && newName.trim() && newName !== chat.name) {
      onRenameChat(chat.id, newName.trim())
    }
  }

  const handleDelete = (chat) => {
    if (window.confirm(`Удалить чат "${chat.name}"?`)) {
      onDeleteChat(chat.id)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-tg-bg">
      <div className="flex justify-between items-center p-4 border-b border-tg-hint">
        <h1 className="text-2xl font-semibold">AI Assistant</h1>
        <button 
          className="w-10 h-10 rounded-full bg-tg-button text-tg-button-text flex items-center justify-center active:opacity-70 transition-opacity"
          onClick={onNewChat}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-5 text-center text-tg-hint">
            <p className="mb-4 text-base">No chats yet</p>
            <button 
              className="px-6 py-3 rounded-lg bg-tg-button text-tg-button-text text-base active:opacity-70 transition-opacity"
              onClick={onNewChat}
            >
              Create your first chat
            </button>
          </div>
        ) : (
          chats.map((chat) => (
            <div
              key={chat.id}
              className="relative"
            >
              <div
                className="flex items-center p-3 px-4 border-b border-black/5 dark:border-white/5 active:bg-tg-secondary-bg transition-colors cursor-pointer"
                onClick={() => onSelectChat(chat)}
                onContextMenu={(e) => {
                  e.preventDefault()
                  setEditingChatId(editingChatId === chat.id ? null : chat.id)
                }}
              >
                <div className="w-12 h-12 rounded-full bg-tg-button text-tg-button-text flex items-center justify-center mr-3 flex-shrink-0">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-base font-medium mb-1">{chat.name}</div>
                  <div className="text-sm text-tg-hint overflow-hidden text-ellipsis whitespace-nowrap">
                    {chat.messages.length > 0
                      ? chat.messages[chat.messages.length - 1].content.substring(0, 50) + '...'
                      : 'No messages yet'}
                  </div>
                </div>
                {editingChatId === chat.id ? (
                  <div className="flex gap-2 ml-2">
                    <button
                      className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center active:opacity-70"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRename(chat)
                        setEditingChatId(null)
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <button
                      className="w-9 h-9 rounded-full bg-red-500 text-white flex items-center justify-center active:opacity-70"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(chat)
                        setEditingChatId(null)
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="text-2xl text-tg-hint ml-2">›</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default ChatList
