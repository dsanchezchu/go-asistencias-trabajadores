'use client'

import React, { useState, useMemo } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

interface Asistencia {
    fecha: string
    estado: string // "presente", "ausente", "justificado", "tardanza"
}

interface Trabajador {
    id: number
    nombre: string
    asistencias: Asistencia[]
}

interface GanttChartProps {
    data: any[]
}

const GanttChart = ({ data }: GanttChartProps) => {
    const [refDate, setRefDate] = useState(new Date())
    const [viewMode, setViewMode] = useState<'dia' | 'semana' | 'mes'>('semana')

    const days = useMemo(() => {
        const result = []
        const start = new Date(refDate)

        if (viewMode === 'dia') {
             for (let i = -7; i <= 7; i++) {
                const d = new Date(refDate)
                d.setDate(refDate.getDate() + i)
                result.push(d.toISOString().split('T')[0])
            }
        } else if (viewMode === 'semana') {
            const day = start.getDay() 
            const diff = start.getDate() - day + (day === 0 ? -6 : 1)
            start.setDate(diff)
            for (let i = 0; i < 7; i++) {
                const d = new Date(start)
                d.setDate(start.getDate() + i)
                result.push(d.toISOString().split('T')[0])
            }
        } else {
            start.setDate(1)
            const lastDay = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate()
            for (let i = 0; i < lastDay; i++) {
                const d = new Date(start)
                d.setDate(start.getDate() + i)
                result.push(d.toISOString().split('T')[0])
            }
        }
        return result
    }, [refDate, viewMode])

    const nextRange = () => {
        const d = new Date(refDate)
        if (viewMode === 'dia') d.setDate(d.getDate() + 1)
        else if (viewMode === 'semana') d.setDate(d.getDate() + 7)
        else d.setMonth(d.getMonth() + 1)
        setRefDate(d)
    }

    const prevRange = () => {
        const d = new Date(refDate)
        if (viewMode === 'dia') d.setDate(d.getDate() - 1)
        else if (viewMode === 'semana') d.setDate(d.getDate() - 7)
        else d.setMonth(d.getMonth() - 1)
        setRefDate(d)
    }

    const getStatusColor = (estado?: string) => {
        switch (estado) {
            case 'presente': return 'bg-emerald-500/20 border-emerald-500/30 text-emerald-500 shadow-[inset_0_0_12px_rgba(16,185,129,0.1)]'
            case 'ausente': return 'bg-rose-500/20 border-rose-500/30 text-rose-500 shadow-[inset_0_0_12px_rgba(244,63,94,0.1)]'
            case 'tardanza': return 'bg-amber-500/20 border-amber-500/30 text-amber-500 shadow-[inset_0_0_12px_rgba(245,158,11,0.1)]'
            case 'justificado': return 'bg-sky-500/20 border-sky-500/30 text-sky-500 shadow-[inset_0_0_12px_rgba(14,165,233,0.1)]'
            default: return 'bg-base-300/10 border-base-300/20'
        }
    }

    const gridStyle = {
        display: 'grid',
        gridTemplateColumns: `200px repeat(${days.length}, ${viewMode === 'mes' ? '60px' : '1fr'})`,
    }

    return (
        <div id="gantt-chart" className="glass-card rounded-3xl border border-white/10 overflow-hidden shadow-2xl bg-base-100/40 backdrop-blur-xl">
            {/* Header Controls */}
            <div className="p-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 bg-linear-to-b from-white/5 to-transparent">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                        <Calendar className="text-primary" size={20} />
                    </div>
                    <div>
                        <h3 className="font-black text-sm uppercase tracking-widest text-foreground italic">Cronograma Maestro</h3>
                        <p className="text-[10px] text-foreground/40 font-bold uppercase tracking-tighter">Monitoreo de Asistencia en Tiempo Real</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex p-1 bg-base-300/30 backdrop-blur-md border border-white/5 rounded-2xl">
                        {(['dia', 'semana', 'mes'] as const).map(m => (
                            <button
                                key={m}
                                onClick={() => setViewMode(m)}
                                className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${viewMode === m ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-white/5 text-foreground/40 hover:text-foreground'}`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 bg-base-300/30 backdrop-blur-md border border-white/5 rounded-2xl p-1">
                        <button onClick={prevRange} className="p-1.5 hover:bg-white/10 rounded-xl text-foreground/40 hover:text-foreground transition-all"><ChevronLeft size={16} /></button>
                        <button 
                            onClick={() => setRefDate(new Date())} 
                            className="px-3 py-1 bg-base-100/50 rounded-lg text-[10px] font-black uppercase text-foreground/60 hover:text-primary transition-all hover:bg-white/10 border border-white/5"
                        >
                            Hoy
                        </button>
                        <button onClick={nextRange} className="p-1.5 hover:bg-white/10 rounded-xl text-foreground/40 hover:text-foreground transition-all"><ChevronRight size={16} /></button>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar bg-base-100/20 backdrop-blur-sm">
                <div className={viewMode === 'mes' ? 'min-w-[2100px]' : 'min-w-[1000px]'}>
                    {/* Grid Header */}
                    <div style={gridStyle} className="border-b border-white/5 bg-base-200/20 sticky top-0 z-10 backdrop-blur-md">
                        <div className="p-4 text-[10px] font-black text-foreground/30 uppercase tracking-widest border-r border-white/5 italic flex items-center">Personal</div>
                        {days.map(day => {
                            const d = new Date(day + 'T00:00:00')
                            const isToday = d.toDateString() === new Date().toDateString()
                            const isWeekend = d.getDay() === 0 || d.getDay() === 6
                            return (
                                <div key={day} className={`p-2.5 text-center border-r last:border-0 border-white/5 flex flex-col items-center justify-center transition-colors ${isToday ? 'bg-primary/10' : ''} ${isWeekend ? 'bg-base-300/5' : ''}`}>
                                    <span className="text-[9px] font-black text-foreground/30 uppercase leading-none">{d.toLocaleDateString('es-ES', { weekday: 'short' }).substring(0, 1)}</span>
                                    <div className={`mt-1.5 flex flex-col items-center`}>
                                        <span className={`text-[11px] font-black ${isToday ? 'text-primary' : 'text-foreground/70'}`}>{d.getDate()}</span>
                                        {isToday && <div className="w-1 h-1 rounded-full bg-primary mt-0.5"></div>}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Grid Body */}
                    <div className="divide-y divide-white/5">
                        {data.map((p: any) => (
                            <div key={p.id} style={gridStyle} className="hover:bg-primary/5 transition-all group">
                                <div className="p-4 border-r border-white/5 flex flex-col justify-center overflow-hidden bg-base-200/10 group-hover:bg-transparent transition-colors">
                                    <span className="text-xs font-black text-foreground truncate group-hover:text-primary transition-colors">{p.nombre}</span>
                                    <span className="text-[9px] text-foreground/30 font-bold uppercase tracking-tighter">ID: {p.dni}</span>
                                </div>
                                {days.map(day => {
                                    const asis = p.asistencias?.find((a: any) => a && a.fecha && a.fecha.split('T')[0] === day)
                                    const statusClass = getStatusColor(asis?.estado)
                                    const isToday = new Date(day + 'T00:00:00').toDateString() === new Date().toDateString()
                                    return (
                                        <div key={day} className={`p-2 flex items-center justify-center border-r last:border-0 border-white/5 relative group/cell ${isToday ? 'bg-primary/5' : ''}`}>
                                            <div 
                                                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 border ${statusClass} ${!asis && 'opacity-30 grayscale hover:opacity-100 hover:scale-110 hover:grayscale-0'} group-hover:shadow-lg`}
                                                title={asis ? `${p.nombre}: ${asis.estado} (${day})` : ''}
                                            >
                                                {asis && <div className="w-1.5 h-1.5 rounded-full bg-current/60 animate-pulse"></div>}
                                            </div>
                                            {isToday && <div className="absolute inset-y-0 w-px bg-primary/20 pointer-events-none"></div>}
                                        </div>
                                    )
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Premium Legend */}
            <div className="p-6 bg-linear-to-t from-white/5 to-transparent border-t border-white/5 flex flex-wrap justify-center gap-8">
                {[
                    { key: 'presente', label: 'Asistió', color: 'bg-success' },
                    { key: 'tardanza', label: 'Tardanza', color: 'bg-warning' },
                    { key: 'justificado', label: 'Permiso', color: 'bg-info' },
                    { key: 'ausente', label: 'Faltó', color: 'bg-error' }
                ].map(s => (
                    <div key={s.key} className="flex items-center gap-3 group cursor-help">
                        <div className={`w-3 h-3 rounded-full ${s.color} shadow-lg shadow-${s.key}/40 transition-transform group-hover:scale-125`}></div>
                        <span className="text-[10px] font-black uppercase text-foreground/40 tracking-widest group-hover:text-foreground transition-colors">
                            {s.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}


export default GanttChart
