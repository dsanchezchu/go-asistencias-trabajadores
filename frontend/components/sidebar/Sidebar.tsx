'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
    LayoutDashboard,
    Users,
    CalendarCheck2,
    History,
    Database,
    LogOut,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    Menu,
    X,
    Shield,
    UserCheck
} from 'lucide-react'
import Swal from 'sweetalert2'

import { ThemeSwitcher } from '../shared/ThemeSwitcher'
import { demoService } from '@/services/demoService'
import { useDemoContext } from '@/context/DemoContext'
import { useAdminFilter } from '@/context/AdminFilterContext'

const Sidebar = () => {
    const pathname = usePathname()
    const router = useRouter()
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [isMobileOpen, setIsMobileOpen] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [isRequestingAccess, setIsRequestingAccess] = useState(false)
    const [isResetting, setIsResetting] = useState(false) // Added missing state
    const { demoStatus, refreshDemoStatus } = useDemoContext()

    // Hook del filtro de admin (solo disponible para admin)
    const adminFilter = demoStatus?.role === 'admin' ? useAdminFilter() : null

    useEffect(() => {
        setMounted(true)
    }, [])

    // Construir elementos del menú dinámicamente
    const menuItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
        { name: 'Trabajadores', icon: Users, path: '/trabajadores' },
        { name: 'Pasar Asistencia', icon: CalendarCheck2, path: '/asistencias' },
        { name: 'Historial', icon: History, path: '/historial' },
        { name: 'Copia de Seguridad', icon: Database, path: '/backups' },
        // Solo agregar "Usuarios Demo" para administradores completos
        ...(demoStatus?.role === 'admin' ? [{ name: 'Usuarios Demo', icon: Shield, path: '/admin/demo-users' }] : []),
    ]

    const handleLogout = () => {
        localStorage.removeItem('token')
        router.push('/')
    }

    const handleRequestAccess = async () => {
        const result = await Swal.fire({
            title: 'Solicitar Acceso al Administrador',
            html: `
                <p class="text-sm">Esta solicitud incluye:</p>
                <ul class="text-left text-sm mt-2 space-y-1">
                    <li>• Tu información de usuario demo</li>
                    <li>• Estado actual de tu progreso</li>
                    <li>• Fecha de creación de la cuenta</li>
                </ul>
                <p class="mt-3 text-sm font-semibold">¿Deseas enviar la solicitud?</p>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, solicitar acceso',
            cancelButtonText: 'Cancelar'
        })

        if (result.isConfirmed) {
            setIsRequestingAccess(true)
            try {
                await demoService.requestAccess()
                await Swal.fire({
                    title: '¡Solicitud Enviada!',
                    text: 'Tu solicitud de acceso ha sido enviada al administrador. Te contactaremos pronto.',
                    icon: 'success'
                })
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
                Swal.fire({
                    title: 'Error',
                    text: errorMessage,
                    icon: 'error'
                })
            } finally {
                setIsRequestingAccess(false)
            }
        }
    }

    const handleResetDemo = async () => {
        const result = await Swal.fire({
            title: 'Reiniciar Demo',
            html: `
                <p class="text-sm">Esta acción eliminará:</p>
                <ul class="text-left text-sm mt-2 space-y-1">
                    <li>• Todos los trabajadores creados</li>
                    <li>• Todas las asistencias registradas</li>
                    <li>• Los contadores de la demo</li>
                </ul>
                <p class="mt-3 text-sm font-semibold">¿Deseas continuar?</p>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, reiniciar',
            cancelButtonText: 'Cancelar'
        })

        if (result.isConfirmed) {
            setIsResetting(true)
            try {
                const response = await demoService.reset()
                await Swal.fire({
                    title: 'Demo Reiniciada',
                    text: `Se eliminaron ${response.trabajadores_eliminados} trabajador(es). Puedes comenzar de nuevo.`,
                    icon: 'success'
                })
                // Refresh demo status
                await refreshDemoStatus()
                // Refresh admin filter dropdown counters
                if (adminFilter) {
                    await adminFilter.fetchDemoUsers()
                }
                router.refresh()
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
                Swal.fire({
                    title: 'Error',
                    text: errorMessage,
                    icon: 'error'
                })
            } finally {
                setIsResetting(false)
            }
        }
    }

    if (!mounted) return null

    const isActive = (path: string) => pathname === path
    const isDemo = demoStatus?.is_demo === true

    const sidebarClasses = `
        h-screen z-50 transition-all duration-300 ease-in-out shrink-0
        ${isCollapsed ? 'w-20' : 'w-64'}
        ${isMobileOpen ? 'fixed inset-y-0 left-0 translate-x-0' : 'fixed inset-y-0 left-0 -translate-x-full lg:relative lg:translate-x-0'}
        bg-base-100/95 border-r border-base-300 shadow-xl
    `

    return (
        <>
            {/* Mobile Toggle */}
            <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="lg:hidden fixed top-3 left-3 z-60 p-2 rounded-xl bg-primary text-white shadow-lg"
            >
                {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Sidebar Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            <aside className={sidebarClasses}>
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className={`p-4 flex items-center ${isCollapsed ? 'flex-col gap-4' : 'justify-between'}`}>
                        {isCollapsed ? (
                            <div className="p-1 rounded-xl bg-base-200 border border-base-300 flex items-center justify-center shadow-sm">
                                <img src="/favicon.ico" alt="Go Asistencias" className="w-7 h-7" />
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 animate-fade-in pl-2">
                                <div className="p-1 rounded-xl bg-base-200 border border-base-300 flex items-center justify-center shadow-sm">
                                    <img src="/favicon.ico" alt="Go Asistencias" className="w-7 h-7" />
                                </div>
                                <span className="font-black text-[11px] text-foreground tracking-widest uppercase leading-tight">ASISTENCIAS<br/>GO ASISTENCIAS</span>
                            </div>
                        )}
                        <div className={`flex items-center gap-2 ${isCollapsed ? 'flex-col' : ''}`}>
                            <ThemeSwitcher />
                            <button
                                onClick={() => setIsCollapsed(!isCollapsed)}
                                className="hidden lg:flex p-2 rounded-xl bg-base-200 hover:bg-base-300 text-foreground/50 transition-colors border border-base-300"
                            >
                                {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Demo Badge */}
                    {isDemo && !isCollapsed && (
                        <div className="mx-3 mb-2 px-3 py-2 rounded-xl bg-warning/10 border border-warning/30">
                            <p className="text-[9px] font-black text-warning uppercase tracking-widest">Modo Demo</p>
                            <div className="space-y-1">
                                <p className="text-[8px] text-warning/70">
                                    {demoStatus?.demo_expired
                                        ? 'Demo expirada'
                                        : `${demoStatus?.trabajadores_actuales || 0}/${demoStatus?.limite_trabajadores || 1} trabajadores`
                                    }
                                </p>
                                <p className="text-[8px] text-warning/70">
                                    {demoStatus?.demo_asistencias_creadas || 0}/{demoStatus?.limite_asistencias || 3} asistencias
                                </p>
                                <p className="text-[8px] text-warning/70">
                                    {demoStatus?.demo_backups_creados || 0}/{demoStatus?.limite_backups || 1} backups
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Admin Filter */}
                    {demoStatus?.role === 'admin' && !isCollapsed && adminFilter && (
                        <div className="mx-3 mb-4 px-3 py-3 rounded-xl bg-primary/10 border border-primary/30">
                            <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-2">Filtrar por Usuario</p>
                            <select
                                value={adminFilter.selectedDemoUser?.id || ''}
                                onChange={(e) => {
                                    const userId = e.target.value
                                    if (userId === '') {
                                        adminFilter.setSelectedDemoUser(null)
                                    } else {
                                        const user = adminFilter.demoUsers.find(u => u.id === parseInt(userId))
                                        adminFilter.setSelectedDemoUser(user || null)
                                    }
                                }}
                                className="w-full px-2 py-1 text-[10px] rounded-lg bg-base-200 border border-base-300 text-base-content focus:border-primary focus:outline-none"
                            >
                                <option value="">Ver todos los usuarios</option>
                                {adminFilter.demoUsers.map(user => (
                                    <option key={user.id} value={user.id}>
                                        {user.username} ({user.demo_trabajadores_creados}/1 trabajadores)
                                    </option>
                                ))}
                            </select>
                            {adminFilter.selectedDemoUser && (
                                <div className="mt-2 text-[8px] text-primary/70">
                                    Filtrando: {adminFilter.selectedDemoUser.username}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Navigation */}
                    <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto custom-scrollbar">
                        {menuItems.map((item) => (
                            <Link
                                key={item.path}
                                href={item.path}
                                onClick={() => setIsMobileOpen(false)}
                                className={`
                                    flex items-center gap-3 py-2.5 rounded-xl font-bold text-xs transition-all duration-200 group
                                    ${isCollapsed ? 'justify-center px-0' : 'px-4'}
                                    ${isActive(item.path)
                                        ? 'bg-primary text-white shadow-lg shadow-primary/25 scale-[1.02]'
                                        : 'text-foreground/50 hover:text-foreground hover:bg-base-200'}
                                `}
                            >
                                <item.icon
                                    size={20}
                                    className={`shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive(item.path) ? 'text-white' : 'text-foreground/40 group-hover:text-foreground'}`}
                                />
                                {!isCollapsed && (
                                    <span className="truncate animate-fade-in uppercase tracking-widest text-[9px] font-black">{item.name}</span>
                                )}
                                {isActive(item.path) && !isCollapsed && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                )}
                            </Link>
                        ))}
                    </nav>

                    {/* User Profile / Footer */}
                    <div className="p-4 border-t border-base-300">
                        <Link
                            href="/profile"
                            className={`flex items-center gap-3 p-2.5 rounded-xl bg-base-200/50 mb-3 transition-all hover:bg-base-200 group ${isCollapsed ? 'justify-center px-0' : ''}`}
                        >
                            <div className="w-9 h-9 shrink-0 rounded-xl bg-base-300 flex items-center justify-center text-foreground/60 border border-base-300 font-black text-xs group-hover:scale-105 transition-transform shadow-sm">
                                AD
                            </div>
                            {!isCollapsed && (
                                <div className="animate-fade-in overflow-hidden">
                                    <p className="text-[11px] font-black text-foreground truncate">
                                        {isDemo ? 'Demo' : 'Administrador'}
                                    </p>
                                    <p className="text-[8px] text-foreground/40 font-black uppercase tracking-widest leading-none">
                                        {demoStatus?.role || 'Access System'}
                                    </p>
                                </div>
                            )}
                        </Link>

                        {/* Button para usuarios demo */}
                        {isDemo && (
                            <button
                                onClick={handleRequestAccess}
                                disabled={isRequestingAccess}
                                className={`
                                    flex items-center gap-3 w-full py-2.5 rounded-xl font-black text-[9px]
                                    uppercase tracking-widest text-primary hover:text-primary
                                    hover:bg-primary/10 transition-all group mb-2
                                    ${isCollapsed ? 'justify-center px-0' : 'px-4'}
                                    ${isRequestingAccess ? 'opacity-50 cursor-not-allowed' : ''}
                                `}
                            >
                                <UserCheck
                                    size={18}
                                    className={`shrink-0 transition-transform duration-500 ${isRequestingAccess ? 'animate-pulse' : 'group-hover:scale-110'}`}
                                />
                                {!isCollapsed && <span className="animate-fade-in">SOLICITAR ACCESO</span>}
                            </button>
                        )}

                        <button
                            onClick={handleLogout}
                            className={`
                                flex items-center gap-3 w-full py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest text-foreground/40 hover:text-red-500 hover:bg-red-500/10 transition-all group
                                ${isCollapsed ? 'justify-center px-0' : 'px-4'}
                            `}
                        >
                            <LogOut size={18} className="shrink-0 group-hover:translate-x-1 transition-transform" />
                            {!isCollapsed && <span className="animate-fade-in">SALIR</span>}
                        </button>
                    </div>
                </div>
            </aside>
        </>
    )
}

export default Sidebar
