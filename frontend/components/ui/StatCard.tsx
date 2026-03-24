import React from 'react'
import Link from 'next/link'
import { LucideIcon } from 'lucide-react'

import Card from '@/components/ui/Card'

interface StatCardProps {
    label: string
    value: string | number
    icon: LucideIcon
    color: string
    href?: string
    description?: string
}

const StatCard = ({ label, value, icon: Icon, color, href, description }: StatCardProps) => {
    const colorMap: { [key: string]: { text: string, bg: string, border: string } } = {
        primary: { text: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
        secondary: { text: 'text-secondary', bg: 'bg-secondary/10', border: 'border-secondary/20' },
        accent: { text: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/20' },
        success: { text: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
        warning: { text: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
        error: { text: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    }

    const classes = colorMap[color] || colorMap.primary

    const Content = (
        <Card className="group transition-all duration-300 hover:scale-[1.02] border-none bg-base-100 p-6 shadow-sm ring-1 ring-base-300">
            <div className="flex flex-col gap-5">
                <div className={`w-fit p-4 rounded-2xl group-hover:rotate-6 transition-transform border ${classes.bg} ${classes.border}`}>
                    <Icon className={classes.text} size={32} />
                </div>
                <div className="flex flex-col gap-0.5">
                    <p className={`${classes.text} text-[10px] font-black uppercase tracking-[0.25em]`}>{label}</p>
                    <h3 className="text-3xl font-black text-foreground leading-tight tracking-tight">{value}</h3>
                    {description && <p className="text-[10px] text-foreground/50 font-bold mt-1 tracking-wide uppercase">{description}</p>}
                </div>
            </div>
        </Card>
    )

    if (href) {
        return (
            <Link href={href} className="block hover:scale-[1.02] transition-transform">
                {Content}
            </Link>
        )
    }

    return Content
}

export default StatCard
