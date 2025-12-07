import { get } from './http'

export const UsersApi = {
  getCurrentUser: () => get('/users/me'),
}

