import { AsistenciaTrabajador } from '../types'

export function getAsistenciaStats(trabajadores: AsistenciaTrabajador[], getEstado: (id: number) => string) {
  return trabajadores.reduce((acc, p) => {
    const status = getEstado(p.id)
    if (status) {
      acc[status] = (acc[status] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)
}

// Puedes extender con más helpers si lo necesitas
