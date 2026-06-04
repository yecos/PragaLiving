import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jsPDF from 'jspdf'

const prisma = new PrismaClient()

function formatCOP(value: number): string {
  return '$' + Math.round(value).toLocaleString('es-CO')
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID de apartamento requerido' }, { status: 400 })
    }

    const apt = await prisma.apartment.findUnique({ where: { id } })

    if (!apt) {
      return NextResponse.json({ error: 'Apartamento no encontrado' }, { status: 404 })
    }

    // Brand colors
    const NEGRO: [number, number, number] = [17 / 255, 17 / 255, 17 / 255]
    const BRONCE: [number, number, number] = [139 / 255, 107 / 255, 75 / 255]
    const MARFIL: [number, number, number] = [245 / 255, 241 / 255, 234 / 255]
    const GRIS: [number, number, number] = [216 / 255, 209 / 255, 200 / 255]
    const VERDE: [number, number, number] = [75 / 255, 86 / 255, 70 / 255]

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageW = 210
    const margin = 20
    const contentW = pageW - margin * 2

    // Full page dark background
    doc.setFillColor(...NEGRO)
    doc.rect(0, 0, pageW, 297, 'F')

    // Top bronce accent line
    doc.setFillColor(...BRONCE)
    doc.rect(0, 0, pageW, 2, 'F')

    // Header
    let y = 18
    doc.setTextColor(...BRONCE)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('PRAGA LIVING', margin, y)

    doc.setTextColor(...GRIS)
    doc.setFontSize(7)
    doc.text('FICHA TÉCNICA', pageW - margin, y, { align: 'right' })

    // Divider line
    y += 6
    doc.setDrawColor(...BRONCE)
    doc.setLineWidth(0.3)
    doc.line(margin, y, pageW - margin, y)

    // Status badge
    y += 10
    const statusMap: Record<string, { label: string; color: [number, number, number] }> = {
      available: { label: 'DISPONIBLE', color: VERDE },
      reserved: { label: 'RESERVADO', color: BRONCE },
      sold: { label: 'VENDIDO', color: GRIS },
    }
    const st = statusMap[apt.status] || statusMap.available
    doc.setFillColor(...st.color)
    doc.roundedRect(margin, y - 3.5, 30, 6, 1, 1, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(6)
    doc.setFont('helvetica', 'bold')
    doc.text(st.label, margin + 15, y, { align: 'center' })

    // Apartment name
    y += 12
    doc.setTextColor(...MARFIL)
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.text(apt.name, margin, y)

    // Typology
    y += 7
    doc.setTextColor(...BRONCE)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(apt.typology.toUpperCase(), margin, y)

    // Area - large display
    y += 14
    doc.setTextColor(...BRONCE)
    doc.setFontSize(36)
    doc.setFont('helvetica', 'bold')
    doc.text(`${apt.area}`, margin, y)
    doc.setFontSize(14)
    doc.setTextColor(...GRIS)
    doc.text('m²', margin + doc.getTextWidth(`${apt.area}`) + 2, y)

    // Details table
    y += 14
    doc.setDrawColor(...BRONCE)
    doc.setLineWidth(0.15)
    doc.line(margin, y, pageW - margin, y)

    const details = [
      ['Habitaciones', apt.bedrooms === 0 ? 'Studio' : `${apt.bedrooms}`],
      ['Baños', `${apt.bathrooms}`],
      ['Piso', `${apt.floor}`],
      ['Vista', apt.view],
      ['Estado', st.label],
    ]

    y += 6
    details.forEach(([label, value]) => {
      doc.setTextColor(...GRIS)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.text(label.toUpperCase(), margin, y)

      doc.setTextColor(...MARFIL)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text(value, margin + 45, y)

      y += 7
      doc.setDrawColor(40, 40, 40)
      doc.setLineWidth(0.1)
      doc.line(margin, y - 2, pageW - margin, y - 2)
    })

    // Price section
    y += 4
    doc.setFillColor(...BRONCE.slice(0, 3).map(c => c * 0.15) as [number, number, number])
    doc.roundedRect(margin, y - 2, contentW, 18, 2, 2, 'F')
    doc.setDrawColor(...BRONCE)
    doc.setLineWidth(0.2)
    doc.roundedRect(margin, y - 2, contentW, 18, 2, 2, 'S')

    doc.setTextColor(...GRIS)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text('PRECIO', margin + 6, y + 4)

    doc.setTextColor(...BRONCE)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(formatCOP(apt.price), margin + 6, y + 12)

    doc.setTextColor(...GRIS)
    doc.setFontSize(6)
    doc.setFont('helvetica', 'normal')
    doc.text('COP', pageW - margin - 6, y + 12, { align: 'right' })

    // Features
    y += 24
    doc.setTextColor(...BRONCE)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('CARACTERÍSTICAS', margin, y)

    y += 5
    doc.setDrawColor(...BRONCE)
    doc.setLineWidth(0.15)
    doc.line(margin, y, margin + 30, y)

    y += 5
    let features: string[] = []
    if (apt.features) {
      try {
        features = JSON.parse(apt.features)
      } catch {
        features = []
      }
    }

    if (features.length > 0) {
      features.forEach((feat) => {
        if (y > 240) return
        doc.setTextColor(...BRONCE)
        doc.setFontSize(6)
        doc.text('◆', margin + 1, y)
        doc.setTextColor(...MARFIL)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.text(feat, margin + 6, y)
        y += 5.5
      })
    } else {
      doc.setTextColor(...GRIS)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'italic')
      doc.text('Consulte con un asesor para más detalles', margin, y)
      y += 6
    }

    // Footer
    const footerY = 275
    doc.setDrawColor(...BRONCE)
    doc.setLineWidth(0.3)
    doc.line(margin, footerY - 6, pageW - margin, footerY - 6)

    doc.setTextColor(...BRONCE)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('PRAGA LIVING', margin, footerY)

    doc.setTextColor(...GRIS)
    doc.setFontSize(6)
    doc.setFont('helvetica', 'normal')
    doc.text('Bogotá, Colombia', margin, footerY + 4)

    doc.setTextColor(...GRIS)
    doc.setFontSize(6)
    doc.text('+57 601 234 5678  |  info@pragaliving.com  |  www.pragaliving.com', pageW - margin, footerY, { align: 'right' })

    // Bottom bronce accent line
    doc.setFillColor(...BRONCE)
    doc.rect(0, 295, pageW, 2, 'F')

    // Return PDF
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="ficha-${apt.name.replace(/\s+/g, '-')}.pdf"`,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Error al generar PDF' }, { status: 500 })
  }
}
