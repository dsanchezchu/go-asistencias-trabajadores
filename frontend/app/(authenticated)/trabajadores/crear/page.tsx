'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
    User,
    Save,
    X,
    CalendarDays,
    Sun,
    Moon,
    Search,
    Unlock
} from 'lucide-react'
import Swal from 'sweetalert2'

import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { trabajadorService } from '@/services/trabajadorService'
import { reniecService } from '@/services/reniecService'
import { useDemoContext } from '@/context/DemoContext'
import { DemoInfo } from '@/types'

export default function CrearTrabajador() {
    const [nombres, setNombres] = useState('')
    const [apellidoPaterno, setApellidoPaterno] = useState('')
    const [apellidoMaterno, setApellidoMaterno] = useState('')
    const [isIdLocked, setIsIdLocked] = useState(true)
    const [dni, setDni] = useState('')
    const [horas, setHoras] = useState(300)
    const [meses, setMeses] = useState(6)
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
    const [hoursPerDay, setHoursPerDay] = useState(4)
    const [workDays, setWorkDays] = useState<number[]>([1, 2, 3, 4, 5])
    const [turno, setTurno] = useState<'mañana' | 'tarde'>('mañana')
    const [horaEntrada, setHoraEntrada] = useState('08:00')
    const [loading, setLoading] = useState(false)
    const [holidays, setHolidays] = useState<{date: string; localName: string}[]>([])
    const router = useRouter()
    const { refreshDemoStatus } = useDemoContext()

    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

    useEffect(() => {
        const time = horaEntrada.split(':')
        const hour = parseInt(time[0])
        if (hour < 12 && turno !== 'mañana') {
            setTurno('mañana')
        } else if (hour >= 12 && turno !== 'tarde') {
            setTurno('tarde')
        }
    }, [horaEntrada, turno])

    const handleTurnoChange = (newTurno: 'mañana' | 'tarde') => {
        setTurno(newTurno)
        if (newTurno === 'mañana') {
            setHoraEntrada('08:00')
        } else {
            setHoraEntrada('13:00')
        }
    }

    useEffect(() => {
        const fetchHolidays = async () => {
            const currentYear = new Date(startDate).getFullYear()
            try {
                const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${currentYear}/PE`)
                if (res.ok) {
                    const data = await res.json()
                    setHolidays(data)
                }
            } catch (err) {
                console.error("Failed to fetch holidays", err)
            }
        }
        fetchHolidays()
    }, [startDate])

    const isNombresValid = useMemo(() => /^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$/.test(nombres) || nombres === '', [nombres])
    const isPaternoValid = useMemo(() => /^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$/.test(apellidoPaterno) || apellidoPaterno === '', [apellidoPaterno])
    const isMaternoValid = useMemo(() => /^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$/.test(apellidoMaterno) || apellidoMaterno === '', [apellidoMaterno])
    const isDniValid = useMemo(() => /^\d{8}$/.test(dni) || dni === '', [dni])
    const isMesesValid = useMemo(() => meses > 0, [meses])

    const calc = useMemo(() => {
        const start = new Date(startDate + 'T00:00:00')
        const end = new Date(start)
        end.setMonth(start.getMonth() + Number(meses))

        const totalHoras = Number(meses) * 4 * workDays.length * hoursPerDay

        let current = new Date(start)
        const holidaysInRange: {date: string; name: string}[] = []
        let workingDaysCount = 0

        while (current < end) {
            const dateStr = current.toISOString().split('T')[0]
            const holiday = holidays.find(h => h.date === dateStr)

            if (workDays.includes(current.getDay())) {
                workingDaysCount++
                if (holiday) {
                    holidaysInRange.push({ date: dateStr, name: holiday.localName })
                }
            }
            current.setDate(current.getDate() + 1)
        }

        return {
            endDate: end.toISOString().split('T')[0],
            totalHoras: totalHoras,
            workingDaysCount: workingDaysCount,
            holidaysDetected: holidaysInRange
        }
    }, [startDate, meses, hoursPerDay, workDays, holidays])

    useEffect(() => {
        setHoras(calc.totalHoras)
    }, [calc.totalHoras])

    const toggleDay = (day: number) => {
        setWorkDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
        )
    }

    const handleReniecSearch = async () => {
        if (dni.length !== 8) return Swal.fire('Error', 'El DNI debe tener 8 dígitos', 'warning')

        setLoading(true)

        try {
            const data = await reniecService.getByDni(dni) as {
                first_name?: string;
                nombres?: string;
                first_last_name?: string;
                apellido_paterno?: string;
                second_last_name?: string;
                apellido_materno?: string;
            }
            setNombres(data.first_name || data.nombres || '')
            setApellidoPaterno(data.first_last_name || data.apellido_paterno || '')
            setApellidoMaterno(data.second_last_name || data.apellido_materno || '')
            setIsIdLocked(true)
            Swal.fire({
                icon: 'success',
                title: '¡Encontrado!',
                text: 'Datos cargados de RENIEC',
                timer: 1500,
                showConfirmButton: false
            })
        } catch (error) {
            Swal.fire({
                title: 'No se encontraron datos',
                text: '¿Deseas ingresar los datos manualmente?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sí, ingresar manual',
                cancelButtonText: 'Reintentar',
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33'
            }).then((result) => {
                if (result.isConfirmed) {
                    setIsIdLocked(false)
                }
            })
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!isNombresValid || nombres === '') return Swal.fire('Error', 'Nombres inválidos', 'error')
        if (!isPaternoValid || apellidoPaterno === '') return Swal.fire('Error', 'Apellido Paterno inválido', 'error')
        if (!isMaternoValid || apellidoMaterno === '') return Swal.fire('Error', 'Apellido Materno inválido', 'error')
        if (!isDniValid || dni === '') return Swal.fire('Error', 'DNI debe ser de 8 dígitos', 'error')
        if (!isMesesValid) return Swal.fire('Error', 'Meses debe ser mayor a 0', 'error')
        if (workDays.length === 0) return Swal.fire('Error', 'Debes seleccionar al menos un día de trabajo', 'error')

        const confirm = await Swal.fire({
            title: 'Resumen de Registro',
            html: `
                <div class="text-left space-y-3 py-2 text-[10px] font-bold">
                    <p class="border-b border-gray-500/10 pb-2 text-gray-500 uppercase tracking-widest italic">Verifica los datos del trabajador</p>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <p class="text-gray-500 uppercase text-[8px]">NOMBRE COMPLETO</p>
                            <p class="text-current">${nombres} ${apellidoPaterno} ${apellidoMaterno}</p>
                        </div>
                        <div>
                            <p class="text-gray-500 uppercase text-[8px]">DNI</p>
                            <p class="text-current font-mono">${dni}</p>
                        </div>
                    </div>
                    <div class="bg-primary/5 rounded-xl p-3 border border-primary/10">
                        <div class="flex justify-between items-center">
                            <span class="text-primary tracking-widest uppercase text-[9px]">Horas Totales</span>
                            <span class="text-xl font-black text-current italic">${calc.totalHoras}h</span>
                        </div>
                        <p class="text-[7px] text-gray-400 italic mt-1">
                            ${calc.workingDaysCount} días laborables calendario | ${calc.holidaysDetected.length} feriados detectados
                        </p>
                    </div>
                    <div class="flex gap-2">
                         <div class="flex-1 bg-gray-500/5 p-2 rounded-lg border border-gray-500/10">
                            <p class="text-gray-500 text-[8px] uppercase">TURNO</p>
                            <p class="text-current uppercase">${turno}</p>
                         </div>
                         <div class="flex-1 bg-gray-500/5 p-2 rounded-lg border border-gray-500/10">
                            <p class="text-gray-500 text-[8px] uppercase">INGRESO</p>
                            <p class="text-current">${horaEntrada}</p>
                         </div>
                    </div>
                </div>
            `,
            background: 'var(--base-100)',
            color: 'var(--foreground)',
            showCancelButton: true,
            confirmButtonText: 'CONFIRMAR Y CREAR',
            cancelButtonText: 'REVISAR',
            customClass: {
                popup: 'rounded-3xl border border-base-300 shadow-2xl',
                confirmButton: 'bg-primary text-white font-black px-6 py-2 rounded-xl text-[10px] uppercase tracking-[0.2em] border-none',
                cancelButton: 'bg-base-200 text-foreground/60 font-black px-6 py-2 rounded-xl text-[10px] uppercase tracking-[0.2em] border border-base-300'
            }
        })

        if (!confirm.isConfirmed) return

        setLoading(true)

        try {
            await trabajadorService.create({
                nombres,
                apellido_paterno: apellidoPaterno,
                apellido_materno: apellidoMaterno,
                dni,
                total_horas_requeridas: Number(horas),
                duracion_meses: Number(meses),
                fecha_inicio: new Date(startDate).toISOString(),
                turno,
                hora_entrada: horaEntrada
            })

            Swal.fire({ icon: 'success', title: '¡Creado!', timer: 1500, showConfirmButton: false })

            // Actualizar estado de demo ANTES de navegar
            await refreshDemoStatus()
            router.push('/trabajadores')
        } catch (err: unknown) {
            const error = err as { message?: string; demoInfo?: DemoInfo }
            if (error.demoInfo) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Límite de Demo',
                    html: `
                        <p>${error.message || 'Has alcanzado el límite de la demo'}</p>
                        <div class="mt-4 text-sm text-left">
                            <p>Trabajadores creados: ${error.demoInfo.demo_trabajadores_creados}/${error.demoInfo.limite_trabajadores}</p>
                        </div>
                    `,
                    confirmButtonText: 'Entendido'
                })
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: error.message || 'Error de conexión' })
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-4 animate-fade-in pb-10">
            <div>
                <h1 className="text-xl font-black text-foreground tracking-tight mb-0.5 italic">Nuevo Trabajador</h1>
                <p className="text-foreground/40 font-bold text-[8px] uppercase tracking-[0.2em] italic">Alta de trabajador y configuración</p>
            </div>

            <div className="max-w-4xl mx-auto mt-4">
                <Card className="p-6! relative overflow-hidden bg-base-100 rounded-4xl! border border-base-300 shadow-xl">
                    <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Datos Personales */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 pb-2 border-b border-base-200">
                                    <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center">
                                        <User size={12} className="text-primary" />
                                    </div>
                                    <h3 className="text-foreground font-black text-[10px] uppercase tracking-widest italic">Identificación</h3>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[8px] font-black text-foreground/50 uppercase tracking-widest flex justify-between px-1">
                                        <span>DNI / Documento</span>
                                        {!isDniValid && dni !== '' && <span className="text-red-500 lowercase italic">8 dígitos</span>}
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            maxLength={8}
                                            className={`w-full h-10 bg-base-200/50 border ${isDniValid ? 'border-base-300 focus:border-primary/50 text-foreground' : 'border-red-500/50 text-red-500'} rounded-xl px-4 text-xs font-mono font-bold outline-none transition-all`}
                                            value={dni}
                                            onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                                            placeholder="00000000"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={handleReniecSearch}
                                            disabled={loading || dni.length !== 8}
                                            className="h-10 px-3 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            title="Buscar en RENIEC"
                                        >
                                            <Search size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[8px] font-black text-foreground/50 uppercase tracking-widest flex justify-between px-1">
                                        <span>Nombres</span>
                                        {!isIdLocked && <span className="text-secondary/80 lowercase italic flex items-center gap-1"><Unlock size={8} /> edición manual</span>}
                                    </label>
                                    <input
                                        type="text"
                                        className={`w-full h-10 bg-base-200/50 border ${isNombresValid ? 'border-base-300 focus:border-primary/50 text-foreground' : 'border-red-500/50 text-red-500'} rounded-xl px-4 text-xs font-bold outline-none transition-all ${isIdLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        value={nombres}
                                        onChange={(e) => setNombres(e.target.value)}
                                        placeholder="Nombres"
                                        disabled={isIdLocked}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[8px] font-black text-foreground/50 uppercase tracking-widest px-1">Apellido Paterno</label>
                                        <input
                                            type="text"
                                            className={`w-full h-10 bg-base-200/50 border ${isPaternoValid ? 'border-base-300 focus:border-primary/50 text-foreground' : 'border-red-500/50 text-red-500'} rounded-xl px-4 text-xs font-bold outline-none transition-all ${isIdLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            value={apellidoPaterno}
                                            onChange={(e) => setApellidoPaterno(e.target.value)}
                                            placeholder="Paterno"
                                            disabled={isIdLocked}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[8px] font-black text-foreground/50 uppercase tracking-widest px-1">Apellido Materno</label>
                                        <input
                                            type="text"
                                            className={`w-full h-10 bg-base-200/50 border ${isMaternoValid ? 'border-base-300 focus:border-primary/50 text-foreground' : 'border-red-500/50 text-red-500'} rounded-xl px-4 text-xs font-bold outline-none transition-all ${isIdLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            value={apellidoMaterno}
                                            onChange={(e) => setApellidoMaterno(e.target.value)}
                                            placeholder="Materno"
                                            disabled={isIdLocked}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5 pt-2">
                                    <label className="text-[8px] font-black text-foreground/50 uppercase tracking-widest px-1">Turno Asignado</label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleTurnoChange('mañana')}
                                            className={`flex-1 h-10 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${turno === 'mañana' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-base-200/50 text-foreground/40 border border-base-300'}`}
                                        >
                                            <Sun size={14} /> Mañana
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleTurnoChange('tarde')}
                                            className={`flex-1 h-10 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${turno === 'tarde' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-base-200/50 text-foreground/40 border border-base-300'}`}
                                        >
                                            <Moon size={14} /> Tarde
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[8px] font-black text-foreground/50 uppercase tracking-widest px-1">Hora de Entrada (Predeterminada)</label>
                                    <input
                                        type="time"
                                        className="w-full h-10 bg-base-200/50 border border-base-300 focus:border-primary/50 rounded-xl px-4 text-xs text-foreground font-bold outline-none"
                                        value={horaEntrada}
                                        onChange={(e) => setHoraEntrada(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Configuración de Horas */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 pb-2 border-b border-base-200">
                                    <div className="w-6 h-6 rounded-lg bg-accent/20 flex items-center justify-center">
                                        <CalendarDays size={12} className="text-accent" />
                                    </div>
                                    <h3 className="text-foreground font-black text-[10px] uppercase tracking-widest italic">Calculadora</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[8px] font-black text-foreground/50 uppercase tracking-widest px-1">Fecha Inicio</label>
                                        <input
                                            type="date"
                                            className="w-full h-10 bg-base-200/50 border border-base-300 focus:border-primary/50 rounded-xl px-3 text-xs text-foreground font-bold outline-none"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[8px] font-black text-foreground/50 uppercase tracking-widest px-1">Meses</label>
                                        <input
                                            type="number"
                                            min="1"
                                            className={`w-full h-10 bg-base-200/50 border ${isMesesValid ? 'border-base-300' : 'border-red-500'} focus:border-primary/50 rounded-xl px-3 text-xs text-foreground font-bold outline-none`}
                                            value={meses}
                                            onChange={(e) => setMeses(Number(e.target.value))}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[8px] font-black text-foreground/50 uppercase tracking-widest px-1">Días de Trabajo</label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {[1, 2, 3, 4, 5, 6, 0].map(day => (
                                            <button
                                                key={day}
                                                type="button"
                                                onClick={() => toggleDay(day)}
                                                className={`flex-1 min-w-[40px] h-8 rounded-lg text-[9px] font-black transition-all ${workDays.includes(day) ? 'bg-primary text-white shadow-md shadow-primary/10' : 'bg-base-200/50 text-foreground/40 border border-base-300'}`}
                                            >
                                                {dayNames[day]}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[8px] font-black text-foreground/50 uppercase tracking-widest px-1">Intensidad</label>
                                    <div className="grid grid-cols-4 gap-1.5">
                                        {[2, 4, 6, 8].map(h => (
                                            <button
                                                key={h}
                                                type="button"
                                                onClick={() => setHoursPerDay(h)}
                                                className={`h-8 rounded-lg font-black text-[9px] transition-all ${hoursPerDay === h ? 'bg-accent text-white shadow-md shadow-accent/10' : 'bg-base-200/50 text-foreground/40 border border-base-300'}`}
                                            >
                                                {h}h
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {calc.holidaysDetected.length > 0 && (
                                    <div className="space-y-2 pt-2 animate-in fade-in slide-in-from-top-4 duration-500">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                                            <label className="text-[8px] font-black text-foreground/50 uppercase tracking-widest px-1">Feriados Detectados</label>
                                        </div>
                                        <div className="space-y-1.5 max-h-24 overflow-y-auto custom-scrollbar pr-2">
                                            {calc.holidaysDetected.map((h, idx) => (
                                                <div key={idx} className="flex items-center justify-between bg-red-500/5 border border-red-500/10 rounded-lg px-3 py-1.5">
                                                    <span className="text-[9px] font-black text-red-500 italic lowercase tracking-wider">{h.name}</span>
                                                    <span className="text-[7px] font-bold text-amber-600/60">{new Date(h.date + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Resultado Final */}
                        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
                            <div className="flex flex-col md:flex-row gap-6 items-center text-center md:text-left">
                                <div className="space-y-0.5">
                                    <span className="text-[7px] font-black text-foreground/40 uppercase tracking-widest block">PROYECCIÓN</span>
                                    <div className="text-2xl font-black text-foreground italic tracking-tighter flex items-baseline gap-1">
                                        {calc.totalHoras} <span className="text-[10px] text-primary uppercase not-italic">Horas</span>
                                    </div>
                                    <p className="text-[7px] text-foreground/30 font-bold uppercase italic">{calc.workingDaysCount} jornadas</p>
                                </div>
                                <div className="hidden md:block w-px h-8 bg-base-300"></div>
                                <div className="space-y-0.5">
                                    <span className="text-[7px] font-black text-foreground/40 uppercase tracking-widest block">TÉRMINO</span>
                                    <div className="text-sm font-black text-foreground/80">
                                        {new Date(calc.endDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </div>
                                    <div className="flex items-center justify-center md:justify-start gap-1.5 text-[7px] text-accent font-black uppercase">
                                        <div className="w-1 h-1 rounded-full bg-accent animate-pulse"></div>
                                        Cierre de ciclo
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2 w-full md:w-auto">
                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="flex-1 h-10 px-6 text-[10px] font-black rounded-xl! shadow-lg shadow-primary/20"
                                    disabled={loading}
                                    icon={<Save size={14} />}
                                >
                                    GUARDAR
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="h-10 px-4 text-[10px] font-black rounded-xl! border border-base-300 bg-base-100"
                                    onClick={() => router.back()}
                                    icon={<X size={14} />}
                                >
                                    VOLVER
                                </Button>
                            </div>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    )
}
