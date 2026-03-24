import { Metadata } from 'next'
import TrabajadoresClient from './TrabajadoresClient'

export const metadata: Metadata = {
    title: 'Gestión de Trabajadores | Go Asistencias',
    description: 'Administración de perfiles, horarios y seguimiento de trabajadores.',
}

export default function TrabajadoresPage() {
    return <TrabajadoresClient />
}
