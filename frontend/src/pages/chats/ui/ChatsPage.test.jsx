import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ChatsPage from './ChatsPage'

// Mock the stores
vi.mock('@entities/user/model/userStore', () => ({
  useUserStore: () => ({
    user: { id: 1, username: 'testuser', firstName: 'Test User' },
    setUser: vi.fn()
  })
}))

vi.mock('@entities/chat/model/chatsStore', () => ({
  useChatsStore: () => ({
    chats: [
      { id: 1, name: 'Test Chat 1', userId: 1, messages: [] },
      { id: 2, name: 'Test Chat 2', userId: 1, messages: [] }
    ],
    fetchByUser: vi.fn(),
    createChat: vi.fn()
  })
}))

describe('ChatsPage', () => {
  it('renders chat list when no chat is selected', () => {
    render(<ChatsPage />)
    
    expect(screen.getByText('Test Chat 1')).toBeInTheDocument()
    expect(screen.getByText('Test Chat 2')).toBeInTheDocument()
  })

  it('renders new chat button', () => {
    render(<ChatsPage />)
    
    const newChatButton = screen.getByRole('button', { name: /new chat/i })
    expect(newChatButton).toBeInTheDocument()
  })
})
