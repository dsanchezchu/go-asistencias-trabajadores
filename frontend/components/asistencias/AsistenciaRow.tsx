import React from 'react'
import { UserCheck, X, Moon, Sun, Clock, AlertCircle, UserX, Timer } from 'lucide-react'
import Card from '@/components/ui/Card'
import PracticanteAvatar from '@/components/shared/PracticanteAvatar'

interface AsistenciaRowProps {
    practicante: any
    isMarked: boolean
    currentStatus: string
    currentTime: string
    currentTurno: string
    currentTardanza: number
    tardanzaUnit: 'm' | 'h'
    onDiscard: () => void
    onTimeChange: (time: string) => void
    onTardanzaChange: (val: number) => void
    onTardanzaUnitToggle: () => void
    onStatusChange: (status: string) => void
}

const AsistenciaRow = React.memo(({
    practicante: p,
    isMarked,
    currentStatus,
    currentTime,
    currentTurno,
    currentTardanza,
    tardanzaUnit,
    onDiscard,
    onTimeChange,
    onTardanzaChange,
    onTardanzaUnitToggle,
    onStatusChange
}: AsistenciaRowProps) => {

    const formatAMPM = (time: string) => {
        if (!time) return ''
        const [h, m] = time.split(':')
        let hours = parseInt(h)
        const ampm = hours >= 12 ? 'PM' : 'AM'
        hours = hours % 12
        hours = hours ? hours : 12
        return `${hours}:${m} ${ampm}`
    }

    return (
        <Card className="flex flex-col xl:flex-row justify-between items-center gap-4 group p-3! px-5! border-none rounded-3xl!">
            <div className="flex items-center gap-4 w-full xl:w-1/3">
                <PracticanteAvatar name={p.nombre} size="md" className="group-hover:scale-105 transition-transform" />
                <div className="truncate flex-1">
                    <h3 className="font-black text-foreground group-hover:text-primary transition-colors text-xs truncate mb-0.5">{p.nombre}</h3>
                    <div className="flex items-center gap-2">
                        <p className="text-foreground/40 text-[8px] font-black tracking-widest uppercase">DNI: {p.dni || '00000000'}</p>
                        <div className="w-px h-2 bg-base-300"></div>
                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${p.turno === 'tarde' ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' : 'bg-primary/10 border-primary/20 text-primary'}`}>
                            {p.turno === 'tarde' ? <Moon size={8} /> : <Sun size={8} />}
                            <span className="text-[7px] font-black uppercase tracking-tighter italic">
                                {p.turno} - {formatAMPM(p.hora_entrada)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 w-full xl:w-2/3 justify-end relative min-h-[36px]">
                {isMarked ? (
                    <div className="bg-green-500/10 border border-green-500/20 px-6 py-2 rounded-2xl flex items-center gap-3 shadow-sm animate-fade-in h-9">
                        <UserCheck size={16} className="text-green-500" />
                        <span className="text-[10px] font-black text-green-500 uppercase tracking-widest italic">Asistencia Registrada</span>
                    </div>
                ) : (
                    <>
                        <button
                            onClick={onDiscard}
                            className="p-2 rounded-xl bg-base-200 text-foreground/40 hover:text-red-500 hover:bg-red-500/10 transition-all border border-base-300"
                            title="Descartar cambios"
                        >
                            <X size={14} />
                        </button>

                        <div className="flex items-center gap-2 bg-base-200 p-1 rounded-xl border border-base-300 h-9">
                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[8px] font-black uppercase tracking-widest ${currentTurno?.toLowerCase() === 'tarde' ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' : 'bg-primary/10 border-primary/20 text-primary'}`}>
                                {currentTurno?.toLowerCase() === 'tarde' ? <Moon size={10} /> : <Sun size={10} />}
                                {currentTurno?.toLowerCase() === 'tarde' ? 'Tarde' : 'Mañana'}
                            </div>
                            <div 
                                className="px-3 py-1.5 bg-base-300/50 border border-base-300 rounded-lg text-foreground/60 font-black text-[10px] min-w-[70px] text-center"
                                title="Hora de entrada programada"
                            >
                                {currentTime || '08:00'}
                            </div>
                        </div>

                        {currentStatus === 'tardanza' && (
                            <div className="flex items-center gap-2 bg-amber-500/5 border border-amber-500/20 px-3 py-1 h-9 rounded-xl animate-scale-in">
                                <Timer size={12} className="text-amber-500" />
                                <div className="flex items-center gap-0.5">
                                    <input
                                        type="number"
                                        step="any"
                                        placeholder="0"
                                        className="w-12 bg-transparent border-none text-foreground font-black text-xs outline-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        value={tardanzaUnit === 'h' ? ((currentTardanza || 0) / 60) || '' : (currentTardanza || '')}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === '') {
                                                onTardanzaChange(0);
                                            } else {
                                                const num = parseFloat(val);
                                                onTardanzaChange(tardanzaUnit === 'h' ? num * 60 : num);
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={onTardanzaUnitToggle}
                                        className="text-[7px] font-black text-amber-500 uppercase tracking-widest hover:bg-amber-500/20 px-1.5 py-0.5 rounded transition-colors border border-amber-500/30"
                                    >
                                        {tardanzaUnit === 'h' ? 'HRS' : 'MIN'}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-1 bg-base-200 p-1 rounded-xl border border-base-300 h-9">
                            <StatusButton active={currentStatus === 'presente'} label="P" color="bg-green-500" icon={<UserCheck size={14} />} onClick={() => onStatusChange('presente')} />
                            <StatusButton active={currentStatus === 'tardanza'} label="T" color="bg-amber-500" icon={<Clock size={14} />} onClick={() => onStatusChange('tardanza')} />
                            <StatusButton active={currentStatus === 'justificado'} label="J" color="bg-blue-500" icon={<AlertCircle size={14} />} onClick={() => onStatusChange('justificado')} />
                            <StatusButton active={currentStatus === 'ausente'} label="A" color="bg-red-500" icon={<UserX size={14} />} onClick={() => onStatusChange('ausente')} />
                        </div>
                    </>
                )}
            </div>
        </Card>
    )
})

AsistenciaRow.displayName = 'AsistenciaRow'

export default AsistenciaRow

function StatusButton({ active, label, color, icon, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center justify-center w-7 h-7 rounded-lg font-bold text-[10px] transition-all duration-300 ${active ? `${color} text-white shadow-lg scale-105` : 'text-foreground/40 hover:text-foreground hover:bg-base-300'}`}
        >
            {icon}
        </button>
    )
}
