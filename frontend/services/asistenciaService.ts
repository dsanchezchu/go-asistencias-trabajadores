import { apiClient } from './apiClient'
import { Asistencia } from '@/types'

export const asistenciaService = {
    async getAsistenciasByDate(date: string, filterAdminId?: string): Promise<Asistencia[]> {
        const params: any = { fecha: date }
        if (filterAdminId) {
            params.filter_admin_id = filterAdminId
        }
        return apiClient.get<Asistencia[]>('/api/asistencias/fecha', params)
    },

    async saveAsistenciasBatch(payload: { fecha: string; asistencias: Partial<Asistencia>[] }): Promise<void> {
        return apiClient.post('/api/asistencias/batch', payload)
    }
}

