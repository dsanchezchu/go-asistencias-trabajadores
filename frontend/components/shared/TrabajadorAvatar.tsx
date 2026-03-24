import React from 'react'

interface TrabajadorAvatarProps {
    name: string
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

export default function TrabajadorAvatar({ name, size = 'md', className = '' }: TrabajadorAvatarProps) {
    const initial = name ? name.charAt(0).toUpperCase() : '?'

    const sizeClasses = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-lg'
    }

    return (
        <div className={`${sizeClasses[size]} rounded-xl bg-linear-to-br from-primary/20 to-accent/20 flex items-center justify-center font-black text-primary border border-white/5 shadow-inner shrink-0 ${className}`}>
            {initial}
        </div>
    )
}

// Alias para compatibilidad
export const PracticanteAvatar = TrabajadorAvatar
