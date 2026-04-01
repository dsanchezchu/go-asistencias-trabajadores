import { useState, useEffect, useCallback } from 'react'
import Swal from 'sweetalert2'
import { backupService } from '@/services/backupService'
import { useDemoContext } from '@/context/DemoContext'
import { useAdminFilter } from '@/context/AdminFilterContext'

export function useBackups() {
    const { refreshDemoStatus, demoStatus } = useDemoContext()
    const adminFilter = useAdminFilter()
    const selectedDemoUser = adminFilter?.selectedDemoUser || null
    
    const [backups, setBackups] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [initLoading, setInitLoading] = useState(true)

    const fetchBackups = useCallback(async () => {
        try {
            const userId = selectedDemoUser?.id?.toString()
            const data = await backupService.listBackups(userId)
            setBackups(data)
        } catch (error) {
            console.error('Error fetching backups:', error)
        } finally {
            setInitLoading(false)
        }
    }, [selectedDemoUser])

    useEffect(() => { 
        fetchBackups() 
    }, [fetchBackups])

    const createBackup = async () => {
        setLoading(true)
        Swal.fire({ title: 'Resguardando...', didOpen: () => Swal.showLoading(), allowOutsideClick: false })
        try {
            await backupService.createBackup()
            await fetchBackups()

            // Actualizar contexto demo para reflejar cambios en sidebar
            await refreshDemoStatus()

            Swal.fire({ icon: 'success', title: '¡Listo!', timer: 1500, showConfirmButton: false })
        } catch (error: any) {
            // Manejo específico para límites de demo
            if (error.demoInfo) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Límite de Demo',
                    html: `
                        <p>${error.message}</p>
                        <div class="mt-4 text-sm text-left">
                            <p>Backups creados: ${error.demoInfo.demo_backups_creados}/${error.demoInfo.limite_backups}</p>
                        </div>
                    `,
                    confirmButtonText: 'Entendido'
                })
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: error.message || 'Error crítico' })
            }
        } finally {
            setLoading(false)
        }
    }

    const downloadBackup = async (f: string) => {
        setLoading(true)
        try {
            const userId = selectedDemoUser?.id?.toString()
            await backupService.downloadBackup(f, userId)
        } catch (error: any) {
            console.error('Error downloading backup:', error)
            Swal.fire({ icon: 'error', title: 'Error', text: error.message || 'Error al descargar' })
        } finally {
            setLoading(false)
        }
    }

    return { backups, loading, initLoading, createBackup, downloadBackup }
}
