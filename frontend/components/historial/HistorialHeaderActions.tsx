
import React from 'react'
import { FileDown, ListFilter, Search } from 'lucide-react'
import Button from '@/components/ui/Button'

interface HistorialHeaderActionsProps {
    view: 'lista' | 'gantt'
    setView: (view: 'lista' | 'gantt') => void
    exportToPDF: (mode: 'todos' | 'seleccion' | 'profesional') => void
    onOpenExportModal: () => void
}

const HistorialHeaderActions = ({ view, setView, exportToPDF, onOpenExportModal }: HistorialHeaderActionsProps) => {
    return (
        <>
            <div className="flex bg-base-100 p-1 rounded-xl border border-base-300 h-9">
                <button
                    onClick={() => setView('lista')}
                    className={`px-4 py-1.5 rounded-lg font-black text-[9px] tracking-widest transition-all ${view === 'lista' ? 'bg-primary text-white' : 'text-foreground/40'}`}
                >
                    LISTADO
                </button>
                <button
                    onClick={() => setView('gantt')}
                    className={`px-4 py-1.5 rounded-lg font-black text-[9px] tracking-widest transition-all ${view === 'gantt' ? 'bg-accent text-white' : 'text-foreground/40'}`}
                >
                    GANTT
                </button>
            </div>


            <div className="relative group/export">
                <Button
                    variant="primary"
                    className="h-9 px-6 text-[10px] font-black uppercase tracking-widest gap-2 bg-linear-to-r from-primary to-accent border-none shadow-xl shadow-primary/20"
                    icon={<FileDown size={14} />}
                >
                    {view === 'lista' ? 'EXPORTAR LISTADO' : 'OTRAS EXPORTACIONES'}
                </Button>
                {/* Dropdown Menu Container with bridge */}
                <div className="absolute right-0 top-full pt-1 w-56 opacity-0 translate-y-2 pointer-events-none group-hover/export:opacity-100 group-hover/export:translate-y-0 group-hover/export:pointer-events-auto transition-all z-50">
                    <div className="bg-base-100 border border-base-300 rounded-2xl shadow-2xl overflow-hidden p-1">
                        <button
                            onClick={() => exportToPDF('todos')}
                            className="w-full text-left p-3 px-4 text-[9px] font-black text-foreground/40 hover:text-foreground hover:bg-base-200 transition-all flex items-center gap-3 uppercase tracking-widest rounded-xl"
                        >
                            <div className="bg-primary/10 p-1.5 rounded-lg"><ListFilter size={12} className="text-primary" /></div>
                            Todo el Historial
                        </button>
                        <button
                            onClick={onOpenExportModal}
                            className="w-full text-left p-3 px-4 text-[9px] font-black text-foreground/40 hover:text-foreground hover:bg-base-200 transition-all flex items-center gap-3 uppercase tracking-widest rounded-xl"
                        >
                            <div className="bg-accent/10 p-1.5 rounded-lg"><Search size={12} className="text-accent" /></div>
                            Seleccionar Específicos
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default HistorialHeaderActions
