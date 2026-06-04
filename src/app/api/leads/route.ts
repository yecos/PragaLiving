import { NextRequest, NextResponse } from 'next/server'

// In-memory leads store (will be replaced with Prisma DB)
const leads: Array<{
  id: string
  name: string
  phone: string
  email: string
  interest: string
  message: string
  source: string
  created_at: string
}> = []

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, phone, email, interest, message } = body

    if (!name || !phone || !email) {
      return NextResponse.json(
        { error: 'Nombre, teléfono y email son requeridos' },
        { status: 400 }
      )
    }

    const lead = {
      id: Date.now().toString(),
      name,
      phone,
      email,
      interest: interest || 'general',
      message: message || '',
      source: 'website',
      created_at: new Date().toISOString(),
    }

    leads.push(lead)

    return NextResponse.json({ 
      success: true, 
      message: 'Solicitud recibida. Un asesor se pondrá en contacto contigo pronto.',
      leadId: lead.id 
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ leads, total: leads.length })
}
