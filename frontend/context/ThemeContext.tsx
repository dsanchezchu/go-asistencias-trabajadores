'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import Cookies from 'js-cookie'
import { API_URL } from '@/config'

type Theme = 'light' | 'dark'

interface ThemeContextType {
    theme: Theme
    setTheme: (theme: Theme) => void
    toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider = ({ children, initialTheme }: { children: ReactNode, initialTheme?: Theme }) => {
    // Priority: initialTheme (from SSR cookie) > localStorage > 'dark'
    const [theme, setThemeState] = useState<Theme>(initialTheme || 'dark')
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        const savedTheme = Cookies.get('theme') as Theme || localStorage.getItem('theme') as Theme
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
            setThemeState(savedTheme)
        }
        setMounted(true)
    }, [])

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme)
        Cookies.set('theme', newTheme, { expires: 365, path: '/' })
        localStorage.setItem('theme', newTheme)
        document.documentElement.setAttribute('data-theme', newTheme)
        
        // Asynchronous sync with server (Optimistic UI)
        syncThemeWithServer(newTheme)
    }

    const syncThemeWithServer = async (newTheme: Theme) => {
        const token = localStorage.getItem('token')
        if (!token) return

        try {
            const controller = new AbortController()
            const id = setTimeout(() => controller.abort(), 2000) // 2s timeout for background sync

            await fetch(`${API_URL}/api/user/settings`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ theme: newTheme }),
                signal: controller.signal
            })
            clearTimeout(id)
        } catch (error) {
            // Silently fail as this is a background optimistic sync
            console.warn('Theme sync failed (Backend might be down):', error)
        }
    }

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light')
    }

    // Effect to apply theme to document
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
        if (theme === 'dark') {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }, [theme])

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export const useTheme = () => {
    const context = useContext(ThemeContext)
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider')
    }
    return context
}
