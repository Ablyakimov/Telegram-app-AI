import { get } from './http'

export const ModelsApi = {
  list() {
    return get('/ai/models')
  },
}
