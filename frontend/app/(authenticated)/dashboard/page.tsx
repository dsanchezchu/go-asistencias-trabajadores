import { Metadata } from 'next'
import DashboardClient from './DashboardClient'

export const metadata: Metadata = {
    title: 'Dashboard | Go Asistencias',
    description: 'Resumen general de asistencias y rendimiento de trabajadores.',
}

export default function DashboardPage() {
    return <DashboardClient />
}
