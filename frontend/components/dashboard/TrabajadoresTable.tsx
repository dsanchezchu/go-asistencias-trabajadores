import Card from '@/components/ui/Card'
import StatusBadge from '@/components/shared/StatusBadge'
import { Trabajador } from '@/types'

interface Props { trabajadores: Trabajador[], loading: boolean, selectedId: number | null, onSelect: (id: number) => void }

export default function TrabajadoresTable({ trabajadores, loading, selectedId, onSelect }: Props) {
    return (
        <Card className="p-0! overflow-hidden shadow-xl border-none h-full flex flex-col">
            <div className="p-4 border-b border-base-300 flex justify-between items-center bg-base-200/30 shrink-0">
                <h3 className="font-black text-[10px] text-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                    <div className="w-1 h-3 bg-primary rounded-full"></div> Nómina de Trabajadores
                </h3>
            </div>
            <div className="overflow-auto flex-1 custom-scrollbar">
                {/* Desktop View: Table */}
                <table className="hidden md:table table-sm w-full border-separate border-spacing-0">
                    <thead>
                        <tr className="text-foreground/40 border-base-300 uppercase text-[8px] font-black tracking-[0.2em]">
                            <th className="bg-transparent pl-6 py-3">Nombre</th>
                            <th className="bg-transparent py-3 text-center">Meta</th>
                            <th className="bg-transparent py-3">Progreso</th>
                            <th className="bg-transparent py-3 text-right pr-6">Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="text-center py-10 animate-pulse text-foreground/40 font-black tracking-widest text-[10px] uppercase">Sincronizando...</td>
                            </tr>
                        ) : trabajadores.map(t => (
                            <tr
                                key={t.id}
                                onClick={() => onSelect(t.id)}
                                className={`cursor-pointer transition-all duration-200 group border-b border-base-300/50 ${selectedId === t.id ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-base-200/50 border-l-2 border-l-transparent'}`}
                            >
                                <td className="pl-6 py-3">
                                    <div className={`font-black tracking-tight text-xs ${selectedId === t.id ? 'text-primary' : 'text-foreground'}`}>{t.nombre}</div>
                                    <div className="text-foreground/40 text-[8px] font-black tracking-widest uppercase truncate max-w-[150px]">DNI: {t.dni}</div>
                                </td>
                                <td className="py-3 font-black text-foreground/60 text-[10px] text-center">{t.total_horas_requeridas.toFixed(1)}H</td>
                                <td className="py-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-20 h-1 bg-base-300 rounded-full overflow-hidden">
                                            <div className="h-full bg-primary" style={{ width: `${Math.min(100, ((t.horas_reales || 0) / t.total_horas_requeridas) * 100)}%` }} />
                                        </div>
                                        <span className="font-black text-[9px] text-primary">{(t.horas_reales || 0).toFixed(1)}H</span>
                                    </div>
                                </td>
                                <td className="text-right pr-6 flex justify-end">
                                    <StatusBadge
                                        status={(t.horas_reales || 0) >= t.total_horas_requeridas ? 'presente' : ((t.horas_reales || 0) >= (t.horas_ideales || 0) ? 'justificado' : 'ausente')}
                                        label={(t.horas_reales || 0) >= t.total_horas_requeridas ? 'COMPLETADO' : ((t.horas_reales || 0) >= (t.horas_ideales || 0) ? 'EN TIEMPO' : 'RETRASO')}
                                        className={(t.horas_reales || 0) >= t.total_horas_requeridas ? 'bg-green-500/10! text-green-500!' : ((t.horas_reales || 0) >= (t.horas_ideales || 0) ? 'bg-primary/10! text-primary!' : 'bg-red-500/10! text-red-500!')}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Mobile View: Cards */}
                <div className="md:hidden divide-y divide-base-300/50">
                    {loading ? (
                        <div className="text-center py-10 animate-pulse text-foreground/40 font-black tracking-widest text-[10px] uppercase">Sincronizando...</div>
                    ) : trabajadores.map(t => (
                        <div
                            key={t.id}
                            onClick={() => onSelect(t.id)}
                            className={`p-4 transition-all duration-200 ${selectedId === t.id ? 'bg-primary/5' : 'active:bg-base-200/50'}`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className={`font-black tracking-tight text-xs ${selectedId === t.id ? 'text-primary' : 'text-foreground'}`}>{t.nombre}</div>
                                    <div className="text-foreground/40 text-[8px] font-black tracking-widest uppercase">DNI: {t.dni}</div>
                                </div>
                                <StatusBadge
                                    status={(t.horas_reales || 0) >= t.total_horas_requeridas ? 'presente' : ((t.horas_reales || 0) >= (t.horas_ideales || 0) ? 'justificado' : 'ausente')}
                                    label={(t.horas_reales || 0) >= t.total_horas_requeridas ? 'COMPLETADO' : ((t.horas_reales || 0) >= (t.horas_ideales || 0) ? 'EN TIEMPO' : 'RETRASO')}
                                    className={(t.horas_reales || 0) >= t.total_horas_requeridas ? 'bg-green-500/10! text-green-500!' : ((t.horas_reales || 0) >= (t.horas_ideales || 0) ? 'bg-primary/10! text-primary!' : 'bg-red-500/10! text-red-500!')}
                                />
                            </div>
                            <div className="flex items-center justify-between gap-4 bg-base-200/50 p-2 rounded-xl border border-base-300/30">
                                <div className="flex flex-col">
                                    <span className="text-[7px] font-black text-foreground/40 uppercase">Progreso</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 h-1 bg-base-300 rounded-full overflow-hidden">
                                            <div className="h-full bg-primary" style={{ width: `${Math.min(100, ((t.horas_reales || 0) / t.total_horas_requeridas) * 100)}%` }} />
                                        </div>
                                        <span className="font-black text-[9px] text-primary">{(t.horas_reales || 0).toFixed(1)}H</span>
                                    </div>
                                </div>
                                <div className="flex flex-col text-right">
                                    <span className="text-[7px] font-black text-foreground/40 uppercase">Meta</span>
                                    <span className="text-[10px] font-black italic">{t.total_horas_requeridas.toFixed(1)}H</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    )
}
