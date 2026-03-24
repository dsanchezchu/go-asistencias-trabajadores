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
  const [isLoading, setIsLoading] = useState(false)

  const refreshDemoStatus = useCallback(async () => {
    setIsLoading(true)
    try {
      const status = await demoService.getStatus()
      setDemoStatus(status)
    } catch (error) {
      console.error('Error fetching demo status:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshDemoStatus()
  }, [refreshDemoStatus])

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