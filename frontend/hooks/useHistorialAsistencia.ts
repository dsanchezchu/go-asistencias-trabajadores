import { useState, useEffect, useRef, useCallback } from 'react'
import { historialService } from '@/services/historialService'
import { useDemoContext } from '@/context/DemoContext'
import { useAdminFilter } from '@/context/AdminFilterContext'
import { AsistenciaHistorial } from '../types'

export function useHistorialAsistencia() {
    const { demoStatus } = useDemoContext()
    const isAdmin = demoStatus?.role === 'admin'
    const adminFilter = isAdmin ? useAdminFilter() : null
    const [asistencias, setAsistencias] = useState<AsistenciaHistorial[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterEstado, setFilterEstado] = useState('todos')
    const [view, setView] = useState<'lista' | 'gantt'>('lista')
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
    const [showExportModal, setShowExportModal] = useState(false)
    const [exportSearch, setExportSearch] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10
    const printRef = useRef<HTMLDivElement>(null)

    const [trabajadoresRaw, setTrabajadoresRaw] = useState<{ id: number; nombre: string; dni: string; asistencias: AsistenciaHistorial[] }[]>([])

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            // Pass filter_admin_id if a demo user is selected
            const filterAdminId = adminFilter?.selectedDemoUser?.id?.toString()
            const data = await historialService.getAsistencias(filterAdminId)
            if (Array.isArray(data)) {
                const computed = data.map((a: any) => ({
                    ...a,
                    nombre: a.nombre || `${a.nombres || ''} ${a.apellido_paterno || ''} ${a.apellido_materno || ''}`.trim()
                }))
                setAsistencias(computed)

                const unique = new Map<number, { id: number; nombre: string; dni: string; asistencias: AsistenciaHistorial[] }>()
                computed.forEach((a: AsistenciaHistorial) => {
                    const tid = a.trabajador_id || (a as any).practicante_id
                    if (!unique.has(tid)) {
                        unique.set(tid, {
                            id: tid,
                            nombre: a.nombre,
                            dni: a.dni,
                            asistencias: []
                        })
                    }
                    unique.get(tid)!.asistencias.push(a)
                })
                setTrabajadoresRaw(Array.from(unique.values()))
            }
        } catch (error) {
            console.error('Error fetching historial:', error)
        } finally {
            setLoading(false)
        }
    }, [adminFilter?.selectedDemoUser?.id])

    useEffect(() => {
        fetchData()
    }, [fetchData, adminFilter?.selectedDemoUser])

    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm, filterEstado])

    const filteredAsistencias = asistencias.filter(a => {
        const matchSearch = a.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || a.dni?.includes(searchTerm)
        const matchEstado = filterEstado === 'todos' || a.estado === filterEstado
        return matchSearch && matchEstado
    })

    const totalPages = Math.ceil(filteredAsistencias.length / itemsPerPage)
    const paginatedAsistencias = filteredAsistencias.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    const exportToPDF = async (mode: 'todos' | 'seleccion' | 'profesional') => {
        const [jsPDF, autoTable]: any = await Promise.all([
            import('jspdf').then(m => m.default),
            import('jspdf-autotable').then(m => m.default)
        ])

        const BRAND_COLOR: [number, number, number] = [14, 22, 41] 
        const ACCENT_COLOR: [number, number, number] = [79, 70, 229]

        // Logo Helper
        const getLogoBase64 = async (): Promise<string | null> => {
            try {
                return new Promise((resolve) => {
                    const img = new Image()
                    img.crossOrigin = 'Anonymous'
                    img.src = '/favicon.ico'
                    img.onload = () => {
                        const canvas = document.createElement('canvas')
                        canvas.width = img.width
                        canvas.height = img.height
                        const ctx = canvas.getContext('2d')
                        ctx?.drawImage(img, 0, 0)
                        resolve(canvas.toDataURL('image/png'))
                    }
                    img.onerror = () => resolve(null)
                })
            } catch { return null }
        }

        const logoBase64 = await getLogoBase64()

        const addHeader = (doc: any, title: string, pageNumber: number) => {
            const pdfWidth = doc.internal.pageSize.getWidth()
            doc.setFillColor(14, 22, 41)
            doc.rect(0, 0, pdfWidth, 35, 'F')
            
            doc.setFillColor(79, 70, 229)
            doc.rect(pdfWidth - 45, 0, 45, 35, 'F')
            doc.setFillColor(129, 140, 248)
            doc.triangle(pdfWidth - 45, 0, pdfWidth - 45, 35, pdfWidth - 80, 0, 'F')

            if (logoBase64) {
                doc.addImage(logoBase64, 'PNG', 15, 7, 20, 20)
            } else {
                doc.setDrawColor(255, 255, 255)
                doc.setLineWidth(0.5)
                doc.circle(25, 17, 9, 'S')
                doc.setTextColor(255, 255, 255)
                doc.setFont('helvetica', 'bold')
                doc.setFontSize(14)
                doc.text("B", 23, 19)
            }

            doc.setFont('helvetica', 'bold')
            doc.setFontSize(16)
            doc.setTextColor(255, 255, 255)
            doc.text(title, 45, 16)
            
            doc.setFontSize(7)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(200, 200, 200)
            doc.text(`Sistema de Gestión de Asistencias Go Asistencias | Generado: ${new Date().toLocaleString('es-PE')}`, 45, 22)
            doc.text(`Página ${pageNumber}`, pdfWidth - 30, 31)
            
            return 45 // New Y position
        }

        const addLegend = (doc: any, y: number) => {
            doc.setFontSize(7)
            doc.setTextColor(14, 22, 41)
            doc.setFont('helvetica', 'bold')
            doc.text("LEYENDA:", 15, y)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(100)
            doc.text("P: Presente | T: Tardanza | A: Ausente | J: Justificado | .: Sin registro", 35, y)
        }

        if (mode === 'profesional' || view === 'gantt') {
            const doc = new jsPDF('l', 'mm', 'a4')
            let pageNum = 1
            let currentY = addHeader(doc, 'REPORTE GANTT DE ASISTENCIAS', pageNum)

            const targetPracticantes = mode === 'profesional'
                ? trabajadoresRaw.filter(p => selectedIds.has(p.id))
                : trabajadoresRaw
            
            if (targetPracticantes.length === 0) return

            // Group by Year and Month
            const yearGroups: Record<number, Record<number, string[]>> = {}
            asistencias.forEach(a => {
                const d = new Date(a.fecha)
                const y = d.getFullYear()
                const m = d.getMonth()
                const dateKey = a.fecha.split('T')[0]
                if (!yearGroups[y]) yearGroups[y] = {}
                if (!yearGroups[y][m]) yearGroups[y][m] = []
                if (!yearGroups[y][m].includes(dateKey)) yearGroups[y][m].push(dateKey)
            })

            const sortedYears = Object.keys(yearGroups).map(Number).sort((a,b) => b-a)
            const monthNames = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"]

            for (const year of sortedYears) {
                // Year Header
                if (currentY > 170) {
                    doc.addPage()
                    pageNum++
                    currentY = addHeader(doc, 'REPORTE GANTT DE ASISTENCIAS', pageNum)
                }
                doc.setFillColor(243, 244, 246)
                doc.rect(15, currentY, 267, 10, 'F')
                doc.setFontSize(12)
                doc.setTextColor(14, 22, 41)
                doc.setFont('helvetica', 'bold')
                doc.text(`GESTIÓN ANUAL ${year}`, 20, currentY + 7)
                currentY += 15

                const sortedMonths = Object.keys(yearGroups[year]).map(Number).sort((a,b) => b-a)
                for (const month of sortedMonths) {
                    const daysInMonth = yearGroups[year][month].sort()
                    if (daysInMonth.length === 0) continue

                    if (currentY > 150) {
                        doc.addPage()
                        pageNum++
                        currentY = addHeader(doc, 'REPORTE GANTT DE ASISTENCIAS', pageNum)
                    }

                    doc.setFontSize(9)
                    doc.setTextColor(79, 70, 229)
                    doc.setFont('helvetica', 'bold')
                    doc.text(`${monthNames[month]} - ${year}`, 15, currentY)
                    currentY += 4

                    const headRow = ['TRABAJADOR', ...daysInMonth.map(d => d.split('-')[2])]
                    const bodyRows = targetPracticantes.map(p => {
                        const row = [p.nombre]
                        daysInMonth.forEach(day => {
                            const asis = p.asistencias.find((a: any) => a.fecha.split('T')[0] === day)
                            row.push(asis ? asis.estado.charAt(0).toUpperCase() : '.')
                        })
                        return row
                    })

                    autoTable(doc, {
                        startY: currentY,
                        head: [headRow],
                        body: bodyRows,
                        theme: 'grid',
                        styles: { fontSize: 6.5, cellPadding: 1 },
                        headStyles: { fillColor: BRAND_COLOR, textColor: 255, halign: 'center' },
                        columnStyles: { 0: { fontStyle: 'bold', minCellWidth: 35, halign: 'left' } },
                        margin: { left: 15, right: 15 },
                        didParseCell: (data: any) => {
                            if (data.section === 'body' && data.column.index > 0) {
                                data.cell.styles.halign = 'center'
                                const val = data.cell.raw
                                if (val === 'P') { data.cell.styles.fillColor = [187, 247, 208]; data.cell.styles.textColor = [22, 101, 52] }
                                if (val === 'T') { data.cell.styles.fillColor = [254, 243, 199]; data.cell.styles.textColor = [180, 83, 9] }
                                if (val === 'A') { data.cell.styles.fillColor = [254, 226, 226]; data.cell.styles.textColor = [153, 27, 27] }
                                if (val === 'J') { data.cell.styles.fillColor = [224, 231, 255]; data.cell.styles.textColor = [55, 48, 163] }
                            }
                        }
                    })

                    currentY = (doc as any).lastAutoTable.finalY + 12
                }
                
                if (sortedMonths.length > 0) {
                    addLegend(doc, currentY - 5)
                    currentY += 5
                }
            }
            
            doc.save(`Reporte_Integrated_Gantt_${new Date().getTime()}.pdf`)
            setShowExportModal(false)
            return
        }

        // List Mode Export
        const doc = new jsPDF('p', 'mm', 'a4')
        let pageNum = 1
        let currentY = addHeader(doc, 'HISTORIAL DE ASISTENCIAS', pageNum)

        const dataToExport = mode === 'seleccion' && selectedIds.size > 0
            ? filteredAsistencias.filter(a => selectedIds.has(a.trabajador_id || (a as any).practicante_id))
            : filteredAsistencias

        autoTable(doc, {
            startY: currentY + 2,
            head: [['TRABAJADOR', 'DNI', 'FECHA', 'INGRESO', 'ESTADO']],
            body: dataToExport.map(a => [
                a.nombre,
                a.dni,
                new Date(a.fecha).toLocaleDateString('es-PE'),
                a.hora_ingreso || '-',
                a.estado.toUpperCase()
            ]),
            theme: 'striped',
            headStyles: { fillColor: BRAND_COLOR, textColor: 255 },
            styles: { fontSize: 8.5 },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            didParseCell: (data: any) => {
                if (data.column.index === 4 && data.section === 'body') {
                    const status = data.cell.raw as string
                    if (status === 'PRESENTE') data.cell.styles.textColor = [5, 150, 105]
                    if (status === 'TARDANZA') data.cell.styles.textColor = [217, 119, 6]
                    if (status === 'AUSENTE') data.cell.styles.textColor = [220, 38, 38]
                }
            }
        })

        doc.save(`Historial_Asistencia_Premium_${new Date().getTime()}.pdf`)
    }

    return {
        asistencias,
        filteredAsistencias: paginatedAsistencias,
        totalItems: filteredAsistencias.length,
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
        reload: fetchData,
        exportToPDF
    }
}
