import { useState, useEffect } from 'react'
import ChatList from '@widgets/chat-list/ui/ChatList'
import ChatWindow from '@widgets/chat-window/ui/ChatWindow'
import NewChatModal from '@features/new-chat/ui/NewChatModal'
import { useUserStore } from '@entities/user/model/userStore'
import { useChatsStore } from '@entities/chat/model/chatsStore'

function ChatsPage() {
  const [tg] = useState(() => window.Telegram?.WebApp)
  const [user, setUser] = useState(null)
  const { user: storeUser, setUser } = useUserStore()
  const { chats, fetchByUser, createChat } = useChatsStore()
  const [selectedChat, setSelectedChat] = useState(null)
  const [showNewChatModal, setShowNewChatModal] = useState(false)
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    if (tg) {
      tg.ready()
      tg.expand()

      const telegramUser = tg.initDataUnsafe?.user
      if (telegramUser) {
        setUser({
          id: telegramUser.id,
          username: telegramUser.username || 'user',
          firstName: telegramUser.first_name || 'User',
        })
      } else {
        setUser({
          id: 1,
          username: 'testuser',
          firstName: 'Test User',
        })
      }

      const colorScheme = tg.colorScheme || 'light'
      setTheme(colorScheme)
      document.documentElement.setAttribute('data-theme', colorScheme)

      tg.onEvent('themeChanged', () => {
        const newColorScheme = tg.colorScheme
        setTheme(newColorScheme)
        document.documentElement.setAttribute('data-theme', newColorScheme)
      })
    } else {
      setUser({
        id: 1,
        username: 'testuser',
        firstName: 'Test User',
      })
    }
  }, [tg])

  useEffect(() => {
    if (storeUser) {
      fetchByUser(storeUser.id)
    }
  }, [storeUser])

  const handleCreateChat = async (chatName) => {
    try {
      const newChat = await createChat({ name: chatName, userId: storeUser.id })
      setSelectedChat(newChat)
      setShowNewChatModal(false)
    } catch (error) {
      console.error('Failed to create chat:', error)
    }
  }

  const handleSelectChat = (chat) => {
    setSelectedChat(chat)
  }

  const handleBackToList = () => {
    setSelectedChat(null)
  }

  return (
    <div className="w-full h-screen flex flex-col bg-tg-bg text-tg-text">
      {!selectedChat ? (
        <ChatList
          chats={chats}
          onSelectChat={handleSelectChat}
          onNewChat={() => setShowNewChatModal(true)}
        />
      ) : (
        <ChatWindow
          chat={selectedChat}
          user={storeUser}
          onBack={handleBackToList}
        />
      )}

      {showNewChatModal && (
        <NewChatModal
          onClose={() => setShowNewChatModal(false)}
          onCreate={handleCreateChat}
        />
      )}
    </div>
  )
}

export default ChatsPage


