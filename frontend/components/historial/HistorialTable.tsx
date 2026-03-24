
import React from 'react'
import { Activity, Timer, Sun, Moon, ChevronLeft, ChevronRight } from 'lucide-react'
import Card from '@/components/ui/Card'
import StatusBadge from '@/components/shared/StatusBadge'
import PracticanteAvatar from '@/components/shared/PracticanteAvatar'
import EmptyState from '@/components/shared/EmptyState'
import { AsistenciaHistorial } from '@/types'

interface HistorialTableProps {
    view: 'lista' | 'gantt'
    loading: boolean
    filteredAsistencias: AsistenciaHistorial[]
    currentPage: number
    setCurrentPage: (page: number) => void
    totalPages: number
    totalItems: number
}

const HistorialTable = ({ 
    view, 
    loading, 
    filteredAsistencias,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems
}: HistorialTableProps) => {
    if (view !== 'lista') return null

    return (
        <div className="space-y-4">
            <Card className="p-0! overflow-hidden shadow-xl border-none bg-base-100/40 rounded-3xl!">
                <div className="hidden md:block overflow-x-auto custom-scrollbar">
                    <table className="table table-sm w-full">
                        <thead className="bg-primary/10 text-primary font-black uppercase tracking-[0.2em] text-[8px]">
                            <tr>
                                <th className="py-4 pl-6 border-none">Fecha / Día</th>
                                <th className="py-4 border-none">Trabajador</th>
                                <th className="py-4 border-none">Horario / Turno</th>
                                <th className="py-4 text-right pr-6 border-none">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-base-300">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={4} className="py-6 px-6"><div className="h-3 bg-base-200 rounded-full w-full"></div></td>
                                    </tr>
                                ))
                            ) : filteredAsistencias.length > 0 ? (
                                filteredAsistencias.map((a) => (
                                    <tr key={a.id} className="hover:bg-base-200/50 transition-colors group">
                                        <td className="py-4 pl-6">
                                            <div className="font-black text-foreground tracking-widest uppercase text-[9px] mb-0.5">
                                                {new Date(a.fecha.split('T')[0] + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long' })}
                                            </div>
                                            <div className="text-foreground/40 font-bold text-[10px]">
                                                {a.fecha.split('T')[0].split('-').reverse().join('/')}
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            <div className="flex items-center gap-2">
                                                <PracticanteAvatar name={a.nombre} size="sm" />
                                                <div>
                                                    <div className="font-black text-foreground text-xs">{a.nombre}</div>
                                                    <div className="text-[8px] text-foreground/40 font-black tracking-widest">DNI: {a.dni}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-1 rounded ${a.turno === 'tarde' ? 'bg-orange-500/20 text-orange-500' : 'bg-primary/20 text-primary'}`}>
                                                    {a.turno === 'tarde' ? <Moon size={10} /> : <Sun size={10} />}
                                                </div>
                                                <div className="text-[10px] font-black text-foreground/60 uppercase tracking-widest">
                                                    {a.hora_ingreso || '--:--'}
                                                    <span className="ml-2 text-foreground/30 lowercase opacity-50">({a.turno || 'mañana'})</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 text-right pr-6">
                                            <div className="flex flex-col items-end gap-1">
                                                <StatusBadge status={a.estado} />
                                                {a.estado === 'tardanza' && a.minutos_tardanza > 0 && (
                                                    <div className="flex items-center gap-1 text-[8px] font-black text-amber-500 uppercase tracking-tighter">
                                                        <Timer size={10} />
                                                        {a.minutos_tardanza >= 60 ? `${Math.floor(a.minutos_tardanza / 60)}h ${a.minutos_tardanza % 60}m` : `${a.minutos_tardanza}m`} de demora
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4}>
                                        <EmptyState icon={Activity} message="Sin registros encontrados" />
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards View */}
                <div className="md:hidden divide-y divide-base-300">
                    {loading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="p-4 animate-pulse space-y-3">
                                <div className="h-4 bg-base-200 rounded w-1/3"></div>
                                <div className="h-3 bg-base-200 rounded w-1/2"></div>
                                <div className="h-3 bg-base-200 rounded w-1/4"></div>
                            </div>
                        ))
                    ) : filteredAsistencias.length > 0 ? (
                        filteredAsistencias.map((a) => (
                            <div key={a.id} className="p-4 space-y-3 hover:bg-base-200/50 transition-colors">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-black text-foreground tracking-widest uppercase text-[8px]">
                                            {new Date(a.fecha.split('T')[0] + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
                                        </div>
                                    </div>
                                    <StatusBadge status={a.estado} />
                                </div>
                                <div className="flex items-center gap-3">
                                    <PracticanteAvatar name={a.nombre} size="sm" />
                                    <div>
                                        <div className="font-black text-foreground text-xs">{a.nombre}</div>
                                        <div className="text-[8px] text-foreground/40 font-black tracking-widest">DNI: {a.dni}</div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-[9px] font-black text-foreground/60">
                                    <div className="flex items-center gap-2">
                                        <div className={`p-1 rounded ${a.turno === 'tarde' ? 'bg-orange-500/20 text-orange-500' : 'bg-primary/20 text-primary'}`}>
                                            {a.turno === 'tarde' ? <Moon size={8} /> : <Sun size={8} />}
                                        </div>
                                        <span>Turno {a.turno} - {a.hora_ingreso || '--:--'}</span>
                                    </div>
                                    {a.estado === 'tardanza' && a.minutos_tardanza > 0 && (
                                        <span className="text-amber-500">+{a.minutos_tardanza}m</span>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-8">
                             <EmptyState icon={Activity} message="Sin registros encontrados" />
                        </div>
                    )}
                </div>
            </Card>

            {/* Pagination Controls */}
            {!loading && totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 bg-base-100/40 backdrop-blur-md border border-base-300 rounded-3xl">
                    <div className="text-[10px] font-black text-foreground/40 uppercase tracking-widest">
                        Mostrando {filteredAsistencias.length} de {totalItems} registros
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="p-2.5 rounded-xl border border-base-300 hover:bg-base-200 disabled:opacity-30 transition-all text-foreground/40 hover:text-foreground hover:border-primary/50"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        
                        <div className="flex items-center gap-1.5">
                            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                                let pageNum = i + 1;
                                if (totalPages > 5 && currentPage > 3) {
                                    pageNum = currentPage - 2 + i;
                                    if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                                }
                                if (pageNum < 1) pageNum = i + 1;
                                if (pageNum > totalPages) return null;

                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-10 h-10 rounded-xl text-[10px] font-bold transition-all border ${currentPage === pageNum ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-base-100 border-base-300 text-foreground/50 hover:bg-base-200'}`}
                                    >
                                        {pageNum}
                                    </button>
                                )
                            })}
                        </div>

                        <button
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2.5 rounded-xl border border-base-300 hover:bg-base-200 disabled:opacity-30 transition-all text-foreground/40 hover:text-foreground hover:border-primary/50"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default HistorialTable
