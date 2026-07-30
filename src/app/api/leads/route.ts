import { NextRequest, NextResponse } from 'next/server'
import { getLeads, createLead, updateLead, getSiteConfig } from '@/lib/data'
import { sendEmail, isNewLeadEmail } from '@/lib/email'
import { leadsRateLimit, getClientId } from '@/lib/rate-limit'
import { requireAdmin, requireAdminWithCsrf } from '@/lib/auth-guard'

// GET — ADMIN ONLY: list leads (contains PII: name, phone, email)
// Public users submit leads via POST, they never list them.
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!auth.authorized) return auth.error!

  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || undefined

    const leads = await getLeads({ status })
    return NextResponse.json({ leads, total: leads.length })
  } catch (err) {
    console.error('[leads] GET error:', err)
    return NextResponse.json({ error: 'Error al obtener leads' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  // Rate limiting — 5 lead submissions per minute per client
  const clientId = getClientId(req)
  const { allowed, resetAt } = leadsRateLimit(clientId)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Por favor espera un momento.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)) } }
    )
  }

  try {
    const body = await req.json()
    const { name, phone, email, interest, message, source } = body

    if (!name || !phone || !email) {
      return NextResponse.json(
        { error: 'Nombre, teléfono y email son requeridos' },
        { status: 400 }
      )
    }

    const lead = await createLead({ name, phone, email, interest, message, source })

    // Send email notification (non-blocking)
    try {
      const [generalConfig, contactoConfig] = await Promise.all([
        getSiteConfig('general'),
        getSiteConfig('contacto'),
      ])
      const notificationEmail = (contactoConfig as any)?.notificationEmail || process.env.SALES_EMAIL || (generalConfig as any)?.email
      const projectName = (generalConfig as any)?.projectName || 'PRAGA Living'

      if (notificationEmail) {
        sendEmail({
          to: notificationEmail,
          subject: `[${projectName}] Nuevo Lead: ${name}`,
          html: isNewLeadEmail({ name, phone, email, interest: interest || null, message: message || null }),
        }).catch(err => console.error('[Leads API] Email notification failed:', err))
      }
    } catch (emailError) {
      console.error('[Leads API] Failed to prepare email notification:', emailError)
    }

    return NextResponse.json({
      success: true,
      message: 'Solicitud recibida. Un asesor se pondrá en contacto contigo pronto.',
      leadId: lead.id,
    })
  } catch {
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  // ADMIN ONLY: update lead status/notes
  const auth = await requireAdminWithCsrf(req)
  if (!auth.authorized) return auth.error!

  try {
    const body = await req.json()
    const { id, status, notes } = body

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    const data: { status?: string; notes?: string } = {}
    if (status) data.status = status
    if (notes !== undefined) data.notes = notes

    const lead = await updateLead(id, data)
    return NextResponse.json({ success: true, lead })
  } catch (err) {
    console.error('[leads] PUT error:', err)
    return NextResponse.json({ error: 'Error al actualizar lead' }, { status: 500 })
  }
}
