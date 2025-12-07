import { useState, useEffect } from 'react'
import ChatsPage from '@pages/chats/ui/ChatsPage'
import AdminPage from '@pages/admin/ui/AdminPage'
import { useUserStore } from '@entities/user/model/userStore'

export default function App() {
  const { role, fetchUser, isAdmin } = useUserStore()
  const [currentPage, setCurrentPage] = useState('chats')

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  useEffect(() => {
    if (role === 'admin' && currentPage === 'admin') {
      setCurrentPage('admin')
    }
  }, [role, currentPage])

  if (currentPage === 'admin' && isAdmin()) {
    return <AdminPage onBack={() => setCurrentPage('chats')} />
  }

  return <ChatsPage onNavigateToAdmin={() => isAdmin() && setCurrentPage('admin')} />
}


