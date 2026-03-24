import { BarChart3 } from 'lucide-react'
import { Bar } from 'react-chartjs-2'
import Card from '@/components/ui/Card'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import { useMemo } from 'react'
import { Trabajador, Asistencia } from '@/types'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface TrabajadorWithAsistencias extends Trabajador {
    asistencias?: Asistencia[]
}

interface PerformanceChartProps {
    selectedTrabajador?: TrabajadorWithAsistencias
    selectedPracticante?: TrabajadorWithAsistencias // Alias para compatibilidad
}

export default function PerformanceChart({ selectedTrabajador, selectedPracticante }: PerformanceChartProps) {
    // Usar selectedTrabajador o selectedPracticante para compatibilidad
    const selected = selectedTrabajador || selectedPracticante

    const statusData = useMemo(() => {
        if (!selected || !selected.asistencias) return { labels: [], datasets: [] }
        const counts = { presente: 0, tardanza: 0, justificado: 0, ausente: 0 }
        selected.asistencias.forEach((a) => { if (counts[a.estado as keyof typeof counts] !== undefined) counts[a.estado as keyof typeof counts]++ })
        return {
            labels: ['Presente', 'Tardanza', 'Justificado', 'Ausente'],
            datasets: [{
                label: 'Registros',
                data: [counts.presente, counts.tardanza, counts.justificado, counts.ausente],
                backgroundColor: ['rgba(34, 197, 94, 0.6)', 'rgba(245, 158, 11, 0.6)', 'rgba(59, 130, 246, 0.6)', 'rgba(239, 68, 68, 0.6)'],
                borderColor: ['#22c55e', '#f59e0b', '#3b82f6', '#ef4444'],
                borderWidth: 2, borderRadius: 8, barThickness: 32,
            }]
        }
    }, [selected])

    return (
        <Card className="h-full border-none bg-base-100/80 backdrop-blur-2xl p-6!">
            <div className="flex items-center justify-between mb-6"><div><h3 className="font-black text-[11px] text-foreground uppercase tracking-widest mb-1">Análisis de Desempeño</h3><p className="text-[9px] text-primary font-black uppercase tracking-widest leading-none truncate max-w-[150px]">{selected ? selected.nombre : 'General'}</p></div><div className="p-2 rounded-xl bg-accent/20 border border-accent/20"><BarChart3 className="text-accent" size={16} /></div></div>
            <div className="p-3 bg-base-200/50 rounded-2xl mb-4 min-h-[200px]"><Bar data={statusData} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 9, weight: 'bold' } } }, y: { beginAtZero: true, grid: { color: 'rgba(148, 163, 184, 0.1)' }, ticks: { color: '#94a3b8', font: { size: 9 }, stepSize: 1 } } } }} /></div>
            {selected && (<div className="grid grid-cols-2 gap-2"><div className="flex flex-col bg-base-200/50 p-3 rounded-xl border border-base-300"><span className="text-foreground/40 font-black text-[8px] uppercase tracking-widest mb-1">Restantes</span><span className="text-foreground font-black text-sm italic">{(Math.max(0, selected.total_horas_requeridas - (selected.horas_reales || 0))).toFixed(1)}H</span></div><div className="flex flex-col bg-primary/10 p-3 rounded-xl border border-primary/10"><span className="text-primary font-black text-[8px] uppercase tracking-widest mb-1">Logrado</span><span className="text-primary font-black text-sm italic">{(selected.horas_reales || 0).toFixed(1)}H</span></div></div>)}
        </Card>
    )
}
