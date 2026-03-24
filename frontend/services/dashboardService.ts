import { apiClient } from './apiClient'

export interface DashboardStats {
    present: number
    late: number
    excused: number
    absent: number
}

export interface DashboardTrabajador {
    id: number
    nombre: string
    dni: string
    total_horas_requeridas: number
    duracion_meses: number
    horas_reales: number
    horas_ideales: number
    nombres?: string
    apellido_paterno?: string
    apellido_materno?: string
}

export const dashboardService = {
    async getTodayStats(filterAdminId?: string): Promise<DashboardStats> {
        const today = new Date().toLocaleDateString('en-CA')
        const params: any = { fecha: today }
        if (filterAdminId) {
            params.filter_admin_id = filterAdminId
        }
        const data = await apiClient.get<{estado: string}[]>('/api/asistencias', params)
        const records = data || []

        return {
            present: records.filter(x => x.estado === 'presente').length,
            late: records.filter(x => x.estado === 'tardanza').length,
            excused: records.filter(x => x.estado === 'justificado').length,
            absent: records.filter(x => x.estado === 'ausente').length
        }
    },

    async getTrabajadoresSummary(filterAdminId?: string): Promise<DashboardTrabajador[]> {
        const params = filterAdminId ? { filter_admin_id: filterAdminId } : undefined
        const data = await apiClient.get<DashboardTrabajador[]>('/api/trabajadores', params)
        if (!data) return []
        return data.map(t => ({
            ...t,
            nombre: t.nombre || `${t.nombres || ''} ${t.apellido_paterno || ''} ${t.apellido_materno || ''}`.trim(),
            horas_reales: t.horas_reales || 0,
            horas_ideales: t.horas_ideales || 0
        }))
    }
}
