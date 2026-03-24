import React from 'react'

interface StatusBadgeProps {
    status: string
    label?: string
    className?: string
}

const config: Record<string, { color: string; label: string }> = {
    presente: { color: 'bg-green-500/10 text-green-500 border-green-500/20', label: 'Presente' },
    ausente: { color: 'bg-red-500/10 text-red-500 border-red-500/20', label: 'Ausente' },
    tardanza: { color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', label: 'Tardanza' },
    justificado: { color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', label: 'Justificado' },
}

export default function StatusBadge({ status, label, className = '' }: StatusBadgeProps) {
    const normalizedStatus = status?.toLowerCase() || ''
    const s = config[normalizedStatus] || {
        color: 'bg-foreground/5 text-foreground/40 border-foreground/10',
        label: label || status || 'N/A'
    }

    return (
        <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border flex items-center justify-center ${s.color} ${className}`}>
            {label || s.label}
        </span>
    )
}
