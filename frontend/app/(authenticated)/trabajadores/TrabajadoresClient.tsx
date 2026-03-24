'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, Search, Users } from 'lucide-react'

import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import PageHeader from '@/components/shared/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import TrabajadorCard from '@/components/trabajadores/TrabajadorCard'
import { useTrabajadores } from '@/hooks/useTrabajadores'
import { useDemoContext } from '@/context/DemoContext'
import { useAdminFilter } from '@/context/AdminFilterContext'

export default function TrabajadoresClient() {
    const { demoStatus } = useDemoContext()
    const isAdmin = demoStatus?.role === 'admin'
    const adminFilter = isAdmin ? useAdminFilter() : null

    const { filtered, loading, searchTerm, setSearchTerm, deleteTrabajador, reload } = useTrabajadores()
    const router = useRouter()

    // Para trabajadores, el filtrado ya se hace en el backend basado en el usuario logueado
    // Los admin_prueba solo ven sus trabajadores, los admin completos ven todos
    // El filtro adicional del sidebar es redundante aquí, pero podríamos usarlo para filtrar en el frontend

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header */}
            <PageHeader
                title="Gestión de Talento"
                subtitle="Administración de perfiles y monitoreo"
            >
                <Button
                    onClick={() => router.push('/trabajadores/crear')}
                    variant="primary"
                    className="h-9 rounded-3xl! px-6 text-[10px] font-black uppercase tracking-widest"
                    icon={<UserPlus size={16} />}
                >
                    NUEVO PERFIL
                </Button>
            </PageHeader>

            {/* Mensaje de filtro activo */}
            {isAdmin && adminFilter?.selectedDemoUser && (
                <div className="bg-primary/10 border border-primary/30 rounded-xl p-4">
                    <p className="text-sm text-primary">
                        <span className="font-bold">Filtro activo:</span> Mostrando trabajadores de {adminFilter.selectedDemoUser.username}
                    </p>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <Card className="md:w-96 p-0! rounded-2xl overflow-hidden focus-within:border-primary/50 transition-colors">
                    <div className="relative flex items-center">
                        <Search className="absolute left-3 text-foreground/40" size={14} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o DNI..."
                            className="w-full h-9 pl-9 bg-transparent border-none text-foreground font-medium outline-none text-[11px]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </Card>
                <Card className="flex items-center gap-3 bg-base-100 border border-base-300 h-9 px-4 rounded-2xl group transition-all">
                    <span className="text-foreground/40 font-black text-[9px] uppercase tracking-widest">Activos</span>
                    <span className="text-primary font-black text-sm italic">{filtered.length}</span>
                </Card>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map(t => (
                    <TrabajadorCard
                        key={t.id}
                        trabajador={t}
                        onDelete={deleteTrabajador}
                    />
                ))}

                {filtered.length === 0 && !loading && (
                    <div className="col-span-full">
                        <EmptyState icon={Users} message="Sin resultados" />
                    </div>
                )}

                {loading && (
                    Array(8).fill(0).map((_, i) => (
                        <Card key={i} className="animate-pulse p-4! border-none bg-base-100/40 rounded-3xl!">
                            <div className="flex gap-3 mb-4 items-center">
                                <div className="w-12 h-12 bg-base-200 rounded-xl"></div>
                                <div className="space-y-2 flex-1">
                                    <div className="h-3 bg-base-200 rounded-full w-3/4"></div>
                                    <div className="h-2 bg-base-200 rounded-full w-1/2"></div>
                                </div>
                            </div>
                            <div className="space-y-2 border-t border-base-300 pt-3">
                                <div className="h-2.5 bg-base-200 rounded-full"></div>
                                <div className="h-2.5 bg-base-200 rounded-full w-2/3"></div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
