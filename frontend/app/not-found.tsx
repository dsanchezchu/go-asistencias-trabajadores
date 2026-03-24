'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Home, ArrowLeft, Search, Users, CalendarCheck2, Database } from 'lucide-react'
import { useEffect, useState } from 'react'
import { BASE_PATH } from '@/config'

export default function NotFound() {
    const router = useRouter()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const quickLinks = [
        { name: 'Dashboard', icon: Home, path: '/dashboard', description: 'Volver al inicio' },
        { name: 'Trabajadores', icon: Users, path: '/trabajadores', description: 'Gestión de personal' },
        { name: 'Asistencias', icon: CalendarCheck2, path: '/asistencias', description: 'Marcar asistencia diaria' },
        { name: 'Copias de Seguridad', icon: Database, path: '/backups', description: 'Descargar respaldos' }
    ]

    if (!mounted) return null

    return (
        <div className="min-h-screen bg-gradient-to-br from-base-100 via-base-200/50 to-base-300/30 flex items-center justify-center p-4">
            {/* Background Pattern */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-secondary/5 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/3 rounded-full blur-3xl"></div>
            </div>

            <div className="relative max-w-4xl mx-auto text-center space-y-8">
                {/* Logo & Brand */}
                <div className="flex items-center justify-center gap-3 mb-8 animate-fade-in">
                    <div className="p-3 rounded-2xl bg-base-200 border border-base-300 flex items-center justify-center shadow-xl">
                        <img src={`${BASE_PATH}/favicon.ico`} alt="Go Asistencias" className="w-10 h-10" />
                    </div>
                    <div className="text-left">
                        <h1 className="font-black text-lg text-foreground tracking-widest uppercase leading-tight">GO ASISTENCIAS</h1>
                        <p className="font-black text-sm text-foreground/60 tracking-widest uppercase leading-none">SISTEMA DE GESTIÓN</p>
                    </div>
                </div>

                {/* 404 Error */}
                <div className="space-y-6 animate-fade-in animation-delay-200">
                    <div className="relative">
                        <h2 className="text-8xl lg:text-9xl font-black text-primary/20 select-none">404</h2>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Search className="w-16 h-16 text-primary/40 animate-pulse" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-2xl lg:text-3xl font-black text-foreground uppercase tracking-wider">
                            Página No Encontrada
                        </h3>
                        <p className="text-base lg:text-lg text-foreground/60 max-w-2xl mx-auto leading-relaxed">
                            Lo sentimos, la página que buscas no existe o ha sido movida.
                            Utiliza los enlaces de abajo para navegar a una sección disponible.
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in animation-delay-400">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-3 px-6 py-3 rounded-xl bg-primary text-white font-black text-sm uppercase tracking-widest hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                    >
                        <ArrowLeft size={18} />
                        Volver Atrás
                    </button>

                    <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-6 py-3 rounded-xl bg-base-200 text-foreground font-black text-sm uppercase tracking-widest hover:bg-base-300 transition-all duration-200 border border-base-300 hover:scale-105"
                    >
                        <Home size={18} />
                        Ir al Dashboard
                    </Link>
                </div>

                {/* Quick Navigation */}
                <div className="mt-12 animate-fade-in animation-delay-600">
                    <h4 className="text-sm font-black text-foreground/60 uppercase tracking-widest mb-6">
                        Navegación Rápida
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
                        {quickLinks.map((link, index) => (
                            <Link
                                key={link.path}
                                href={link.path}
                                className="group p-6 rounded-2xl bg-base-100 border border-base-300 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 hover:scale-105 hover:shadow-xl"
                                style={{ animationDelay: `${800 + index * 100}ms` }}
                            >
                                <div className="flex flex-col items-center text-center space-y-3">
                                    <div className="p-3 rounded-xl bg-base-200 group-hover:bg-primary/10 transition-colors duration-300">
                                        <link.icon size={24} className="text-foreground/60 group-hover:text-primary transition-colors duration-300" />
                                    </div>
                                    <div className="space-y-1">
                                        <h5 className="font-black text-sm text-foreground uppercase tracking-wider group-hover:text-primary transition-colors duration-300">
                                            {link.name}
                                        </h5>
                                        <p className="text-xs text-foreground/50 font-medium">
                                            {link.description}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="pt-8 border-t border-base-300/50 animate-fade-in animation-delay-1000">
                    <p className="text-xs text-foreground/40 font-medium">
                        Sistema de Gestión de Asistencias © {new Date().getFullYear()} Go Asistencias
                    </p>
                </div>
            </div>

            <style jsx>{`
                @keyframes fade-in {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .animate-fade-in {
                    animation: fade-in 0.6s ease-out forwards;
                    opacity: 0;
                }

                .animation-delay-200 {
                    animation-delay: 200ms;
                }

                .animation-delay-400 {
                    animation-delay: 400ms;
                }

                .animation-delay-600 {
                    animation-delay: 600ms;
                }

                .animation-delay-1000 {
                    animation-delay: 1000ms;
                }
            `}</style>
        </div>
    )
}