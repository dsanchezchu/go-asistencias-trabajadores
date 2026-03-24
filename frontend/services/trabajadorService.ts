import { apiClient } from './apiClient'
import { Trabajador } from '@/types'

export const trabajadorService = {
    async getAll(filterAdminId?: string): Promise<Trabajador[]> {
        const params = filterAdminId ? { filter_admin_id: filterAdminId } : undefined
        const data = await apiClient.get<Trabajador[]>('/api/trabajadores', params)
        return data.map(t => ({
            ...t,
            nombre: t.nombre || `${t.nombres || ''} ${t.apellido_paterno || ''}`.trim()
        }))
    },

    async getById(id: string | number): Promise<Trabajador> {
        return apiClient.get<Trabajador>(`/api/trabajadores/${id}`)
    },

    async create(data: Partial<Trabajador>): Promise<Trabajador> {
        return apiClient.post<Trabajador>('/api/trabajadores', data)
    },

    async update(id: string | number, data: Partial<Trabajador>): Promise<Trabajador> {
        return apiClient.put<Trabajador>(`/api/trabajadores/${id}`, data)
    },

    async delete(id: string | number): Promise<void> {
        return apiClient.delete(`/api/trabajadores/${id}`)
    }
}
