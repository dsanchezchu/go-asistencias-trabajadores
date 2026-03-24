'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Swal from 'sweetalert2'
import TrabajadorForm from '@/components/trabajadores/TrabajadorForm'
import { trabajadorService } from '@/services/trabajadorService'
import { Trabajador, DemoInfo } from '@/types'

export default function EditarTrabajador() {
    const params = useParams()
    const id = params?.id as string
    const router = useRouter()
    const [trabajador, setTrabajador] = useState<Trabajador | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchTrabajador = async () => {
            try {
                const data = await trabajadorService.getById(id)
                setTrabajador(data)
            } catch (err) {
                Swal.fire('Error', 'No se pudo cargar el trabajador', 'error')
                router.push('/trabajadores')
            } finally {
                setLoading(false)
            }
        }
        if (id) fetchTrabajador()
    }, [id, router])

    const handleUpdate = async (data: Partial<Trabajador>) => {
        try {
            await trabajadorService.update(id, data)
            Swal.fire({
                icon: 'success',
                title: '¡Actualizado!',
                text: 'Los datos del trabajador han sido actualizados',
                timer: 1500,
                showConfirmButton: false
            })
            router.push('/trabajadores')
        } catch (err: unknown) {
            const error = err as { message?: string; demoInfo?: DemoInfo }
            if (error.demoInfo) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Límite de Demo',
                    text: error.message || 'Tu período de prueba ha expirado',
                })
            } else {
                Swal.fire('Error', error.message || 'Error al actualizar', 'error')
            }
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen text-foreground/50 font-bold uppercase tracking-widest text-xs">
                Cargando datos...
            </div>
        )
    }

    if (!trabajador) return null

    const initialValues = {
        nombres: trabajador.nombres || '',
        apellido_paterno: trabajador.apellido_paterno || '',
        apellido_materno: trabajador.apellido_materno || '',
        dni: trabajador.dni,
        total_horas_requeridas: trabajador.total_horas_requeridas,
        duracion_meses: trabajador.duracion_meses,
        fecha_inicio: trabajador.fecha_inicio ? new Date(trabajador.fecha_inicio).toISOString().split('T')[0] : '',
        turno: (trabajador.turno || 'mañana') as 'mañana' | 'tarde',
        hora_entrada: trabajador.hora_entrada || (trabajador.turno === 'tarde' ? '13:00' : '08:00')
    }

    return (
        <TrabajadorForm
            initialValues={initialValues}
            onSubmit={handleUpdate}
            title="Editar Trabajador"
            subtitle="Modificar datos y configuración"
            submitLabel="ACTUALIZAR"
            onCancel={() => router.back()}
        />
    )
}
