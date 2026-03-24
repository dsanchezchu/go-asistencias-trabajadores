'use client'

import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import GanttChart from '@/components/gantt/GanttChart'
import PageHeader from '@/components/shared/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import PracticanteAvatar from '@/components/shared/PracticanteAvatar'
import EmptyState from '@/components/shared/EmptyState'
import { useHistorialAsistencia } from '@/hooks/useHistorialAsistencia'
import HistorialFilters from '@/components/historial/HistorialFilters'
import HistorialTable from '@/components/historial/HistorialTable'
import HistorialHeaderActions from '@/components/historial/HistorialHeaderActions'
import HistorialExportModal from '@/components/historial/HistorialExportModal'
import { useDemoContext } from '@/context/DemoContext'
import { useAdminFilter } from '@/context/AdminFilterContext'

const HistorialPage = () => {
    const { demoStatus } = useDemoContext()
    const isAdmin = demoStatus?.role === 'admin'
    const adminFilter = isAdmin ? useAdminFilter() : null

    const {
        filteredAsistencias,
        totalItems,
        currentPage,
        setCurrentPage,
        totalPages,
        trabajadoresRaw,
        loading,
        searchTerm, setSearchTerm,
        filterEstado, setFilterEstado,
        view, setView,
        selectedIds, setSelectedIds,
        showExportModal, setShowExportModal,
        exportSearch, setExportSearch,
        printRef,
        reload,
        exportToPDF
    } = useHistorialAsistencia()

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            {/* Header */}
            <PageHeader title="Bitácora Global" subtitle="Auditoría y control de cronogramas">
                <HistorialHeaderActions
                    view={view}
                    setView={setView}
                    exportToPDF={exportToPDF}
                    onOpenExportModal={() => {
                        setSelectedIds(new Set())
                        setShowExportModal(true)
                    }}
                />
            </PageHeader>

            {/* Mensaje de filtro activo */}
            {isAdmin && adminFilter?.selectedDemoUser && (
                <div className="bg-primary/10 border border-primary/30 rounded-xl p-4">
                    <p className="text-sm text-primary">
                        <span className="font-bold">Filtro activo:</span> Mostrando historial de {adminFilter.selectedDemoUser.username}
                    </p>
                </div>
            )}

            {/* Filters */}
            <HistorialFilters
                view={view}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filterEstado={filterEstado}
                setFilterEstado={setFilterEstado}
                reload={reload}
            />

            {/* Content area */}
            <div ref={printRef} className="space-y-6">
                {view === 'gantt' ? (
                    <GanttChart data={trabajadoresRaw} />
                ) : (
                    <HistorialTable
                        view={view}
                        loading={loading}
                        filteredAsistencias={filteredAsistencias}
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}
                        totalPages={totalPages}
                        totalItems={totalItems}
                    />
                )}
            </div>

            {/* Selection Modal */}
            <HistorialExportModal
                show={showExportModal}
                onClose={() => setShowExportModal(false)}
                exportSearch={exportSearch}
                setExportSearch={setExportSearch}
                trabajadoresRaw={trabajadoresRaw}
                selectedIds={selectedIds}
                setSelectedIds={setSelectedIds}
                view={view}
                onExport={exportToPDF}
            />
        </div>
    )
}

export default HistorialPage
