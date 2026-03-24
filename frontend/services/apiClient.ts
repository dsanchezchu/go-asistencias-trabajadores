import { API_URL } from '@/config'
import Cookies from 'js-cookie'

interface FetchOptions extends RequestInit {
    params?: Record<string, string>
}

class ApiClient {
    private async request<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
        const { params, ...init } = options
        
        let url = `${API_URL}${endpoint}`
        if (params) {
            const searchParams = new URLSearchParams(params)
            url += `?${searchParams.toString()}`
        }

        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
        
        const headers = new Headers(init.headers)
        if (token) {
            headers.set('Authorization', `Bearer ${token}`)
        }
        if (!(init.body instanceof FormData) && !headers.has('Content-Type')) {
            headers.set('Content-Type', 'application/json')
        }

        const response = await fetch(url, {
            ...init,
            headers
        })

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Error desconocido' }))
            throw new Error(error.error || error.message || 'Error en la petición')
        }

        if (response.status === 204) return {} as T

        const contentType = response.headers.get('Content-Type')
        if (contentType && contentType.includes('application/json')) {
            return response.json()
        }

        return response.blob() as unknown as T
    }

    get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
        return this.request<T>(endpoint, { method: 'GET', params })
    }

    post<T>(endpoint: string, body: unknown): Promise<T> {
        return this.request<T>(endpoint, { 
            method: 'POST', 
            body: body instanceof FormData ? body : JSON.stringify(body) 
        })
    }

    put<T>(endpoint: string, body: unknown): Promise<T> {
        return this.request<T>(endpoint, { 
            method: 'PUT', 
            body: body instanceof FormData ? body : JSON.stringify(body) 
        })
    }

    delete<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'DELETE' })
    }
}

export const apiClient = new ApiClient()
