'use client'
import { useState, useEffect, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Swal from 'sweetalert2'
import { FileSpreadsheet } from 'lucide-react'
import Button from '@/components/ui/Button'
import PageHeader from '@/components/shared/PageHeader'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import { dashboardService } from '@/services/dashboardService'
import ScoreCards from '@/components/dashboard/ScoreCards'
import TrabajadoresTable from '@/components/dashboard/TrabajadoresTable'
import QuickActions from '@/components/dashboard/QuickActions'
import { useDemoContext } from '@/context/DemoContext'
import { useAdminFilter } from '@/context/AdminFilterContext'

// Dynamic import for the chart to reduce initial bundle size
const PerformanceChart = dynamic(() => import('@/components/dashboard/PerformanceChart'), {
    ssr: false,
    loading: () => <div className="h-full min-h-[300px] flex items-center justify-center bg-base-100/50 rounded-2xl animate-pulse">Cargando gráfico...</div>
})

export default function DashboardClient() {
    const { demoStatus } = useDemoContext()
    const isAdmin = demoStatus?.role === 'admin'
    const adminFilter = isAdmin ? useAdminFilter() : null

    const { trabajadores, loading, error } = useDashboardStats()
    const [selectedId, setSelectedId] = useState<number | null>(null)

    // El hook useDashboardStats ya se encarga de filtrar en el backend 
    // cuando detecta un cambio en adminFilter.selectedDemoUser.
    const filteredTrabajadores = trabajadores

    // Set initial selected trabajador
    useEffect(() => {
        if (!loading && filteredTrabajadores.length > 0 && selectedId === null) {
            setSelectedId(filteredTrabajadores[0].id)
        }
    }, [loading, filteredTrabajadores, selectedId])

    const selectedTrabajador = useMemo(() =>
        filteredTrabajadores.find(t => t.id === selectedId),
    [filteredTrabajadores, selectedId])

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <p className="text-error font-bold">{error}</p>
                <Button onClick={() => window.location.reload()}>Reintentar</Button>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <PageHeader title="Resumen General" subtitle="Panel de Control Operativo" />

            {/* Mensaje de filtro activo */}
            {isAdmin && adminFilter?.selectedDemoUser && (
                <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 mb-4">
                    <p className="text-sm text-primary">
                        <span className="font-bold">Filtro activo:</span> Mostrando datos de {adminFilter.selectedDemoUser.username}
                    </p>
                </div>
            )}

            <ScoreCards trabajadores={filteredTrabajadores} />

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3">
                    <TrabajadoresTable
                        trabajadores={filteredTrabajadores}
                        loading={loading}
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                    />
                </div>
                <div className="lg:col-span-2">
                    <PerformanceChart selectedTrabajador={selectedTrabajador} />
                </div>
            </div>

            <QuickActions />
        </div>
    )
}
