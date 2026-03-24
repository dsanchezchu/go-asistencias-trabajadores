'use client'

import React, { useEffect, useState, useMemo } from 'react'
import Sidebar from '@/components/sidebar/Sidebar'
import { DemoProvider, useDemoContext } from '@/context/DemoContext'
import { AdminFilterProvider } from '@/context/AdminFilterContext'
import { useRouter } from 'next/navigation'

function LayoutContent({ children }: { children: React.ReactNode }) {
    const { demoStatus } = useDemoContext()
    const isAdmin = demoStatus?.role === 'admin'

    const content = (
        <div className="flex h-screen bg-background text-foreground transition-colors duration-300 overflow-hidden text-sm">
            <Sidebar />
            <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
                    <div className="animate-fade-in-up">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    )

    // Solo envolver en AdminFilterProvider si es admin
    return isAdmin ? (
        <AdminFilterProvider>
            {content}
        </AdminFilterProvider>
    ) : content
}

export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
        if (!token) {
            router.push('/')
        } else {
            setIsLoading(false)
        }
    }, [router])

    const loadingScreen = useMemo(() => (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-lg"></div>
            <p className="text-foreground/50 font-black text-[10px] uppercase tracking-widest animate-pulse">Iniciando sistema...</p>
        </div>
    ), [])

    if (isLoading) {
        return loadingScreen
    }

    return (
        <DemoProvider>
            <LayoutContent>
                {children}
            </LayoutContent>
        </DemoProvider>
    )
}