import { create } from 'zustand'
import { UsersApi } from '@shared/api/users'

export const useUserStore = create((set) => ({
  user: null,
  role: null,
  setUser: (user) => set({ user }),
  setRole: (role) => set({ role }),
  fetchUser: async () => {
    try {
      const userData = await UsersApi.getCurrentUser()
      if (userData) {
        set({ user: userData, role: userData.role })
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
    }
  },
  isAdmin: () => {
    const state = useUserStore.getState()
    return state.role === 'admin'
  },
}))


