import React from 'react'

interface AvatarProps {
    name: string
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

// Alias para compatibilidad
export type PracticanteAvatarProps = AvatarProps
export type TrabajadorAvatarProps = AvatarProps

export default function PracticanteAvatar({ name, size = 'md', className = '' }: AvatarProps) {
    const initial = name ? name.charAt(0).toUpperCase() : '?'

    // Size mapping
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

// Alias para compatibilidad con nuevo nombre
export const TrabajadorAvatar = PracticanteAvatar
