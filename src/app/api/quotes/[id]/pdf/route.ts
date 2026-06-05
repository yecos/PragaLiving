import { NextRequest, NextResponse } from 'next/server'
import { jsPDF } from 'jspdf'
import { getLeads, getApartments } from '@/lib/data'

// In-memory quote store reference - must match the one in route.ts
// We import from the parent route by re-declaring the same data source
interface Quote {
  id: string
  number: string
  leadId: string
  apartmentId: string
  discount: number
  finalPrice: number
  paymentPlan: string
  notes: string
  validDays: number
  validUntil: string
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
  createdAt: string
  updatedAt: string
}

// We need to access the same in-memory store from the parent route
// Since modules are singletons in Next.js, we can import the quotes
// But since quotes are in a different module scope, we re-fetch from the API
// Instead, let's use a shared store approach

// Shared in-memory store (imported by both route files)
import { quotesStore } from '@/lib/quotes-store'

function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

// PRAGA brand colors
const NEGRO = [17, 17, 17] as [number, number, number]
const BRONCE = [139, 107, 75] as [number, number, number]
const MARFIL = [245, 241, 234] as [number, number, number]
const GRIS = [216, 209, 200] as [number, number, number]
const VERDE = [75, 86, 70] as [number, number, number]

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Find the quote
    const quote = quotesStore.find((q: Quote) => q.id === id)
    if (!quote) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 })
    }

    // Get related data
    const allLeads = await getLeads()
    const allApartments = await getApartments()
    const lead = allLeads.find(l => l.id === quote.leadId)
    const apartment = allApartments.find(a => a.id === quote.apartmentId)

    if (!lead || !apartment) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    // Generate PDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    const pageW = 210
    const pageH = 297
    const marginL = 20
    const marginR = 20
    const contentW = pageW - marginL - marginR
    let y = 0

    // ─── HEADER BACKGROUND ───
    doc.setFillColor(...NEGRO)
    doc.rect(0, 0, pageW, 52, 'F')

    // Bronce accent line
    doc.setFillColor(...BRONCE)
    doc.rect(0, 52, pageW, 1.5, 'F')

    // Logo text (since we can't easily embed images)
    y = 14
    doc.setTextColor(...MARFIL)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(28)
    doc.text('PRAGA', marginL, y + 8)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...BRONCE)
    doc.text('L I V I N G', marginL + 48, y + 8)

    // Subtitle
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...GRIS)
    doc.text('Cl. 133 Sur #49-94, Caldas, Antioquia', marginL, y + 14)
    doc.text('info@pragaliving.com  |  +57 604 444 0000', marginL, y + 19)

    // Quote title - right side
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(22)
    doc.setTextColor(...MARFIL)
    doc.text('COTIZACIÓN', pageW - marginR, y + 4, { align: 'right' })

    // Quote number and date - right side
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...BRONCE)
    doc.text(quote.number, pageW - marginR, y + 12, { align: 'right' })
    doc.setFontSize(8)
    doc.setTextColor(...GRIS)
    doc.text(`Fecha: ${formatDate(quote.createdAt)}`, pageW - marginR, y + 18, { align: 'right' })
    doc.text(`Válida hasta: ${formatDate(quote.validUntil)}`, pageW - marginR, y + 23, { align: 'right' })

    // ─── CLIENT & CONTACT SECTION ───
    y = 60

    // Client info box
    doc.setFillColor(...MARFIL)
    doc.roundedRect(marginL, y, contentW / 2 - 3, 36, 1.5, 1.5, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...BRONCE)
    doc.text('CLIENTE', marginL + 5, y + 7)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...NEGRO)
    doc.text(lead.name, marginL + 5, y + 14)

    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text(`Tel: ${lead.phone}`, marginL + 5, y + 20)
    doc.text(`Email: ${lead.email}`, marginL + 5, y + 26)

    // PRAGA contact box
    const contactX = marginL + contentW / 2 + 3
    doc.setFillColor(...MARFIL)
    doc.roundedRect(contactX, y, contentW / 2 - 3, 36, 1.5, 1.5, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...BRONCE)
    doc.text('CONTACTO PRAGA LIVING', contactX + 5, y + 7)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...NEGRO)
    doc.text('Asesor Comercial PRAGA', contactX + 5, y + 14)
    doc.setTextColor(100, 100, 100)
    doc.text('Tel: +57 604 444 0000', contactX + 5, y + 20)
    doc.text('Email: ventas@pragaliving.com', contactX + 5, y + 26)

    y += 44

    // ─── SECTION DIVIDER ───
    doc.setFillColor(...BRONCE)
    doc.rect(marginL, y, contentW, 0.5, 'F')
    y += 8

    // ─── APARTMENT DETAILS TABLE ───
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...NEGRO)
    doc.text('DETALLES DEL INMUEBLE', marginL, y)
    y += 8

    // Table header
    const tableHeaders = ['Unidad', 'Área (m²)', 'Tipología', 'Precio Base', 'Descuento', 'Precio Final']
    const colWidths = [28, 24, 38, 32, 28, 32]
    const tableX = marginL

    doc.setFillColor(...NEGRO)
    doc.rect(tableX, y, contentW, 8, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...MARFIL)

    let cx = tableX + 3
    for (let i = 0; i < tableHeaders.length; i++) {
      doc.text(tableHeaders[i], cx, y + 5.5)
      cx += colWidths[i]
    }
    y += 8

    // Table row
    doc.setFillColor(250, 248, 244)
    doc.rect(tableX, y, contentW, 10, 'F')

    // Bottom border
    doc.setDrawColor(...GRIS)
    doc.setLineWidth(0.2)
    doc.line(tableX, y + 10, tableX + contentW, y + 10)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...NEGRO)

    cx = tableX + 3
    doc.text(apartment.name, cx, y + 6.5)
    cx += colWidths[0]
    doc.text(`${apartment.area}`, cx, y + 6.5)
    cx += colWidths[1]
    doc.text(apartment.typology, cx, y + 6.5)
    cx += colWidths[2]
    doc.text(formatCOP(apartment.price), cx, y + 6.5)
    cx += colWidths[3]
    doc.setTextColor(...BRONCE)
    doc.text(quote.discount > 0 ? `-${formatCOP(quote.discount)}` : '—', cx, y + 6.5)
    cx += colWidths[4]

    // Final price - highlighted
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...VERDE)
    doc.text(formatCOP(quote.finalPrice), cx, y + 6.5)

    y += 16

    // ─── PAYMENT PLAN ───
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...NEGRO)
    doc.text('PLAN DE PAGO', marginL, y)
    y += 7

    doc.setFillColor(...MARFIL)
    doc.roundedRect(marginL, y, contentW, 14, 1.5, 1.5, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...BRONCE)
    doc.text(quote.paymentPlan, marginL + 5, y + 6)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    const planDescriptions: Record<string, string> = {
      'Contado': 'Pago único · Sin intereses · Descuento especial',
      'Crédito 5 años': 'Cuotas mensuales · Tasa preferencial · 60 meses',
      'Crédito 10 años': 'Cuotas mensuales · Tasa preferencial · 120 meses',
      'Crédito 15 años': 'Cuotas mensuales · Tasa preferencial · 180 meses',
      'Crédito 20 años': 'Cuotas mensuales · Tasa preferencial · 240 meses',
    }
    doc.text(planDescriptions[quote.paymentPlan] || 'Plan personalizado', marginL + 5, y + 11)

    y += 20

    // ─── NOTES ───
    if (quote.notes) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(...NEGRO)
      doc.text('NOTAS', marginL, y)
      y += 7

      doc.setFillColor(250, 248, 244)
      doc.roundedRect(marginL, y, contentW, 16, 1.5, 1.5, 'F')

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(80, 80, 80)

      const noteLines = doc.splitTextToSize(quote.notes, contentW - 10)
      doc.text(noteLines.slice(0, 3), marginL + 5, y + 6)

      y += 22
    }

    // ─── TERMS & CONDITIONS ───
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...NEGRO)
    doc.text('TÉRMINOS Y CONDICIONES', marginL, y)
    y += 7

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(120, 120, 120)

    const terms = [
      '1. Esta cotización tiene una vigencia de ' + quote.validDays + ' días calendario a partir de la fecha de emisión.',
      '2. Los precios están expresados en Pesos Colombianos (COP) e incluyen IVA según la normatividad vigente.',
      '3. La aceptación de esta cotización implica la firma del contrato de compraventa y el pago de la reserva correspondiente.',
      '4. PRAGA Living se reserva el derecho de modificar precios y disponibilidad sin previo aviso.',
      '5. El descuento aplicado es válido únicamente durante el período de vigencia de esta cotización.',
      '6. Las áreas y dimensiones son aproximadas y pueden tener variaciones menores según los planos constructivos finales.',
      '7. La entrega del inmueble está sujeta al cronograma de construcción y a las disposiciones legales aplicables.',
      '8. Para crédito hipotecario, la aprobación está sujeta a validación por parte de la entidad financiera.',
    ]

    for (const term of terms) {
      const termLines = doc.splitTextToSize(term, contentW - 4)
      for (const line of termLines) {
        doc.text(line, marginL + 2, y)
        y += 4
      }
    }

    y += 4

    // ─── SIGNATURE LINES ───
    if (y + 30 < pageH - 30) {
      y += 8
      doc.setDrawColor(...GRIS)
      doc.setLineWidth(0.3)
      doc.line(marginL, y, marginL + 60, y)
      doc.line(pageW - marginR - 60, y, pageW - marginR, y)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(120, 120, 120)
      doc.text('Firma del Cliente', marginL, y + 5)
      doc.text('PRAGA Living', pageW - marginR - 60, y + 5)
    }

    // ─── FOOTER ───
    const footerY = pageH - 18

    // Bronce line
    doc.setFillColor(...BRONCE)
    doc.rect(marginL, footerY, contentW, 0.4, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...BRONCE)
    doc.text('PRAGA LIVING', marginL, footerY + 5)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6)
    doc.setTextColor(150, 150, 150)
    doc.text('Cl. 133 Sur #49-94, Caldas, Antioquia, Colombia', marginL, footerY + 9)
    doc.text('info@pragaliving.com  |  www.pragaliving.com  |  +57 604 444 0000', marginL, footerY + 13)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6)
    doc.setTextColor(180, 180, 180)
    doc.text(`${quote.number}  |  Pág. 1 de 1`, pageW - marginR, footerY + 5, { align: 'right' })

    // Output as buffer
    const pdfBuffer = doc.output('arraybuffer')

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${quote.number}.pdf"`,
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json({ error: 'Error al generar PDF' }, { status: 500 })
  }
}
