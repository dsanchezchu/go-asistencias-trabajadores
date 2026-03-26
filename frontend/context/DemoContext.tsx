'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { demoService } from '@/services/demoService'
import { DemoStatus } from '@/types'

interface DemoContextType {
  demoStatus: DemoStatus | null
  refreshDemoStatus: () => Promise<void>
  isLoading: boolean
}

const DemoContext = createContext<DemoContextType | null>(null)

export function DemoProvider({ children }: { children: ReactNode }) {
  const [demoStatus, setDemoStatus] = useState<DemoStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isFirstLoad, setIsFirstLoad] = useState(true)

  const refreshDemoStatus = useCallback(async () => {
    // Si no es la primera carga, no mostramos el estado de carga global para evitar parpadeos
    if (!isFirstLoad) setIsLoading(true)
    
    try {
      const status = await demoService.getStatus()
      setDemoStatus(status)
    } catch (error) {
      console.error('Error fetching demo status:', error)
    } finally {
      setIsLoading(false)
      setIsFirstLoad(false)
    }
  }, [isFirstLoad])

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (token) {
      refreshDemoStatus()
    } else {
      setIsLoading(false)
      setIsFirstLoad(false)
    }
  }, []) // Solo al montar

  return (
    <DemoContext.Provider value={{ demoStatus, refreshDemoStatus, isLoading }}>
      {children}
    </DemoContext.Provider>
  )
}

export const useDemoContext = () => {
  const context = useContext(DemoContext)
  if (!context) {
    throw new Error('useDemoContext must be used within DemoProvider')
  }
  return context
}