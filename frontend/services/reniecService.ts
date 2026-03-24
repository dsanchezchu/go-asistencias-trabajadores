import { apiClient } from './apiClient'

export interface ReniecResult {
    dni: string
    nombres: string
    apellido_paterno: string
    apellido_materno: string
    success: boolean
}

export const reniecService = {
    async getByDni(dni: string): Promise<ReniecResult> {
        return apiClient.get<ReniecResult>('/api/reniec', { dni })
    }
}
