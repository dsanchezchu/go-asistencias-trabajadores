import { apiClient } from './apiClient'

export const historialService = {
    async getAsistencias(filterAdminId?: string) {
        const params = filterAdminId ? { filter_admin_id: filterAdminId } : undefined
        return apiClient.get<any[]>('/api/asistencias', params)
    }
}
