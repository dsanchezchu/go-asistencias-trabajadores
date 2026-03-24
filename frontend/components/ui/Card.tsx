import React from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
    children: React.ReactNode
    className?: string
    variant?: 'glass' | 'solid'
    hover?: boolean
}

const Card = ({ children, className = '', hover = false }: CardProps) => {
    return (
        <div className={cn(
            'bg-base-100 border border-base-300 rounded-2xl shadow-sm transition-all duration-300',
            hover && 'hover:shadow-md hover:border-primary/20',
            className
        )}>
            {children}
        </div>
    )
}


export default Card
