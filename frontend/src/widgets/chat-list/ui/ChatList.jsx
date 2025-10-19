function ChatList({ chats, onSelectChat, onNewChat }) {
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
              className="flex items-center p-3 px-4 border-b border-black/5 dark:border-white/5 active:bg-tg-secondary-bg transition-colors cursor-pointer"
              onClick={() => onSelectChat(chat)}
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
              <div className="text-2xl text-tg-hint ml-2">›</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default ChatList


