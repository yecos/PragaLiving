import { NextRequest, NextResponse } from 'next/server'
import { getLeads, createLead, updateLead, getSiteConfig } from '@/lib/data'
import { sendEmail, isNewLeadEmail } from '@/lib/email'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || undefined

    const leads = await getLeads({ status })
    return NextResponse.json({ leads, total: leads.length })
  } catch {
    return NextResponse.json({ error: 'Error al obtener leads' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
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
  } catch {
    return NextResponse.json({ error: 'Error al actualizar lead' }, { status: 500 })
  }
}
