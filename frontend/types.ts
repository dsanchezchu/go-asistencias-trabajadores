export interface Trabajador {
    id: number
    nombre: string
    dni: string
    total_horas_requeridas: number
    duracion_meses: number
    nombres?: string
    apellido_paterno?: string
    apellido_materno?: string
    horas_reales?: number
    horas_ideales?: number
    turno?: string
    hora_entrada?: string
    fecha_inicio?: string
    admin_id?: number
}

export interface AsistenciaTrabajador {
    id: number
    nombre: string
    dni: string
    turno: string
    hora_entrada: string
    minutos_tardanza?: number
    nombres?: string
    apellido_paterno?: string
    apellido_materno?: string
}

export interface Asistencia {
    id: number
    fecha: string
    estado: string
    minutos_tardanza: number
    hora_ingreso: string
    turno: string
    trabajador_id: number
}

export interface AsistenciaHistorial extends Asistencia {
    nombre: string
    dni: string
    // Alias para compatibilidad con código antiguo
    practicante_id?: number
}

export interface Admin {
    id: number
    username: string
    theme: string
    approved: boolean
    role: 'admin' | 'admin_prueba'
    demo_trabajadores_creados: number
    demo_first_asistencia?: string
}

export interface DemoStatus {
    is_demo: boolean
    role: string
    demo_trabajadores_creados?: number
    trabajadores_actuales?: number
    limite_trabajadores?: number
    demo_asistencias_creadas?: number
    limite_asistencias?: number
    demo_eliminaciones?: number
    limite_eliminaciones?: number
    demo_backups_creados?: number
    limite_backups?: number
    demo_first_asistencia?: string
    demo_expira?: string
    demo_expired?: boolean
    modules_blocked?: boolean
    unlimited?: boolean
}

export interface DemoInfo {
    role: string
    demo_trabajadores_creados: number
    limite_trabajadores: number
    demo_backups_creados: number
    limite_backups: number
    demo_first_asistencia?: string
    demo_expira?: string
    dias_restantes?: number
}
