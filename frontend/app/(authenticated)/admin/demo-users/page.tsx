'use client'

import React, { useState, useEffect } from 'react'
import { Shield, User, Calendar, Clock, Ban, CheckCircle, AlertTriangle } from 'lucide-react'
import Swal from 'sweetalert2'
import { useDemoContext } from '@/context/DemoContext'
import { useAdminFilter } from '@/context/AdminFilterContext'

interface DemoUser {
  id: number
  username: string
  created_at: string
  role: string
  demo_trabajadores_creados: number
  demo_asistencias_creadas: number
  demo_eliminaciones: number
  demo_backups_creados: number
  demo_bloqueado: boolean
  demo_first_asistencia: string | null
  modules_blocked: boolean
  demo_expired: boolean
}

interface DemoUsersResponse {
  users: DemoUser[]
  total: number
  page: number
  limit: number
  total_pages: number
}

const DemoUsersPage = () => {
  const [users, setUsers] = useState<DemoUser[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const { demoStatus } = useDemoContext()
  const { fetchDemoUsers } = useAdminFilter()

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/demo-users?page=${page}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error response:', errorText)
        throw new Error(`Error ${response.status}: ${errorText}`)
      }

      const data: DemoUsersResponse = await response.json()
      setUsers(data.users)
      setTotal(data.total)
      setTotalPages(data.total_pages)
    } catch (error: any) {
      console.error('Error fetching demo users:', error)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'No se pudieron cargar los usuarios demo'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleResetUser = async (userId: number, username: string) => {
    const result = await Swal.fire({
      title: 'Reiniciar Usuario Demo',
      html: `
        <p class="text-sm">¿Deseas reiniciar el usuario <strong>${username}</strong>?</p>
        <p class="text-sm text-gray-600 mt-2">Esta acción:</p>
        <ul class="text-left text-sm mt-1 space-y-1">
          <li>• Eliminará todos sus trabajadores</li>
          <li>• Borrará sus asistencias</li>
          <li>• Reiniciará todos los contadores</li>
          <li>• Desbloqueará todos los módulos</li>
        </ul>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, reiniciar',
      cancelButtonText: 'Cancelar'
    })

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`/api/admin/reset-user/${userId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) throw new Error('Error al reiniciar usuario')

        const data = await response.json()
        await Swal.fire({
          title: '¡Usuario Reiniciado!',
          text: `Se eliminaron ${data.trabajadores_eliminados} trabajador(es) y ${data.asistencias_eliminadas} asistencia(s).`,
          icon: 'success'
        })

        fetchUsers() // Recargar la lista local
        fetchDemoUsers() // Recargar la lista en el contexto global (dropdown del sidebar)
      } catch (error: any) {
        Swal.fire({
          title: 'Error',
          text: error.message || 'No se pudo reiniciar el usuario',
          icon: 'error'
        })
      }
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [page])

  // Verificar si el usuario actual es admin completo
  if (demoStatus?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <div className="text-center">
          <Ban className="w-16 h-16 text-error mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-base-content mb-2">Acceso Denegado</h1>
          <p className="text-base-content/60">Solo los administradores completos pueden acceder a esta sección.</p>
        </div>
      </div>
    )
  }

  const getStatusBadge = (user: DemoUser) => {
    if (user.demo_expired) {
      return <span className="px-2 py-1 text-xs rounded-full bg-base-200 text-base-content border border-base-300">Demo Expirada</span>
    }
    if (user.modules_blocked) {
      return <span className="px-2 py-1 text-xs rounded-full bg-error/20 text-error border border-error/30">Módulos Bloqueados</span>
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-success/20 text-success border border-success/30">Activo</span>
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="p-6 space-y-6 bg-base-100 min-h-screen">
      {/* Header */}
      <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-base-content">Panel de Administración</h1>
            <p className="text-base-content/60">Gestión de usuarios demo</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 p-4">
          <div className="flex items-center gap-3">
            <User className="w-8 h-8 text-info" />
            <div>
              <p className="text-sm text-base-content/60">Total Usuarios</p>
              <p className="text-xl font-bold text-base-content">{total}</p>
            </div>
          </div>
        </div>

        <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-success" />
            <div>
              <p className="text-sm text-base-content/60">Usuarios Activos</p>
              <p className="text-xl font-bold text-base-content">
                {users.filter(u => !u.demo_expired && !u.modules_blocked).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 p-4">
          <div className="flex items-center gap-3">
            <Ban className="w-8 h-8 text-error" />
            <div>
              <p className="text-sm text-base-content/60">Módulos Bloqueados</p>
              <p className="text-xl font-bold text-base-content">
                {users.filter(u => u.modules_blocked).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-warning" />
            <div>
              <p className="text-sm text-base-content/60">Demos Expiradas</p>
              <p className="text-xl font-bold text-base-content">
                {users.filter(u => u.demo_expired).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 overflow-hidden">
        <div className="p-6 border-b border-base-300">
          <h2 className="text-lg font-semibold text-base-content">Usuarios Demo ({total})</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="loading loading-spinner loading-md text-primary"></div>
            <p className="mt-2 text-base-content/60">Cargando usuarios...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center">
            <User className="w-12 h-12 text-base-content/40 mx-auto mb-3" />
            <p className="text-base-content/60">No hay usuarios demo registrados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-base-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-base-content/60 uppercase tracking-wider">Usuario</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-base-content/60 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-base-content/60 uppercase tracking-wider">Progreso Demo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-base-content/60 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-base-100 divide-y divide-base-300">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-base-200/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-base-content">{user.username}</div>
                        <div className="text-sm text-base-content/60">
                          Registrado: {formatDate(user.created_at)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1 text-sm text-base-content">
                        <div>Trabajadores: {user.demo_trabajadores_creados}/1</div>
                        <div>Asistencias: {user.demo_asistencias_creadas}/3</div>
                        <div>Backups: {user.demo_backups_creados}/1</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleResetUser(user.id, user.username)}
                        className="btn btn-outline btn-error btn-sm"
                      >
                        <AlertTriangle className="w-4 h-4 mr-1.5" />
                        Reiniciar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-base-300 bg-base-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-base-content/60">
                Página {page} de {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  disabled={page === 1}
                  className="btn btn-sm btn-outline"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={page === totalPages}
                  className="btn btn-sm btn-outline"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DemoUsersPage