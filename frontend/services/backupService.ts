import { apiClient } from './apiClient'
import { API_URL } from '@/config'

export const backupService = {
    async listBackups(filterAdminId?: string) {
        const params = filterAdminId ? { filter_admin_id: filterAdminId } : undefined
        const data = await apiClient.get<{ backups: string[] }>('/api/backups/list', params)
        return data.backups || []
    },

    async createBackup() {
        return apiClient.post('/api/backups/create', {})
    },

    getDownloadUrl(filename: string, filterAdminId?: string) {
        let url = `${API_URL}/api/backups/download/${filename}`
        if (filterAdminId) {
            url += `?filter_admin_id=${filterAdminId}`
        }
        return url
    },

    async downloadBackup(filename: string, filterAdminId?: string) {
        const params = filterAdminId ? { filter_admin_id: filterAdminId } : undefined
        const blob = await apiClient.get<Blob>(`/api/backups/download/${filename}`, params)
        const url = URL.createObjectURL(blob as any)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
    }
}
