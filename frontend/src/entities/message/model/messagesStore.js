import { create } from 'zustand'
import { ChatsApi } from '@shared/api/chats'

export const useMessagesStore = create((set) => ({
  messagesByChatId: {},
  loadingByChatId: {},
  errorByChatId: {},
  replyingByChatId: {},

  loadMessages: async (chatId) => {
    set((state) => ({
      loadingByChatId: { ...state.loadingByChatId, [chatId]: true },
      errorByChatId: { ...state.errorByChatId, [chatId]: null },
    }))
    try {
      const messages = await ChatsApi.getMessages(chatId)
      set((state) => ({
        messagesByChatId: { ...state.messagesByChatId, [chatId]: messages },
      }))
    } catch (e) {
      set((state) => ({
        errorByChatId: { ...state.errorByChatId, [chatId]: e },
      }))
    } finally {
      set((state) => ({
        loadingByChatId: { ...state.loadingByChatId, [chatId]: false },
      }))
    }
  },

  sendMessage: async (chatId, message) => {
    // lock input while AI is responding (separate flag from history loading)
    set((state) => ({
      replyingByChatId: { ...state.replyingByChatId, [chatId]: true },
      errorByChatId: { ...state.errorByChatId, [chatId]: null },
    }))
    const optimistic = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      __optimistic: true,
    }
    set((state) => ({
      messagesByChatId: {
        ...state.messagesByChatId,
        [chatId]: [...(state.messagesByChatId[chatId] || []), optimistic],
      },
    }))
    try {
      const res = await ChatsApi.sendMessage({ chatId, message })
      const aiMsg = {
        role: 'assistant',
        content: res.message,
        timestamp: new Date().toISOString(),
      }
      set((state) => ({
        messagesByChatId: {
          ...state.messagesByChatId,
          [chatId]: [
            ...(state.messagesByChatId[chatId] || []).filter((m) => !m.__optimistic),
            { role: 'user', content: message, timestamp: optimistic.timestamp },
            aiMsg,
          ],
        },
      }))
    } catch (e) {
      // rollback optimistic user message
      set((state) => ({
        messagesByChatId: {
          ...state.messagesByChatId,
          [chatId]: (state.messagesByChatId[chatId] || []).filter((m) => !m.__optimistic),
        },
        errorByChatId: { ...state.errorByChatId, [chatId]: e },
      }))
      throw e
    } finally {
      set((state) => ({
        replyingByChatId: { ...state.replyingByChatId, [chatId]: false },
      }))
    }
  },

  uploadFile: async (chatId, file) => {
    // lock input while file is processed and AI responds
    set((state) => ({
      replyingByChatId: { ...state.replyingByChatId, [chatId]: true },
      errorByChatId: { ...state.errorByChatId, [chatId]: null },
    }))
    
    // Determine file type for better user message
    const isAudio = file.type.startsWith('audio/')
    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')
    
    let userMessage = '📎 Отправка файла...'
    if (isAudio) {
      userMessage = '🎤 Обрабатываю голосовое сообщение...'
    } else if (isImage) {
      userMessage = '🖼️ Анализирую изображение...'
    } else if (isVideo) {
      userMessage = '🎬 Обрабатываю видео...'
    }
    
    
    const optimistic = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
      __optimistic: true,
    }
    set((state) => ({
      messagesByChatId: {
        ...state.messagesByChatId,
        [chatId]: [...(state.messagesByChatId[chatId] || []), optimistic],
      },
    }))
    try {
      await ChatsApi.uploadFile(chatId, file)
      
      // Refresh from server to avoid duplication and get extracted content + AI reply
      const messages = await ChatsApi.getMessages(chatId)
      
      set((state) => ({
        messagesByChatId: { ...state.messagesByChatId, [chatId]: messages },
      }))
    } catch (e) {
      console.error('❌ Upload error:', e)
      console.error('Error details:', e.response?.data || e.message)
      console.error('Error status:', e.status)
      
      // Show error to user
      const errorMsg = e.response?.data?.message || e.message || 'Неизвестная ошибка при загрузке файла'
      alert(`Ошибка загрузки: ${errorMsg}`)
      
      set((state) => ({
        messagesByChatId: {
          ...state.messagesByChatId,
          [chatId]: (state.messagesByChatId[chatId] || []).filter((m) => !m.__optimistic),
        },
        errorByChatId: { ...state.errorByChatId, [chatId]: e },
      }))
      throw e
    } finally {
      set((state) => ({
        replyingByChatId: { ...state.replyingByChatId, [chatId]: false },
      }))
    }
  },
}))


