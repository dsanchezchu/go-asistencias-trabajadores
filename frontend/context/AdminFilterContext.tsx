'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { apiClient } from '@/services/apiClient'

interface DemoUser {
  id: number
  username: string
  demo_trabajadores_creados: number
  demo_asistencias_creadas: number
  demo_backups_creados: number
}

interface AdminFilterContextType {
  selectedDemoUser: DemoUser | null
  demoUsers: DemoUser[]
  setSelectedDemoUser: (user: DemoUser | null) => void
  fetchDemoUsers: () => Promise<void>
  isLoading: boolean
}

const AdminFilterContext = createContext<AdminFilterContextType | null>(null)

export function AdminFilterProvider({ children }: { children: ReactNode }) {
  const [selectedDemoUser, setSelectedDemoUser] = useState<DemoUser | null>(null)
  const [demoUsers, setDemoUsers] = useState<DemoUser[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchDemoUsers = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await apiClient.get<any>('/api/admin/demo-users', { limit: '100' })
      const users = response.users || []
      setDemoUsers(users)
      
      // Update selected user info in case it changed (reset, etc)
      // Use functional update to avoid adding selectedDemoUser as a dependency
      setSelectedDemoUser(current => {
        if (!current) return null
        const updated = users.find((u: any) => u.id === current.id)
        return updated || current
      })
    } catch (error) {
      console.error('Error fetching demo users:', error)
    } finally {
      setIsLoading(false)
    }
  }, []) // Remove dependency to prevent infinite fetch loop

  useEffect(() => {
    fetchDemoUsers()
  }, [fetchDemoUsers])

  return (
    <AdminFilterContext.Provider value={{
      selectedDemoUser,
      demoUsers,
      setSelectedDemoUser,
      fetchDemoUsers,
      isLoading
    }}>
      {children}
    </AdminFilterContext.Provider>
  )
}

export const useAdminFilter = () => {
  const context = useContext(AdminFilterContext)
  if (!context) {
    throw new Error('useAdminFilter must be used within AdminFilterProvider')
  }
  return context
}