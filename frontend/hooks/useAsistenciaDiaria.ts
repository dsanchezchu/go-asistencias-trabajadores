import { useState, useEffect, useRef, useCallback } from 'react'
import Swal from 'sweetalert2'
import { asistenciaService } from '@/services/asistenciaService'
import { trabajadorService } from '@/services/trabajadorService'
import { useDemoContext } from '@/context/DemoContext'
import { useAdminFilter } from '@/context/AdminFilterContext'
import { AsistenciaTrabajador } from '../types'

export function useAsistenciaDiaria() {
    const { refreshDemoStatus, demoStatus } = useDemoContext()
    const isAdmin = demoStatus?.role === 'admin'
    const adminFilter = isAdmin ? useAdminFilter() : null
    const [fecha, setFecha] = useState(new Date().toLocaleDateString('en-CA'))
    const [loading, setLoading] = useState(true)
    const [trabajadores, setTrabajadores] = useState<AsistenciaTrabajador[]>([])
    const [asistencias, setAsistencias] = useState<Record<number, string>>({})
    const [tardanzas, setTardanzas] = useState<Record<number, number>>({})
    const [horasIngreso, setHorasIngreso] = useState<Record<number, string>>({})
    const [turnos, setTurnos] = useState<Record<number, 'mañana' | 'tarde'>>({})
    const [saving, setSaving] = useState(false)
    const [alreadyMarked, setAlreadyMarked] = useState<Set<number>>(new Set())
    const [initialStates, setInitialStates] = useState<{
        asis: Record<number, string>,
        tardanzas: Record<number, number>,
        horas: Record<number, string>,
        turnos: Record<number, 'mañana' | 'tarde'>
    }>({ asis: {}, tardanzas: {}, horas: {}, turnos: {} })
    const currentFetchDateRef = useRef<string>('')

    const [tempStates, setTempStates] = useState<Record<number, {
        estado?: string,
        minutos_tardanza?: number,
        hora_entrada?: string,
        turno?: 'mañana' | 'tarde',
        tardanza_unit?: 'm' | 'h'
    }>>({})

    const fetchData = useCallback(async () => {
        const fetchDate = fecha
        currentFetchDateRef.current = fetchDate
        setLoading(true)
        try {
            // Pass filter_admin_id if a demo user is selected
            const filterAdminId = adminFilter?.selectedDemoUser?.id?.toString()

            const [tData, aData] = await Promise.all([
                trabajadorService.getAll(filterAdminId),
                asistenciaService.getAsistenciasByDate(fetchDate, filterAdminId)
            ])

            if (currentFetchDateRef.current !== fetchDate) return

            const markedSet = new Set<number>()
            const asisMap: Record<number, string> = {}
            const tardMap: Record<number, number> = {}
            const horasMap: Record<number, string> = {}
            const turnosMap: Record<number, 'mañana' | 'tarde'> = {}

            if (Array.isArray(aData) && aData.length > 0) {
                aData.forEach((a: { trabajador_id: number; estado: string; minutos_tardanza: number; hora_ingreso: string; turno: string }) => {
                    if (a.trabajador_id && a.estado && a.estado !== '') {
                        markedSet.add(a.trabajador_id)
                    }
                    asisMap[a.trabajador_id] = a.estado
                    tardMap[a.trabajador_id] = a.minutos_tardanza
                    horasMap[a.trabajador_id] = a.hora_ingreso
                    turnosMap[a.trabajador_id] = a.turno ? a.turno.toLowerCase() as 'mañana' | 'tarde' : 'mañana'
                })
            }

            if (Array.isArray(tData)) {
                tData.forEach((t) => {
                    if (!markedSet.has(t.id)) {
                        turnosMap[t.id] = t.turno ? t.turno.toLowerCase() as 'mañana' | 'tarde' : 'mañana'
                        horasMap[t.id] = t.hora_entrada || (turnosMap[t.id] === 'tarde' ? '14:00' : '08:00')
                    }
                })
            }

            setTrabajadores(tData as AsistenciaTrabajador[])
            setAsistencias(asisMap)
            setTardanzas(tardMap)
            setHorasIngreso(horasMap)
            setTurnos(turnosMap)
            setAlreadyMarked(markedSet)
            setInitialStates({ asis: { ...asisMap }, tardanzas: { ...tardMap }, horas: { ...horasMap }, turnos: { ...turnosMap } })
            setTempStates({})
        } catch (error: unknown) {
            if (currentFetchDateRef.current === fetchDate) {
                console.error('Error fetching data:', error)
                const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
                Swal.fire({ icon: 'error', title: 'Error cargando datos', text: errorMessage })
            }
        } finally {
            if (currentFetchDateRef.current === fetchDate) {
                setLoading(false)
            }
        }
    }, [fecha, adminFilter?.selectedDemoUser?.id])

    useEffect(() => {
        setAlreadyMarked(new Set())
        setAsistencias({})
        setTardanzas({})
        setHorasIngreso({})
        setTurnos({})
        setTempStates({})
        setInitialStates({ asis: {}, tardanzas: {}, horas: {}, turnos: {} })
        fetchData()
    }, [fecha, fetchData])

    const updateTempState = useCallback((id: number, key: string, value: string | number | 'mañana' | 'tarde') => {
        setTempStates(prev => ({
            ...prev,
            [id]: { ...prev[id], [key]: value }
        }))
    }, [])

    const discardChanges = useCallback((id: number) => {
        setTempStates(prev => {
            const n = { ...prev }
            delete n[id]
            return n
        })
    }, [])

    const getEstado = useCallback((id: number) => {
        return tempStates[id]?.estado || asistencias[id] || initialStates.asis[id]
    }, [tempStates, asistencias, initialStates.asis])

    const handleSave = async () => {
        setSaving(true)
        try {
            const finalAsistencias = { ...initialStates.asis, ...asistencias }
            const finalTardanzas = { ...initialStates.tardanzas, ...tardanzas }
            const finalHorasIngreso = { ...initialStates.horas, ...horasIngreso }
            const finalTurnos = { ...initialStates.turnos, ...turnos }

            Object.entries(tempStates).forEach(([idStr, temp]) => {
                const id = Number(idStr)
                if (temp.estado !== undefined) finalAsistencias[id] = temp.estado
                if (temp.minutos_tardanza !== undefined) finalTardanzas[id] = temp.minutos_tardanza
                if (temp.hora_entrada !== undefined) finalHorasIngreso[id] = temp.hora_entrada
                if (temp.turno !== undefined) finalTurnos[id] = temp.turno
            })

            const entriesToSave = trabajadores.filter(t => {
                const isModified = tempStates[t.id] !== undefined ||
                    finalAsistencias[t.id] !== initialStates.asis[t.id] ||
                    finalTardanzas[t.id] !== initialStates.tardanzas[t.id] ||
                    finalHorasIngreso[t.id] !== initialStates.horas[t.id] ||
                    finalTurnos[t.id] !== initialStates.turnos[t.id]
                return isModified
            })

            if (entriesToSave.length === 0 && Object.keys(tempStates).length === 0) {
                Swal.fire({ icon: 'info', title: 'No hay cambios para guardar' })
                setSaving(false)
                return
            }

            const payload = {
                fecha: fecha,
                asistencias: entriesToSave.map(t => ({
                    trabajador_id: t.id,
                    estado: finalAsistencias[t.id] || 'ausente',
                    minutos_tardanza: finalTardanzas[t.id] || 0,
                    hora_ingreso: finalHorasIngreso[t.id] || '08:00',
                    turno: (finalTurnos[t.id] || 'mañana').toLowerCase()
                }))
            }

            await asistenciaService.saveAsistenciasBatch(payload)
            Swal.fire({ icon: 'success', title: 'Guardado', timer: 1500, showConfirmButton: false })
            setTempStates({})
            await fetchData()

            // Actualizar contexto demo para reflejar cambios en sidebar
            await refreshDemoStatus()
        } catch (error: unknown) {
            console.error('Save error:', error)
            const errorMessage = error instanceof Error ? error.message : 'Error de red'
            Swal.fire({ icon: 'error', title: 'Error al guardar', text: errorMessage })
        } finally {
            setSaving(false)
        }
    }

    return {
        fecha, setFecha,
        loading,
        trabajadores,
        tempStates,
        alreadyMarked,
        updateTempState,
        discardChanges,
        getEstado,
        handleSave,
        saving,
        initialStates
    }
}
