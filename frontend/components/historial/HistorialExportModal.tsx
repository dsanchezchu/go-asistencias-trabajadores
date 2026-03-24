
import React from 'react'
import { Search, X, Calendar } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

interface HistorialExportModalProps {
    show: boolean
    onClose: () => void
    exportSearch: string
    setExportSearch: (val: string) => void
    trabajadoresRaw: { id: number; nombre: string; dni: string }[]
    selectedIds: Set<number>
    setSelectedIds: (ids: Set<number>) => void
    view?: 'lista' | 'gantt'
    onExport: (mode: 'seleccion' | 'profesional') => void
}

const HistorialExportModal = ({
    show,
    onClose,
    exportSearch,
    setExportSearch,
    trabajadoresRaw,
    selectedIds,
    setSelectedIds,
    view,
    onExport
}: HistorialExportModalProps) => {
    if (!show) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
            <Card className="relative w-full max-w-lg bg-base-100 border-base-300 rounded-3xl overflow-hidden shadow-2xl animate-scale-in p-0! my-auto mx-auto border! ring-1 ring-white/10">
                <div className="p-6 border-b border-base-300 flex justify-between items-center bg-base-200/50">
                    <div>
                        <h3 className="text-sm font-black text-foreground uppercase tracking-widest italic">Panel de Exportación</h3>
                        <p className="text-[9px] text-foreground/50 font-bold uppercase tracking-widest mt-0.5">Reportes Profesionales de Asistencia</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-base-300 rounded-xl transition-colors text-foreground/40 hover:text-foreground">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-5">
                    <div className="relative flex items-center mb-5">
                        <Search className="absolute left-4 text-foreground/30" size={14} />
                        <input
                            type="text"
                            placeholder="Filtrar por nombre o DNI..."
                            className="w-full h-11 pl-11 bg-base-200/50 border border-base-300 rounded-2xl text-foreground font-medium outline-none text-xs focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-foreground/20"
                            value={exportSearch}
                            onChange={(e) => setExportSearch(e.target.value)}
                        />
                    </div>

                    <div className="max-h-[40vh] overflow-y-auto custom-scrollbar space-y-1 pr-1 mb-6">
                        {trabajadoresRaw
                            .filter(p => (p.nombre?.toLowerCase() || '').includes(exportSearch.toLowerCase()) || (p.dni || '').includes(exportSearch))
                            .map(p => (
                                <div
                                    key={p.id}
                                    onClick={() => {
                                        const next = new Set(selectedIds)
                                        if (next.has(p.id)) next.delete(p.id)
                                        else next.add(p.id)
                                        setSelectedIds(next)
                                    }}
                                    className={`flex items-center gap-4 p-3.5 rounded-2xl cursor-pointer transition-all border ${selectedIds.has(p.id) ? 'bg-primary/10 border-primary/30' : 'hover:bg-base-200/60 border-transparent'}`}
                                >
                                    <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${selectedIds.has(p.id) ? 'bg-primary border-primary' : 'border-base-300'}`}>
                                        {selectedIds.has(p.id) && <X size={12} className="text-white" />}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <div className={`text-xs font-black truncate ${selectedIds.has(p.id) ? 'text-primary' : 'text-foreground'}`}>{p.nombre}</div>
                                        <div className="text-[8px] text-foreground/40 font-black tracking-widest uppercase">Documento: {p.dni}</div>
                                    </div>
                                </div>
                            ))}
                    </div>

                    <div className="flex flex-col gap-3">
                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                onClick={() => setSelectedIds(new Set(trabajadoresRaw.map(p => p.id)))}
                                variant="ghost"
                                className="h-11 text-[9px] font-black uppercase tracking-widest border-base-300 border bg-base-100 rounded-2xl shadow-sm"
                            >
                                Seleccionar Todos
                            </Button>
                            <Button
                                onClick={() => setSelectedIds(new Set())}
                                variant="ghost"
                                className="h-11 text-[9px] font-black uppercase tracking-widest border-base-300 border bg-base-100 rounded-2xl shadow-sm"
                            >
                                Limpiar Selección
                            </Button>
                        </div>
                        
                        <div className="h-px bg-base-300/50 my-2"></div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Button
                                onClick={() => onExport('profesional')}
                                variant="primary"
                                className={`h-12 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 rounded-2xl gap-2 border-none ${view === 'gantt' ? 'bg-linear-to-r from-primary to-accent' : 'bg-base-300 text-foreground/40 hover:text-foreground'}`}
                                disabled={selectedIds.size === 0}
                            >
                                <X size={14} className={view === 'gantt' ? '' : 'hidden'} /> {view === 'gantt' ? 'GENERAR GANTT SELECCIÓN' : 'REPORTE GANTT'}
                            </Button>
                            <Button
                                onClick={() => onExport('seleccion')}
                                variant="primary"
                                className={`h-12 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 rounded-2xl gap-2 border-none ${view === 'lista' ? 'bg-linear-to-r from-primary to-accent' : 'bg-base-300 text-foreground/40 hover:text-foreground'}`}
                                disabled={selectedIds.size === 0}
                            >
                                <Search size={14} /> {view === 'lista' ? 'GENERAR LISTADO SELECCIÓN' : 'REPORTE LISTADO'}
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    )
}

export default HistorialExportModal
