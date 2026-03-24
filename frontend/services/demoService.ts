import { apiClient } from './apiClient'
import { DemoStatus } from '@/types'

export const demoService = {
    async getStatus(): Promise<DemoStatus> {
        return apiClient.get<DemoStatus>('/api/demo/status')
    },

    async reset(): Promise<{ msg: string; trabajadores_eliminados: number }> {
        return apiClient.post('/api/demo/reset', {})
    },

    async requestAccess(): Promise<{ msg: string }> {
        return apiClient.post('/api/demo/request-access', {})
    }
}
