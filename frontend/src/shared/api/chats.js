import { get, post } from './http'

export const ChatsApi = {
  getByUser(userId) {
    return get(`/chats/${userId}`)
  },
  create({ name, userId }) {
    return post('/chats', { name, userId })
  },
  getMessages(chatId) {
    return get(`/chats/${chatId}/messages`)
  },
  sendMessage({ chatId, message }) {
    // Backend expects POST /api/chats/messages
    return post('/chats/messages', { chatId, message })
  },
}


