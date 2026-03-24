
import React from 'react'
import { Search, Calendar } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

interface HistorialFiltersProps {
    view: 'lista' | 'gantt'
    searchTerm: string
    setSearchTerm: (val: string) => void
    filterEstado: string
    setFilterEstado: (val: string) => void
    reload: () => void
}

const HistorialFilters = ({ view, searchTerm, setSearchTerm, filterEstado, setFilterEstado, reload }: HistorialFiltersProps) => {
    if (view !== 'lista') return null

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Card className="md:col-span-2 p-0! overflow-hidden rounded-xl!">
                <div className="relative h-full flex items-center">
                    <Search className="absolute left-3 text-foreground/40" size={14} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o DNI..."
                        className="w-full h-10 pl-9 bg-transparent border-none text-foreground font-medium outline-none text-xs placeholder:text-foreground/30"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </Card>
            <Card className="p-0! rounded-xl!">
                <select
                    className="w-full h-10 px-3 bg-transparent border-none text-foreground font-black text-[9px] uppercase tracking-widest outline-none appearance-none cursor-pointer"
                    value={filterEstado}
                    onChange={(e) => setFilterEstado(e.target.value)}
                >
                    <option value="todos" className="bg-base-100 text-foreground">TODOS</option>
                    <option value="presente" className="bg-base-100 text-green-600">PRESENTE</option>
                    <option value="ausente" className="bg-base-100 text-red-600">AUSENTE</option>
                    <option value="tardanza" className="bg-base-100 text-amber-600">TARDANZA</option>
                    <option value="justificado" className="bg-base-100 text-blue-600">JUSTIFICADO</option>
                </select>
            </Card>
            <Button onClick={reload} variant="ghost" className="h-10 rounded-xl! text-[9px] bg-base-100 border border-base-300" icon={<Calendar size={14} />}>
                RECARGAR
            </Button>
        </div>
    )
}

export default HistorialFilters
