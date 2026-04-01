import { useState, useEffect, useCallback } from 'react'
import { dashboardService, DashboardTrabajador, DashboardStats } from '@/services/dashboardService'
import { useDemoContext } from '@/context/DemoContext'
import { useAdminFilter } from '@/context/AdminFilterContext'

export function useDashboardStats() {
    const [stats, setStats] = useState<DashboardStats>({ present: 0, late: 0, excused: 0, absent: 0 })
    const [trabajadores, setTrabajadores] = useState<DashboardTrabajador[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Get admin filter context
    const { demoStatus } = useDemoContext()
    const isAdmin = demoStatus?.role === 'admin'
    const adminFilterCtx = useAdminFilter()
    const adminFilter = isAdmin ? adminFilterCtx : null

    const fetchData = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            // Pass filter_admin_id if a demo user is selected
            const filterAdminId = adminFilter?.selectedDemoUser?.id?.toString()

            const [statsData, trabajadoresData] = await Promise.all([
                dashboardService.getTodayStats(filterAdminId),
                dashboardService.getTrabajadoresSummary(filterAdminId)
            ])
            setStats(statsData)
            setTrabajadores(trabajadoresData)
        } catch (err: unknown) {
            console.error('Error fetching dashboard stats:', err)
            const errorMessage = err instanceof Error ? err.message : 'Error al cargar los datos'
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }, [adminFilter?.selectedDemoUser?.id])

    useEffect(() => {
        fetchData()
    }, [fetchData, adminFilter?.selectedDemoUser])

    return {
        stats,
        trabajadores,
        loading,
        error,
        reload: fetchData
    }
}

export type { DashboardTrabajador }
