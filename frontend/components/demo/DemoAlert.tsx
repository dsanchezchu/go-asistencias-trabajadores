'use client'

import React from 'react'
import { AlertTriangle, Lock, Clock, Users, FileX, Database } from 'lucide-react'

export interface DemoAlertProps {
  type: 'working' | 'asistencias_limit' | 'backups_exhausted' | 'eliminaciones_limit' | 'modules_blocked' | 'demo_expired'
  trabajadoresCreados?: number
  asistenciasCreadas?: number
  eliminaciones?: number
  backupsCreados?: number
  diasRestantes?: number
  onRequestAccess?: () => void
  className?: string
}

const DemoAlert = ({
  type,
  trabajadoresCreados = 0,
  asistenciasCreadas = 0,
  eliminaciones = 0,
  backupsCreados = 0,
  diasRestantes = 0,
  onRequestAccess,
  className = ''
}: DemoAlertProps) => {

  const getAlertConfig = () => {
    switch (type) {
      case 'working':
        return {
          icon: Users,
          title: 'Modo Demo Activo',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          iconColor: 'text-blue-600',
          titleColor: 'text-blue-900',
          textColor: 'text-blue-800',
          showButton: false,
          content: (
            <div className="space-y-2">
              <p>Tu cuenta está en modo de prueba. Límites actuales:</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Trabajadores: {trabajadoresCreados}/1</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>Asistencias: {asistenciasCreadas}/3</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Database className="w-4 h-4" />
                  <span>Backups: {backupsCreados}/1</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FileX className="w-4 h-4" />
                  <span>Eliminaciones: {eliminaciones}/2</span>
                </div>
              </div>
            </div>
          )
        }

      case 'asistencias_limit':
        return {
          icon: Clock,
          title: 'Límite de Asistencias Alcanzado',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          iconColor: 'text-amber-600',
          titleColor: 'text-amber-900',
          textColor: 'text-amber-800',
          showButton: true,
          content: (
            <div>
              <p>Has alcanzado el límite máximo de <span className="font-semibold">3 asistencias</span> en modo demo.</p>
              <p className="mt-1 text-sm">Para continuar registrando asistencias, solicita acceso completo al administrador.</p>
            </div>
          )
        }

      case 'backups_exhausted':
        return {
          icon: Database,
          title: 'Intentos Agotados',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          iconColor: 'text-red-600',
          titleColor: 'text-red-900',
          textColor: 'text-red-800',
          showButton: false,
          content: (
            <div>
              <p>Has utilizado tu <span className="font-semibold">único backup permitido</span> en modo demo.</p>
              <p className="mt-1 text-sm">Esta función no estará disponible hasta que solicites acceso completo.</p>
            </div>
          )
        }

      case 'eliminaciones_limit':
        return {
          icon: AlertTriangle,
          title: 'Límite de Eliminaciones',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          iconColor: 'text-orange-600',
          titleColor: 'text-orange-900',
          textColor: 'text-orange-800',
          showButton: true,
          content: (
            <div>
              <p>Has alcanzado el límite de <span className="font-semibold">eliminaciones permitidas ({eliminaciones}/2)</span>.</p>
              <p className="mt-1 text-sm">Para seguir utilizando el sistema, solicita acceso completo al administrador.</p>
            </div>
          )
        }

      case 'modules_blocked':
        return {
          icon: Lock,
          title: 'Acceso Bloqueado',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          iconColor: 'text-red-600',
          titleColor: 'text-red-900',
          textColor: 'text-red-800',
          showButton: true,
          content: (
            <div>
              <div className="mb-3">
                <p className="font-semibold">Los siguientes módulos han sido bloqueados:</p>
                <ul className="mt-2 list-disc list-inside text-sm space-y-1">
                  <li>📋 Gestión de Trabajadores</li>
                  <li>⏰ Registro de Asistencias</li>
                  <li>💾 Crear Copias de Seguridad</li>
                </ul>
              </div>
              <p className="text-sm">
                Motivo: Superaste el límite de <span className="font-semibold">eliminaciones permitidas (2/2)</span>.
              </p>
            </div>
          )
        }

      case 'demo_expired':
        return {
          icon: Clock,
          title: 'Demo Expirada',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-300',
          iconColor: 'text-gray-600',
          titleColor: 'text-gray-900',
          textColor: 'text-gray-800',
          showButton: true,
          content: (
            <div>
              <p>Tu período de prueba de <span className="font-semibold">3 días</span> ha expirado.</p>
              <p className="mt-1 text-sm">Contacta al administrador para obtener acceso completo al sistema.</p>
            </div>
          )
        }

      default:
        return {
          icon: AlertTriangle,
          title: 'Estado Desconocido',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-300',
          iconColor: 'text-gray-600',
          titleColor: 'text-gray-900',
          textColor: 'text-gray-800',
          showButton: false,
          content: <p>Estado de demo desconocido.</p>
        }
    }
  }

  const config = getAlertConfig()
  const Icon = config.icon

  return (
    <div className={`rounded-xl border-2 ${config.borderColor} ${config.bgColor} p-4 shadow-sm ${className}`}>
      <div className="flex items-start space-x-3">
        {/* Icono */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${config.bgColor} border ${config.borderColor}`}>
          <Icon className={`w-5 h-5 ${config.iconColor}`} />
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-semibold ${config.titleColor} mb-2`}>
            {config.title}
          </h3>
          <div className={`text-sm ${config.textColor}`}>
            {config.content}
          </div>

          {/* Botón de acción */}
          {config.showButton && onRequestAccess && (
            <button
              onClick={onRequestAccess}
              className="mt-3 inline-flex items-center px-3 py-2 border border-transparent text-xs font-medium rounded-lg shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
            >
              <Lock className="w-4 h-4 mr-1.5" />
              Solicitar Acceso al Administrador
            </button>
          )}
        </div>
      </div>

      {/* Barra de progreso para algunos tipos */}
      {(type === 'working' || type === 'asistencias_limit') && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className={config.textColor}>Progreso del Demo</span>
            <span className={config.textColor}>
              {type === 'working'
                ? `${Math.min(trabajadoresCreados + asistenciasCreadas, 4)}/4 acciones`
                : '3/3 asistencias'
              }
            </span>
          </div>
          <div className="w-full bg-white rounded-full h-2 border border-gray-200">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                type === 'asistencias_limit'
                  ? 'bg-amber-500'
                  : Math.min(trabajadoresCreados + asistenciasCreadas, 4) >= 3
                    ? 'bg-red-500'
                    : 'bg-blue-500'
              }`}
              style={{
                width: type === 'working'
                  ? `${Math.min((trabajadoresCreados + asistenciasCreadas) / 4 * 100, 100)}%`
                  : '100%'
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default DemoAlert

// Componente de wrapper para uso fácil con el contexto de demo
export const DemoAlertContainer = ({ demoStatus, onRequestAccess, className }: {
  demoStatus: any
  onRequestAccess?: () => void
  className?: string
}) => {
  if (!demoStatus?.is_demo) {
    return null
  }

  // Determinar el tipo de alerta según el estado
  let alertType: DemoAlertProps['type'] = 'working'

  if (demoStatus.demo_expired) {
    alertType = 'demo_expired'
  } else if (demoStatus.modules_blocked) {
    alertType = 'modules_blocked'
  } else if (demoStatus.asistencias_agotadas) {
    alertType = 'asistencias_limit'
  } else if (demoStatus.eliminaciones_agotadas) {
    alertType = 'eliminaciones_limit'
  } else if (demoStatus.backups_agotados) {
    alertType = 'backups_exhausted'
  }

  return (
    <DemoAlert
      type={alertType}
      trabajadoresCreados={demoStatus.trabajadores_creados || 0}
      asistenciasCreadas={demoStatus.asistencias_creadas || 0}
      eliminaciones={demoStatus.eliminaciones || 0}
      backupsCreados={demoStatus.demo_backups_creados || 0}
      diasRestantes={demoStatus.dias_restantes || 0}
      onRequestAccess={onRequestAccess}
      className={className}
    />
  )
}