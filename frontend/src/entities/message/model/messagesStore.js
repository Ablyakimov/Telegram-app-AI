import { create } from 'zustand'
import { ChatsApi } from '@shared/api/chats'

export const useMessagesStore = create((set, get) => ({
  messagesByChatId: {},
  loadingByChatId: {},
  errorByChatId: {},

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
    }
  },

  uploadFile: async (chatId, file) => {
    const optimistic = {
      role: 'user',
      content: `[Uploading file: ${file.name}]`,
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
      set((state) => ({
        messagesByChatId: {
          ...state.messagesByChatId,
          [chatId]: (state.messagesByChatId[chatId] || []).filter((m) => !m.__optimistic),
        },
        errorByChatId: { ...state.errorByChatId, [chatId]: e },
      }))
      throw e
    }
  },
}))


