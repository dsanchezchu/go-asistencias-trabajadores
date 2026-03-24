import React from 'react'
import { ChevronRight, Clock, LayoutDashboard, Eye, Pencil, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Swal from 'sweetalert2'

import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import TrabajadorAvatar from '@/components/shared/TrabajadorAvatar'
import { useDemoContext } from '@/context/DemoContext'
import { Trabajador } from '@/types'

interface TrabajadorCardProps {
    trabajador: Trabajador
    onDelete: (id: number) => void
}

export default function TrabajadorCard({ trabajador: t, onDelete }: TrabajadorCardProps) {
    const router = useRouter()
    const { demoStatus } = useDemoContext()

    // Los usuarios demo no pueden eliminar trabajadores
    const canDelete = demoStatus?.role === 'admin'

    const handleDelete = async () => {
        const { value: proceed } = await Swal.fire({
            title: '¿Eliminar?',
            text: `Se borrará a ${t.nombre}.`,
            icon: 'warning',
            showCancelButton: true,
            customClass: {
                popup: 'glass-card rounded-3xl',
                title: 'text-foreground font-black',
                htmlContainer: 'text-foreground/60 font-medium'
            }
        })
        if (proceed) {
            onDelete(t.id)
        }
    }

    const calculateEndTime = (startTime?: string) => {
        if (!startTime) return '---'
        const [hours, minutes] = startTime.split(':').map(Number)
        const date = new Date()
        date.setHours(hours, minutes, 0)
        date.setHours(date.getHours() + 4)
        return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false })
    }

    const calculateEndDate = (startDate?: string, months?: number) => {
        if (!startDate || months == null) return null
        const s = new Date(startDate)
        if (isNaN(s.getTime())) return null
        const end = new Date(s)
        end.setMonth(end.getMonth() + Number(months || 0))
        return end.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
    }

    const fechaFinStr = calculateEndDate(t.fecha_inicio, t.duracion_meses)

    const handleView = () => {
        const endTime = calculateEndTime(t.hora_entrada)
        const fechaFin = calculateEndDate(t.fecha_inicio, t.duracion_meses)
        Swal.fire({
            title: 'Detalle del Trabajador',
            html: `
                <div class="text-left space-y-4 py-2 text-foreground">
                    <div class="flex items-center gap-4 border-b border-base-content/10 pb-4">
                        <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-lg">
                            ${t.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h3 class="font-bold text-lg leading-none">${t.nombre}</h3>
                            <div class="flex gap-2 mt-1">
                                <span class="text-[10px] bg-base-200 px-2 py-0.5 rounded-full font-mono text-foreground/60">DNI: ${t.dni}</span>
                                <span class="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-black uppercase">${t.turno || 'Sin turno'}</span>
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div class="bg-base-200/50 p-3 rounded-xl border border-base-300">
                            <p class="text-[9px] uppercase tracking-widest opacity-50 font-black mb-1">Horas Requeridas</p>
                            <p class="font-black text-lg">${t.total_horas_requeridas}h</p>
                        </div>
                        <div class="bg-base-200/50 p-3 rounded-xl border border-base-300">
                            <p class="text-[9px] uppercase tracking-widest opacity-50 font-black mb-1">Duración</p>
                            <p class="font-black text-lg">${t.duracion_meses} <span class="text-xs font-normal opacity-70">meses</span></p>
                        </div>
                    </div>

                    <div class="bg-base-200/50 p-3 rounded-xl border border-base-300 flex flex-col md:flex-row justify-between items-center gap-3">
                        <div>
                            <p class="text-[9px] uppercase tracking-widest opacity-50 font-black mb-1">Inicio</p>
                            <p class="font-bold text-sm">${t.fecha_inicio ? new Date(t.fecha_inicio).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '---'}</p>
                            <p class="text-[9px] uppercase tracking-widest opacity-50 font-black mt-2 mb-1">Fin</p>
                            <p class="font-bold text-sm">${fechaFin || '---'}</p>
                        </div>
                        <div class="text-right">
                            <p class="text-[9px] uppercase tracking-widest opacity-50 font-black mb-1">Horario</p>
                            <p class="font-bold text-sm font-mono flex items-center gap-1 justify-end">${t.hora_entrada?.slice(0, 5) || '--:--'} <span class="text-xs opacity-50">➜</span> ${endTime}</p>
                        </div>
                    </div>
                    </div>
                </div>
            `,
            showConfirmButton: true,
            confirmButtonText: 'CERRAR',
            background: 'var(--base-100)',
            color: 'var(--foreground)',
            width: '24rem',
            customClass: {
                popup: 'rounded-3xl border border-base-300 shadow-2xl',
                confirmButton: 'bg-base-200 text-foreground font-black px-6 py-2 rounded-xl text-[10px] uppercase tracking-[0.2em] border border-base-300 hover:bg-base-300 shadow-none',
                title: 'text-xl font-black italic text-left w-full pl-4 text-foreground'
            }
        })
    }

    return (
        <Card hover className="relative overflow-hidden group p-4! border-none rounded-3xl!">
            <div
                className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-2 transition-all duration-300 cursor-pointer z-10"
                onClick={handleView}
            >
                <ChevronRight className="text-primary" size={16} />
            </div>

            <div className="flex items-center gap-3 mb-4">
                <TrabajadorAvatar name={t.nombre} size="lg" className="group-hover:scale-105 transition-transform" />
                <div className="truncate cursor-pointer" onClick={handleView}>
                    <h3 className="font-black text-sm text-foreground group-hover:text-primary transition-colors leading-tight mb-0.5 truncate">{t.nombre || 'Sin nombre'}</h3>
                    <div className="text-foreground/40 font-black text-[9px] tracking-widest uppercase">DNI: {t.dni || 'N/A'}</div>
                </div>
            </div>

            <div className="space-y-2 pt-3 border-t border-base-300">
                <div className="flex justify-between items-center">
                    <span className="text-foreground/40 font-black text-[8px] uppercase tracking-widest flex items-center gap-1.5">
                        <Clock size={12} className="text-primary" /> Meta
                    </span>
                    <span className="text-foreground font-black text-xs italic">{t.total_horas_requeridas.toFixed(1)}h</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-foreground/40 font-black text-[8px] uppercase tracking-widest flex items-center gap-1.5">
                        <LayoutDashboard size={12} className="text-accent" /> Tiempo
                    </span>
                    <span className="text-foreground font-black text-xs italic">{t.duracion_meses} Meses</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-foreground/40 font-black text-[8px] uppercase tracking-widest">Fin</span>
                    <span className="text-foreground font-black text-xs italic">{fechaFinStr || '---'}</span>
                </div>
            </div>

            <div className={`grid ${canDelete ? 'grid-cols-3' : 'grid-cols-2'} gap-2 mt-4 pt-4 border-t border-base-300`}>
                <Button
                    onClick={handleView}
                    variant="ghost"
                    className="h-8 rounded-lg! text-[9px] font-black uppercase tracking-widest bg-base-200 border-base-300 hover:bg-info/20 hover:text-info hover:border-info/30 px-2!"
                    textClassName="inline xl:hidden 2xl:inline"
                    icon={<Eye size={14} />}
                >
                    VER
                </Button>
                <Button
                    onClick={() => router.push(`/trabajadores/${t.id}/editar`)}
                    variant="ghost"
                    className="h-8 rounded-lg! text-[9px] font-black uppercase tracking-widest bg-base-200 border-base-300 hover:bg-primary/20 hover:text-primary hover:border-primary/30 px-2!"
                    textClassName="inline xl:hidden 2xl:inline"
                    icon={<Pencil size={12} />}
                >
                    EDITAR
                </Button>
                {canDelete && (
                    <Button
                        onClick={handleDelete}
                        variant="error"
                        className="h-8 rounded-lg! text-[9px] font-black uppercase tracking-widest bg-red-500/20 text-red-600 hover:bg-red-600 hover:text-white border-none px-2!"
                        textClassName="inline xl:hidden 2xl:inline"
                        icon={<Trash2 size={12} />}
                    >
                        ELIMINAR
                    </Button>
                )}
            </div>
        </Card>
    )
}
