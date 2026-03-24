import React from 'react'

interface PageHeaderProps {
    title: string
    subtitle: string
    children?: React.ReactNode
}

export default function PageHeader({ title, subtitle, children }: PageHeaderProps) {
    return (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10 relative z-40">
            <div>
                <h1 className="text-3xl font-black text-foreground tracking-tight mb-2 italic drop-shadow-sm">{title}</h1>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-1 bg-primary rounded-full"></div>
                    <p className="text-foreground/50 font-black text-[10px] uppercase tracking-[0.2em] italic">{subtitle}</p>
                </div>
            </div>
            {children && (
                <div className="flex items-center gap-3 bg-base-100 p-1.5 rounded-2xl border border-base-300 shadow-sm animate-fade-in">
                    {children}
                </div>
            )}
        </div>
    )
}
