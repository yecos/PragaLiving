import { NextRequest, NextResponse } from 'next/server'
import { getLeads, getApartments } from '@/lib/data'
import { quotesStore, quoteCounter, generateQuoteNumber, type Quote } from '@/lib/quotes-store'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || undefined

    let filtered = quotesStore
    if (status) {
      filtered = filtered.filter(q => q.status === status)
    }

    // Enrich quotes with lead and apartment data
    const allLeads = await getLeads()
    const allApartments = await getApartments()

    const enriched = filtered.map(q => {
      const lead = allLeads.find(l => l.id === q.leadId)
      const apt = allApartments.find(a => a.id === q.apartmentId)
      return {
        ...q,
        leadName: lead?.name || 'Desconocido',
        leadEmail: lead?.email || '',
        leadPhone: lead?.phone || '',
        apartmentName: apt?.name || 'Desconocido',
        apartmentArea: apt?.area || 0,
        apartmentTypology: apt?.typology || '',
        apartmentPrice: apt?.price || 0,
      }
    })

    return NextResponse.json({ quotes: enriched, total: enriched.length })
  } catch {
    return NextResponse.json({ error: 'Error al obtener cotizaciones' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { leadId, apartmentId, discount, paymentPlan, notes, validDays } = body

    if (!leadId || !apartmentId) {
      return NextResponse.json(
        { error: 'Lead y apartamento son requeridos' },
        { status: 400 }
      )
    }

    // Get apartment price
    const allApartments = await getApartments()
    const apartment = allApartments.find(a => a.id === apartmentId)
    if (!apartment) {
      return NextResponse.json({ error: 'Apartamento no encontrado' }, { status: 404 })
    }

    const discountAmount = discount || 0
    const finalPrice = apartment.price - discountAmount
    const days = validDays || 30
    const validUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()

    const quote: Quote = {
      id: `quote-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      number: generateQuoteNumber(),
      leadId,
      apartmentId,
      discount: discountAmount,
      finalPrice,
      paymentPlan: paymentPlan || 'Contado',
      notes: notes || '',
      validDays: days,
      validUntil,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    quotesStore.push(quote)

    // Enrich for response
    const allLeads = await getLeads()
    const lead = allLeads.find(l => l.id === leadId)

    return NextResponse.json({
      success: true,
      quote: {
        ...quote,
        leadName: lead?.name || 'Desconocido',
        leadEmail: lead?.email || '',
        leadPhone: lead?.phone || '',
        apartmentName: apartment.name,
        apartmentArea: apartment.area,
        apartmentTypology: apartment.typology,
        apartmentPrice: apartment.price,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Error al crear cotización' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, status } = body

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    const quote = quotesStore.find(q => q.id === id)
    if (!quote) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 })
    }

    if (status) {
      const validStatuses = ['draft', 'sent', 'accepted', 'rejected', 'expired']
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
      }
      quote.status = status as Quote['status']
    }

    quote.updatedAt = new Date().toISOString()

    return NextResponse.json({ success: true, quote })
  } catch {
    return NextResponse.json({ error: 'Error al actualizar cotización' }, { status: 500 })
  }
}
