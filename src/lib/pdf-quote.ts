// ============================================
// PDF Quote Generator for PRAGA Living
// ============================================
// Generates formal apartment quotes (cotizaciones) using jsPDF

import jsPDF from 'jspdf'

interface QuoteData {
  // Client info
  clientName: string
  clientPhone: string
  clientEmail: string
  clientDocument?: string

  // Apartment info
  apartmentName: string
  apartmentArea: number
  apartmentTypology: string
  apartmentFloor: number
  apartmentView: string
  apartmentFeatures: string[]

  // Pricing
  basePrice: number
  discounts: number
  totalPrice: number

  // Quote metadata
  quoteNumber: string
  validUntil: string
  notes?: string
}

// ============================================
// Format COP currency
// ============================================
function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// ============================================
// Generate PDF Quote
// ============================================
export function generateQuotePDF(data: QuoteData): jsPDF {
  const doc = new jsPDF('p', 'mm', 'letter')
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  const contentWidth = pageWidth - margin * 2

  // ── Colors ──
  const negro = '#111111'
  const bronce = '#8B6B4B'
  const marfil = '#F5F1EA'
  const grisPiedra = '#D8D1C8'
  const verdeMusgo = '#4B5646'

  // ── Header ──
  doc.setFillColor(17, 17, 17) // #111111
  doc.rect(0, 0, pageWidth, 45, 'F')

  // Bronce accent line
  doc.setDrawColor(139, 107, 75) // #8B6B4B
  doc.setLineWidth(1.5)
  doc.line(0, 45, pageWidth, 45)

  // Logo text
  doc.setTextColor(139, 107, 75)
  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.text('PRAGA', margin, 22)
  doc.setTextColor(245, 241, 234) // #F5F1EA
  doc.setFontSize(12)
  doc.text('LIVING', margin + 52, 22)

  // Quote title
  doc.setTextColor(216, 209, 200) // #D8D1C8
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('COTIZACIÓN FORMAL', margin, 34)

  // Quote number
  doc.setTextColor(216, 209, 200)
  doc.setFontSize(9)
  doc.text(`No. ${data.quoteNumber}`, pageWidth - margin, 16, { align: 'right' })
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-CO')}`, pageWidth - margin, 23, { align: 'right' })
  doc.text(`Válida hasta: ${data.validUntil}`, pageWidth - margin, 30, { align: 'right' })

  // ── Client Info Section ──
  let y = 58

  doc.setFillColor(245, 241, 234) // #F5F1EA
  doc.roundedRect(margin, y - 6, contentWidth, 36, 3, 3, 'F')

  doc.setTextColor(17, 17, 17)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('CLIENTE', margin + 4, y)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  y += 7
  doc.text(`Nombre: ${data.clientName}`, margin + 4, y)
  y += 6
  doc.text(`Teléfono: ${data.clientPhone}   |   Email: ${data.clientEmail}`, margin + 4, y)
  if (data.clientDocument) {
    y += 6
    doc.text(`Documento: ${data.clientDocument}`, margin + 4, y)
  }

  // ── Apartment Details ──
  y = 106

  doc.setFillColor(75, 86, 70) // #4B5646
  doc.roundedRect(margin, y - 6, contentWidth, 10, 3, 3, 'F')
  doc.setTextColor(245, 241, 234)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('DETALLES DEL APARTAMENTO', margin + 4, y)

  y += 14
  doc.setTextColor(17, 17, 17)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)

  // Apartment details in two columns
  const col1 = margin + 4
  const col2 = pageWidth / 2 + 4

  doc.setFont('helvetica', 'bold')
  doc.text('Apartamento:', col1, y)
  doc.text('Typología:', col2, y)
  doc.setFont('helvetica', 'normal')
  doc.text(data.apartmentName, col1 + 38, y)
  doc.text(data.apartmentTypology, col2 + 28, y)

  y += 7
  doc.setFont('helvetica', 'bold')
  doc.text('Área:', col1, y)
  doc.text('Piso:', col2, y)
  doc.setFont('helvetica', 'normal')
  doc.text(`${data.apartmentArea} m²`, col1 + 38, y)
  doc.text(`Piso ${data.apartmentFloor}`, col2 + 28, y)

  y += 7
  doc.setFont('helvetica', 'bold')
  doc.text('Vista:', col1, y)
  doc.setFont('helvetica', 'normal')
  doc.text(data.apartmentView, col1 + 38, y)

  // ── Features ──
  y += 14
  doc.setFillColor(139, 107, 75) // #8B6B4B
  doc.roundedRect(margin, y - 6, contentWidth, 10, 3, 3, 'F')
  doc.setTextColor(245, 241, 234)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('CARACTERÍSTICAS INCLUIDAS', margin + 4, y)

  y += 10
  doc.setTextColor(17, 17, 17)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)

  for (let i = 0; i < data.apartmentFeatures.length; i++) {
    const feature = data.apartmentFeatures[i]
    const col = i % 2 === 0 ? col1 : col2
    doc.text(`• ${feature}`, col, y)
    if (i % 2 === 1) y += 5
  }
  if (data.apartmentFeatures.length % 2 === 1) y += 5

  // ── Pricing ──
  y += 8
  doc.setFillColor(17, 17, 17) // #111111
  doc.roundedRect(margin, y - 6, contentWidth, 10, 3, 3, 'F')
  doc.setTextColor(245, 241, 234)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('PRECIO', margin + 4, y)

  y += 12
  doc.setTextColor(17, 17, 17)

  // Price table
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Valor base del apartamento:', margin + 4, y)
  doc.text(formatCOP(data.basePrice), pageWidth - margin, y, { align: 'right' })

  if (data.discounts > 0) {
    y += 7
    doc.setTextColor(75, 86, 70) // Verde for discount
    doc.text('Descuento especial:', margin + 4, y)
    doc.text(`-${formatCOP(data.discounts)}`, pageWidth - margin, y, { align: 'right' })
    doc.setTextColor(17, 17, 17)
  }

  // Total line
  y += 3
  doc.setDrawColor(139, 107, 75) // #8B6B4B
  doc.setLineWidth(0.5)
  doc.line(margin + 4, y, pageWidth - margin, y)

  y += 10
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('VALOR TOTAL:', margin + 4, y)
  doc.setTextColor(139, 107, 75) // Bronce
  doc.text(formatCOP(data.totalPrice), pageWidth - margin, y, { align: 'right' })

  // ── Notes ──
  if (data.notes) {
    y += 16
    doc.setTextColor(17, 17, 17)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text('NOTAS:', margin + 4, y)
    doc.setFont('helvetica', 'normal')
    y += 5
    const lines = doc.splitTextToSize(data.notes, contentWidth - 8)
    doc.text(lines, margin + 4, y)
    y += lines.length * 4
  }

  // ── Footer ──
  const footerY = doc.internal.pageSize.getHeight() - 40

  doc.setFillColor(245, 241, 234)
  doc.rect(0, footerY, pageWidth, 40, 'F')

  doc.setDrawColor(139, 107, 75)
  doc.setLineWidth(0.5)
  doc.line(margin, footerY, pageWidth - margin, footerY)

  doc.setTextColor(100, 100, 100)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('PRAGA Living · Cl. 133 Sur #49-94, Caldas, Antioquia, Colombia', pageWidth / 2, footerY + 8, { align: 'center' })
  doc.text('Esta cotización tiene carácter informativo y no constituye un contrato de compraventa.', pageWidth / 2, footerY + 14, { align: 'center' })
  doc.text('Los precios y disponibilidad están sujetos a cambio sin previo aviso.', pageWidth / 2, footerY + 20, { align: 'center' })
  doc.text(`Generado el ${new Date().toLocaleDateString('es-CO')} a las ${new Date().toLocaleTimeString('es-CO')}`, pageWidth / 2, footerY + 28, { align: 'center' })

  return doc
}

// ============================================
// Generate quote number
// ============================================
export function generateQuoteNumber(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
  return `COT-${year}${month}-${random}`
}

// ============================================
// Generate PDF as base64
// ============================================
export function generateQuotePDFBase64(data: QuoteData): string {
  const doc = generateQuotePDF(data)
  return doc.output('datauristring').split(',')[1]
}

// ============================================
// Generate PDF as Blob (for download)
// ============================================
export function generateQuotePDFBlob(data: QuoteData): Blob {
  const doc = generateQuotePDF(data)
  const pdfOutput = doc.output('arraybuffer')
  return new Blob([pdfOutput], { type: 'application/pdf' })
}
