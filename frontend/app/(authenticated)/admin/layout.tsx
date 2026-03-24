'use client'

import { useDemoContext } from '@/context/DemoContext'
import { Ban, Loader2 } from 'lucide-react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { demoStatus, isLoading } = useDemoContext()

  // Mostrar loading mientras se carga el contexto
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-base-content/60">Verificando permisos...</p>
        </div>
      </div>
    )
  }

  // Verificar que el usuario sea admin completo
  if (demoStatus?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <Ban className="w-16 h-16 text-error mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-base-content mb-2">Acceso Denegado</h1>
          <p className="text-base-content/60">Solo los administradores completos pueden acceder a esta sección.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}