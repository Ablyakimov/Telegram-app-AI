import { create } from 'zustand'
import { ModelsApi } from '@shared/api/models'

export const useModelsStore = create((set) => ({
  models: [],
  isLoading: false,
  error: null,

  fetch: async () => {
    set({ isLoading: true, error: null })
    try {
      const models = await ModelsApi.list()
      set({ models })
    } catch (e) {
      set({ error: e })
    } finally {
      set({ isLoading: false })
    }
  },
}))
