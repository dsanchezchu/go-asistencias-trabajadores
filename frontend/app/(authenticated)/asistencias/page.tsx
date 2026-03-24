'use client'

import { useState } from 'react'
import { Calendar as CalendarIcon, Save, Loader2, Users } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import PageHeader from '@/components/shared/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import { useAsistenciaDiaria } from '@/hooks/useAsistenciaDiaria'
import StatBox from '@/components/asistencias/StatBox'
import SearchBar from '@/components/shared/SearchBar'
import AsistenciaList from '@/components/asistencias/AsistenciaList'
import { getAsistenciaStats } from '@/hooks/useAsistenciaStats'
import { useDemoContext } from '@/context/DemoContext'
import { useAdminFilter } from '@/context/AdminFilterContext'


export default function AsistenciaDiaria() {
    const { demoStatus } = useDemoContext()
    const isAdmin = demoStatus?.role === 'admin'
    const adminFilter = isAdmin ? useAdminFilter() : null

    const {
        fecha, setFecha,
        loading,
        trabajadores,
        tempStates,
        alreadyMarked,
        updateTempState,
        discardChanges,
        getEstado,
        handleSave,
        saving,
        initialStates
    } = useAsistenciaDiaria()

    const [searchTerm, setSearchTerm] = useState('')

    // Para asistencias, el filtrado ya se hace en el backend
    // Los trabajadores son filtrados por admin_id en backend
    const filtered = trabajadores.filter(p =>
        p.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.dni?.includes(searchTerm)
    )

    // Usar helper modular para stats
    const globalCounts = getAsistenciaStats(trabajadores, getEstado)

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-40">
            <Loader2 className="animate-spin text-primary mb-3" size={32} />
            <p className="text-foreground/40 font-black tracking-widest text-[9px] uppercase animate-pulse">Sincronizando registros...</p>
        </div>
    )

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header */}
            <PageHeader title="Control Diario" subtitle="Registro de asistencia operativa">
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="h-9 px-6 text-[10px] font-black uppercase tracking-widest rounded-3xl!"
                    variant="primary"
                    icon={saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                >
                    {saving ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
                </Button>
            </PageHeader>

            {/* Mensaje de filtro activo */}
            {isAdmin && adminFilter?.selectedDemoUser && (
                <div className="bg-primary/10 border border-primary/30 rounded-xl p-4">
                    <p className="text-sm text-primary">
                        <span className="font-bold">Filtro activo:</span> Registrando asistencias para trabajadores de {adminFilter.selectedDemoUser.username}
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {/* Date Picker */}
                <Card className="flex flex-col justify-center bg-base-200 border-base-300 p-4! rounded-2xl!">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="bg-primary p-2 rounded-lg">
                            <CalendarIcon className="text-white" size={12} />
                        </div>
                        <p className="text-foreground/40 text-[8px] font-black uppercase tracking-widest">Fecha Consulta</p>
                    </div>
                    <input
                        type="date"
                        className="bg-base-100 border border-base-300 text-foreground font-black text-xs p-2 rounded-lg outline-none focus:border-primary transition-all cursor-pointer w-full"
                        value={fecha}
                        onChange={(e) => setFecha(e.target.value)}
                    />
                    <p className="text-foreground/40 text-[7px] font-medium mt-1">
                        {(() => {
                            const [year, month, day] = fecha.split('-')
                            return `${day}-${month}-${year.slice(2)}`
                        })()}
                    </p>
                </Card>

                {/* Counter Stats */}
                <div className="lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatBox label="Presentes" count={globalCounts['presente'] || 0} color="text-green-500" />
                    <StatBox label="Tardanzas" count={globalCounts['tardanza'] || 0} color="text-amber-500" />
                    <StatBox label="Justificados" count={globalCounts['justificado'] || 0} color="text-blue-500" />
                    <StatBox label="Ausentes" count={globalCounts['ausente'] || 0} color="text-red-500" />
                </div>
            </div>

            {/* Search Bar */}
            <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Buscar trabajador por nombre o DNI..." />

            {/* List */}
            <AsistenciaList
                trabajadores={filtered}
                getEstado={getEstado}
                updateTempState={updateTempState}
                tempStates={tempStates}
                alreadyMarked={alreadyMarked}
                discardChanges={discardChanges}
                initialStates={initialStates}
            />

            {filtered.length === 0 && !loading && (
                <EmptyState icon={Users} message="No hay trabajadores registrados" />
            )}
        </div>
    )
}
