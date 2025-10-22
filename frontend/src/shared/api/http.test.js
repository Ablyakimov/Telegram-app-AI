import { describe, it, expect, vi, beforeEach } from 'vitest'
import { http } from './http'

// Mock axios
vi.mock('axios', () => ({
  create: vi.fn(() => ({
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() }
    },
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }))
}))

describe('HTTP Client', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
  })

  it('should be defined', () => {
    expect(http).toBeDefined()
  })

  it('should have interceptors configured', () => {
    expect(http.interceptors.request.use).toHaveBeenCalled()
    expect(http.interceptors.response.use).toHaveBeenCalled()
  })
})
