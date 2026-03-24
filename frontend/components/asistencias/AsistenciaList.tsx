import React from 'react'
import { AsistenciaTrabajador } from '../../types'
import AsistenciaRow from './AsistenciaRow'

interface AsistenciaListProps {
  trabajadores: AsistenciaTrabajador[]
  getEstado: (id: number) => string
  updateTempState: (id: number, key: string, value: any) => void
  tempStates: Record<number, any>
  alreadyMarked: Set<number>
  discardChanges: (id: number) => void
  initialStates: any
}

export default function AsistenciaList({ trabajadores, getEstado, updateTempState, tempStates, alreadyMarked, discardChanges, initialStates }: AsistenciaListProps) {
  return (
    <div className="space-y-4">
      {trabajadores.map(p => {
        const status = getEstado(p.id)
        const hasTempChanges = tempStates[p.id] !== undefined
        const isMarked = !hasTempChanges && alreadyMarked.has(p.id)
        const temp = tempStates[p.id] || {}

        const currentStatus = temp.estado || status || ''
        const defaultTime = p.turno === 'tarde' ? '14:00' : '08:00'
        const initialTime = initialStates.horas?.[p.id] || defaultTime
        const currentTime = temp.hora_entrada || initialTime
        const initialTurno = initialStates.turnos?.[p.id] || (p.turno?.toLowerCase() as 'mañana' | 'tarde') || 'mañana'
        const currentTurno = temp.turno || initialTurno
        const initialTardanza = initialStates.tardanzas?.[p.id] || 0
        const currentTardanza = temp.minutos_tardanza !== undefined ? temp.minutos_tardanza : initialTardanza
        const tardanzaUnit = temp.tardanza_unit || 'm'

        return (
          <AsistenciaRow
            key={p.id}
            practicante={p}
            isMarked={isMarked}
            currentStatus={currentStatus}
            currentTime={currentTime}
            currentTurno={currentTurno}
            currentTardanza={currentTardanza}
            tardanzaUnit={tardanzaUnit}
            onDiscard={() => discardChanges(p.id)}
            onTimeChange={(time) => updateTempState(p.id, 'hora_entrada', time)}
            onTardanzaChange={(val) => updateTempState(p.id, 'minutos_tardanza', val)}
            onTardanzaUnitToggle={() => updateTempState(p.id, 'tardanza_unit', tardanzaUnit === 'm' ? 'h' : 'm')}
            onStatusChange={(newStatus) => updateTempState(p.id, 'estado', newStatus)}
          />
        )
      })}
    </div>
  )
}
