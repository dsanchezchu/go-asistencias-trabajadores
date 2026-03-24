import { CalendarCheck2, History, Database } from 'lucide-react'
import Button from '@/components/ui/Button'
import { useRouter } from 'next/navigation'

export default function QuickActions() {
    const router = useRouter()
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Button onClick={() => router.push('/asistencias')} variant="primary" className="h-12 text-xs font-black uppercase tracking-widest" icon={<CalendarCheck2 size={18} />}>MARCAR ASISTENCIA</Button>
            <Button onClick={() => router.push('/historial')} variant="ghost" className="h-12 text-xs font-black uppercase tracking-widest bg-base-200/50 border-base-300" icon={<History size={18} />}>HISTORIAL</Button>
            <Button onClick={() => router.push('/backups')} variant="ghost" className="h-12 text-xs font-black uppercase tracking-widest bg-base-200/50 border-base-300" icon={<Database size={18} className="text-accent" />}>BACKUP</Button>
        </div>
    )
}
