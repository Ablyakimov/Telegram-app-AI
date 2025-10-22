import '@testing-library/jest-dom'

// Mock Telegram WebApp
global.window.Telegram = {
  WebApp: {
    initData: 'dev-fallback',
    initDataUnsafe: {
      user: {
        id: 1,
        first_name: 'Test User',
        username: 'testuser'
      }
    },
    ready: jest.fn(),
    expand: jest.fn(),
    colorScheme: 'light',
    onEvent: jest.fn()
  }
}
