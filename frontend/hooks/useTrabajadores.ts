import { useState, useEffect, useCallback, useMemo } from 'react'
import Swal from 'sweetalert2'
import { trabajadorService } from '@/services/trabajadorService'
import { Trabajador, DemoInfo } from '@/types'
import { useAdminFilter } from '@/context/AdminFilterContext'
import { useDemoContext } from '@/context/DemoContext'

export function useTrabajadores() {
    const [trabajadores, setTrabajadores] = useState<Trabajador[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [loading, setLoading] = useState(true)

    // Get admin filter context
    const { demoStatus } = useDemoContext()
    const isAdmin = demoStatus?.role === 'admin'
    const adminFilterCtx = useAdminFilter()
    const adminFilter = isAdmin ? adminFilterCtx : null

    const fetchTrabajadores = useCallback(async () => {
        setLoading(true)
        try {
            // Pass filter_admin_id if a demo user is selected
            const filterAdminId = adminFilter?.selectedDemoUser?.id?.toString()
            const data = await trabajadorService.getAll(filterAdminId)
            setTrabajadores(data)
        } catch (error: unknown) {
            console.error('Error fetching trabajadores:', error)
            const errorMessage = error instanceof Error ? error.message : 'No se pudieron cargar los trabajadores'
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: errorMessage
            })
        } finally {
            setLoading(false)
        }
    }, [adminFilter?.selectedDemoUser?.id])

    const handleDelete = useCallback(async (id: number) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "Esta acción no se puede deshacer.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        })

        if (result.isConfirmed) {
            try {
                await trabajadorService.delete(id)
                setTrabajadores(prev => prev.filter(x => x.id !== id))
                Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1500, showConfirmButton: false })
                return true
            } catch (error: unknown) {
                const err = error as { message?: string; demoInfo?: DemoInfo }
                if (err.demoInfo) {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Límite de Demo',
                        text: err.message || 'Tu período de prueba ha expirado',
                    })
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: err.message || 'No se pudo eliminar el trabajador'
                    })
                }
                return false
            }
        }
        return false
    }, [])

    useEffect(() => {
        fetchTrabajadores()
    }, [fetchTrabajadores, adminFilter?.selectedDemoUser])

    const filtered = useMemo(() => {
        const term = searchTerm.toLowerCase()
        return trabajadores.filter(t =>
            (t.nombre?.toLowerCase().includes(term)) ||
            (t.dni?.includes(term))
        )
    }, [trabajadores, searchTerm])

    return {
        trabajadores,
        filtered,
        loading,
        searchTerm,
        setSearchTerm,
        reload: fetchTrabajadores,
        deleteTrabajador: handleDelete
    }
}
