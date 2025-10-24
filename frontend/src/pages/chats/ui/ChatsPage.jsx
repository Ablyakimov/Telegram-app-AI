import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import ChatList from '@widgets/chat-list/ui/ChatList'
import ChatWindow from '@widgets/chat-window/ui/ChatWindow'
import SubscriptionPage from '@widgets/subscription/ui/SubscriptionPage'
import NewChatModal from '@features/new-chat/ui/NewChatModal'
import { useUserStore } from '@entities/user/model/userStore'
import { useChatsStore } from '@entities/chat/model/chatsStore'

function ChatsPage() {
  const { t } = useTranslation()
  const [tg] = useState(() => window.Telegram?.WebApp)
  const { user: storeUser, setUser } = useUserStore()
  const { chats, fetchByUser, createChat, updateChatName, deleteChat } = useChatsStore()
  const [selectedChat, setSelectedChat] = useState(null)
  const [showNewChatModal, setShowNewChatModal] = useState(false)
  const [showSubscription, setShowSubscription] = useState(false)
  const [theme, setTheme] = useState('light')
  
  useEffect(() => {
    // Platform detection → apple | android | windows
    const platformFromTg = window.Telegram?.WebApp?.platform
    const ua = (navigator.userAgent || '').toLowerCase()
    let platform = 'windows'
    if (platformFromTg) {
      if (['ios', 'macos'].includes(platformFromTg)) platform = 'apple'
      else if (platformFromTg.includes('android')) platform = 'android'
      else platform = 'windows'
    } else {
      if (/iphone|ipad|ipod|mac os x/.test(ua)) platform = 'apple'
      else if (/android/.test(ua)) platform = 'android'
    }
    document.documentElement.setAttribute('data-platform', platform)
  }, [])

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
  }, [tg, setUser])

  useEffect(() => {
    if (storeUser) {
      fetchByUser(storeUser.id)
    }
  }, [storeUser])

  const handleCreateChat = async ({ name, aiModel }) => {
    try {
      const newChat = await createChat({ name, userId: storeUser.id, aiModel })
      setSelectedChat(newChat)
      setShowNewChatModal(false)
    } catch (error) {
      console.error('Failed to create chat:', error)
      
      // Check if it's a subscription error
      if (error.response?.data) {
        const { message, reason, subscription } = error.response.data
        
        if (reason === 'model_not_allowed') {
          // Show upgrade prompt
          if (tg?.showAlert) {
            tg.showAlert(message + '\n\nOpen subscription page to upgrade?', (confirmed) => {
              if (confirmed) {
                setShowNewChatModal(false)
                setShowSubscription(true)
              }
            })
          } else {
            const shouldUpgrade = window.confirm(message + '\n\nOpen subscription page to upgrade?')
            if (shouldUpgrade) {
              setShowNewChatModal(false)
              setShowSubscription(true)
            }
          }
        } else {
          // Generic error
          if (tg?.showAlert) {
            tg.showAlert(message || 'Failed to create chat')
          } else {
            alert(message || 'Failed to create chat')
          }
        }
      } else {
        // Network or other error
        if (tg?.showAlert) {
          tg.showAlert('Failed to create chat. Please try again.')
        } else {
          alert('Failed to create chat. Please try again.')
        }
      }
    }
  }

  const handleSelectChat = (chat) => {
    setSelectedChat(chat)
  }

  const handleBackToList = () => {
    setSelectedChat(null)
  }

  const handleRenameChat = async (chatId, newName) => {
    try {
      await updateChatName(chatId, newName)
    } catch (error) {
      console.error('Failed to rename chat:', error)
      alert('Ошибка при переименовании чата')
    }
  }

  const handleDeleteChat = async (chatId) => {
    try {
      await deleteChat(chatId)
      // If current chat is deleted, go back to list
      if (selectedChat?.id === chatId) {
        setSelectedChat(null)
      }
    } catch (error) {
      console.error('Failed to delete chat:', error)
      alert('Ошибка при удалении чата')
    }
  }

  return (
    <div className="w-full h-screen flex flex-col bg-tg-bg text-tg-text">
      {showSubscription ? (
        <SubscriptionPage onBack={() => setShowSubscription(false)} />
      ) : !selectedChat ? (
        <ChatList
          chats={chats}
          onSelectChat={handleSelectChat}
          onNewChat={() => setShowNewChatModal(true)}
          onRenameChat={handleRenameChat}
          onDeleteChat={handleDeleteChat}
          onShowSubscription={() => setShowSubscription(true)}
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
          defaultName={`${t('chat.chatNumber')} ${(chats?.length || 0) + 1}`}
        />
      )}
    </div>
  )
}

export default ChatsPage


