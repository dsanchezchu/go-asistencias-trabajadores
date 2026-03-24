import React from 'react'
import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
    icon: LucideIcon
    title?: string
    message: string
}

export default function EmptyState({ icon: Icon, title = "Sin resultados", message }: EmptyStateProps) {
    return (
        <div className="py-20 text-center flex flex-col items-center">
            <Icon className="text-foreground/20 mb-4 transition-colors" size={48} />
            {title && <h3 className="text-sm font-black text-foreground/40 uppercase tracking-widest mb-1">{title}</h3>}
            <p className="text-[10px] text-foreground/30 font-bold uppercase tracking-widest">{message}</p>
        </div>
    )
}
