import { NextRequest, NextResponse } from 'next/server'
import { getLeads, getApartments, createQuote, getQuotes, updateQuote } from '@/lib/data'
import { requireAdmin, requireAdminWithCsrf } from '@/lib/auth-guard'

// GET — ADMIN ONLY: list quotes (contains client contact data)
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!auth.authorized) return auth.error!

  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || undefined

    const quotes = await getQuotes({ status })

    // Enrich with lead/apartment data
    const allLeads = await getLeads()
    const allApartments = await getApartments()

    const enriched = quotes.map(q => {
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
  } catch (err) {
    console.error('[quotes] GET error:', err)
    return NextResponse.json({ error: 'Error al obtener cotizaciones' }, { status: 500 })
  }
}

// POST — ADMIN ONLY: create quote
export async function POST(req: NextRequest) {
  const auth = await requireAdminWithCsrf(req)
  if (!auth.authorized) return auth.error!

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

    const discountAmount = Number(discount || 0)
    if (!Number.isFinite(discountAmount) || discountAmount < 0) {
      return NextResponse.json({ error: 'Descuento inválido' }, { status: 400 })
    }
    if (discountAmount > apartment.price) {
      return NextResponse.json({ error: 'El descuento no puede superar el precio del apartamento' }, { status: 400 })
    }

    const finalPrice = apartment.price - discountAmount
    const days = Number(validDays || 30)
    const validUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()

    const result = await createQuote({
      leadId,
      apartmentId,
      discount: discountAmount,
      finalPrice,
      paymentPlan: paymentPlan || 'Contado',
      notes: notes || '',
      validDays: days,
      validUntil: new Date(validUntil),
    })

    if (!result.success || !result.quote) {
      return NextResponse.json({ error: 'No se pudo crear la cotización' }, { status: 500 })
    }

    const quote = result.quote

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
  } catch (err) {
    console.error('[quotes] POST error:', err)
    return NextResponse.json({ error: 'Error al crear cotización' }, { status: 500 })
  }
}

// PUT — ADMIN ONLY: update quote status
export async function PUT(req: NextRequest) {
  const auth = await requireAdminWithCsrf(req)
  if (!auth.authorized) return auth.error!

  try {
    const body = await req.json()
    const { id, status } = body

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    if (status) {
      const validStatuses = ['draft', 'sent', 'accepted', 'rejected', 'expired']
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
      }
    }

    const result = await updateQuote(id, { status })

    if (!result.success || !result.quote) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 })
    }

    return NextResponse.json({ success: true, quote: result.quote })
  } catch (err) {
    console.error('[quotes] PUT error:', err)
    return NextResponse.json({ error: 'Error al actualizar cotización' }, { status: 500 })
  }
}
