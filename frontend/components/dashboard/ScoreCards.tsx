import { Users, Clock, Database } from 'lucide-react'
import StatCard from '@/components/ui/StatCard'
import { Trabajador } from '@/types'

export default function ScoreCards({ trabajadores }: { trabajadores: Trabajador[] }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard label="Trabajadores" value={trabajadores.length} icon={Users} color="primary" href="/trabajadores" description="Total registrados" />
            <StatCard label="Horas Logradas" value={`${trabajadores.reduce((acc, t) => acc + (t.horas_reales || 0), 0).toFixed(1)}h`} icon={Clock} color="secondary" href="/historial" description="Progreso acumulado" />
            <StatCard label="Estado Base" value="MySQL" icon={Database} color="accent" description="DATABASE ONLINE" />
        </div>
    )
}
