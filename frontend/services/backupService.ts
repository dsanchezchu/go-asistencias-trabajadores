import { apiClient } from './apiClient'
import { API_URL } from '@/config'

export const backupService = {
    async listBackups() {
        const data = await apiClient.get<{ backups: string[] }>('/api/backups/list')
        return data.backups || []
    },

    async createBackup() {
        return apiClient.post('/api/backups/create', {})
    },

    getDownloadUrl(filename: string) {
        return `${API_URL}/api/backups/download/${filename}`
    }
,

    async downloadBackup(filename: string) {
        const blob = await apiClient.get<Blob>(`/api/backups/download/${filename}`)
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
    }
}
