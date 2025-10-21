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
  uploadFile(chatId, file) {
    const formData = new FormData()
    formData.append('file', file)
    // Don't set Content-Type header - axios will set it automatically with boundary
    return post(`/chats/${chatId}/upload`, formData)
  },
}


