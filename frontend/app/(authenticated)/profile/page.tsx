'use client'

import React from 'react'
import { useTheme } from '@/context/ThemeContext'
import PageHeader from '@/components/shared/PageHeader'
import Card from '@/components/ui/Card'
import { Sun, Moon, Check, User, Shield, Info } from 'lucide-react'

const ThemeToggle = () => {
    const { theme, setTheme } = useTheme()

    const themeOptions = [
        { id: 'light', name: 'Modo Claro', icon: Sun, desc: 'Interfaz luminosa y limpia para el día' },
        { id: 'dark', name: 'Modo Oscuro', icon: Moon, desc: 'Interfaz oscura para entornos con poca luz' }
    ] as const

    return (
        <Card className="p-8">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <Sun size={18} />
                </div>
                <div>
                    <h3 className="text-sm font-black text-foreground uppercase tracking-widest leading-none">Personalización</h3>
                    <p className="text-[10px] text-foreground/40 font-bold uppercase tracking-widest mt-1">Configura tu entorno visual</p>
                </div>
            </div>
            
            <div className="space-y-4">
                {themeOptions.map((option) => (
                    <button
                        key={option.id}
                        onClick={() => setTheme(option.id as any)}
                        className={`
                            w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all group
                            ${theme === option.id 
                                ? 'border-primary bg-primary/5 shadow-sm shadow-primary/5' 
                                : 'border-base-200 bg-base-100 hover:border-primary/20 hover:bg-base-200/50'}
                        `}
                    >
                        <div className="flex items-center gap-5">
                            <div className={`
                                p-3 rounded-2xl transition-all shadow-sm border
                                ${theme === option.id 
                                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                                    : 'bg-base-200 text-foreground/40 border-base-300'}
                            `}>
                                <option.icon size={22} />
                            </div>
                            <div className="text-left">
                                <p className={`font-black text-sm tracking-tight ${theme === option.id ? 'text-foreground' : 'text-foreground/70'}`}>{option.name}</p>
                                <p className="text-[10px] text-foreground/40 font-bold uppercase tracking-wide mt-0.5">{option.desc}</p>
                            </div>
                        </div>
                        {theme === option.id && (
                            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center animate-scale-in">
                                <Check size={16} className="text-white" />
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </Card>
    )
}

const ProfileInfo = () => {
    return (
        <div className="space-y-6">
            <Card className="p-10 relative overflow-hidden group">
                <div className="absolute -top-12 -right-12 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors"></div>
                
                <div className="flex flex-col items-center relative z-10">
                    <div className="relative mb-6">
                        <div className="w-28 h-28 rounded-3xl bg-linear-to-br from-primary to-accent flex items-center justify-center text-white font-black text-4xl shadow-2xl shadow-primary/30 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                            AD
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-white dark:bg-slate-900 border-4 border-slate-50 dark:border-slate-900 flex items-center justify-center text-green-500 shadow-lg">
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
                        </div>
                    </div>
                    <h2 className="text-2xl font-black text-foreground tracking-tight">Administrador</h2>
                    <div className="mt-2 flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                        <Shield size={12} className="text-primary" />
                        <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Acceso Total (Root)</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 mt-10">
                    <div className="p-4 rounded-2xl bg-base-200/50 border border-base-300 flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-base-100 border border-base-300 text-foreground/40"><User size={16} /></div>
                        <div>
                            <p className="text-[8px] text-foreground/40 font-black uppercase tracking-widest">Username</p>
                            <p className="text-sm font-black text-foreground">admin</p>
                        </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-base-200/50 border border-base-300 flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-base-100 border border-base-300 text-foreground/40"><Info size={16} /></div>
                        <div>
                            <p className="text-[8px] text-foreground/40 font-black uppercase tracking-widest">Estado de Cuenta</p>
                            <p className="text-sm font-black text-foreground">Activada / Verificada</p>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    )
}

export default function ProfilePage() {
    return (
        <div className="space-y-8 animate-fade-in max-w-5xl mx-auto pb-20">
            <PageHeader 
                title="Configuración Maestra" 
                subtitle="Gestión de identidad y preferencias del sistema"
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ThemeToggle />
                <ProfileInfo />
            </div>
        </div>
    )
}
