import { create } from 'zustand'
import { ChatsApi } from '@shared/api/chats'

export const useChatsStore = create((set, get) => ({
  chats: [],
  isLoading: false,
  error: null,

  fetchByUser: async (userId) => {
    set({ isLoading: true, error: null })
    try {
      const chats = await ChatsApi.getByUser(userId)
      set({ chats })
    } catch (e) {
      set({ error: e })
    } finally {
      set({ isLoading: false })
    }
  },

  createChat: async ({ name, userId }) => {
    const optimisticChat = {
      id: Date.now(),
      name,
      userId,
      messages: [],
      __optimistic: true,
    }
    set({ chats: [optimisticChat, ...get().chats] })
    try {
      const created = await ChatsApi.create({ name, userId })
      set({
        chats: get().chats.map((c) => (c.__optimistic ? created : c)),
      })
      return created
    } catch (e) {
      set({ chats: get().chats.filter((c) => !c.__optimistic) })
      throw e
    }
  },

  updateChatName: async (chatId, newName) => {
    const originalChats = get().chats
    // Optimistic update
    set({
      chats: get().chats.map((c) => (c.id === chatId ? { ...c, name: newName } : c)),
    })
    try {
      await ChatsApi.updateName(chatId, newName)
    } catch (e) {
      // Rollback on error
      set({ chats: originalChats })
      throw e
    }
  },

  deleteChat: async (chatId) => {
    const originalChats = get().chats
    // Optimistic delete
    set({
      chats: get().chats.filter((c) => c.id !== chatId),
    })
    try {
      await ChatsApi.deleteChat(chatId)
    } catch (e) {
      // Rollback on error
      set({ chats: originalChats })
      throw e
    }
  },
}))
