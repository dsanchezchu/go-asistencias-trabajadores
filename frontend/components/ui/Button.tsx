import React from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'accent' | 'error'
    children?: React.ReactNode
    className?: string
    textClassName?: string
    icon?: React.ReactNode
}

const Button = ({ variant = 'primary', children, className = '', textClassName = '', icon, ...props }: ButtonProps) => {
    const variants = {
        primary: 'bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90 hover:scale-[1.02] border-none',
        secondary: 'bg-secondary text-white shadow-lg shadow-secondary/20 hover:bg-secondary/90',
        accent: 'bg-accent text-white shadow-lg shadow-accent/20 hover:bg-accent/90',
        ghost: 'bg-base-200 text-foreground/60 hover:text-foreground hover:bg-base-300 border border-base-300 shadow-sm',
        error: 'bg-red-500/10 text-red-600 hover:bg-red-600 hover:text-white border border-red-500/20 shadow-sm'
    }

    return (
        <button
            className={cn(
                'flex items-center justify-center px-6 py-2.5 rounded-xl font-black transition-all duration-300 active:scale-95 disabled:opacity-50',
                variants[variant],
                className
            )}
            {...props}
        >
            {icon && <span className="shrink-0 transition-transform group-hover:scale-110">{icon}</span>}
            {children ? <span className={cn('truncate', icon && 'ml-2', textClassName)}>{children}</span> : null}
        </button>
    )
}


export default Button
