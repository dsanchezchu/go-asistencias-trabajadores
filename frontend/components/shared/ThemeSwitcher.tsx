'use client'

import React from 'react'
import { useTheme } from '@/context/ThemeContext'
import { Sun, Moon, Eye } from 'lucide-react'

export const ThemeSwitcher = () => {
    const { theme, toggleTheme } = useTheme()

    const getIcon = () => {
        switch (theme) {
            case 'light': return <Sun size={18} />
            case 'dark': return <Moon size={18} />
        }
    }

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-base-200 border border-foreground/[0.04] text-foreground/60 hover:text-primary hover:bg-base-300 transition-all flex items-center justify-center"
            title={`Cambiar tema (Actual: ${theme})`}
        >
            {getIcon()}
        </button>
    )
}
