import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (status) where.status = status

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.lead.count({ where }),
    ])

    return NextResponse.json({
      leads,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
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

    const lead = await prisma.lead.create({
      data: {
        name,
        phone,
        email,
        interest: interest || null,
        message: message || null,
        source: source || 'website',
        status: 'new',
      },
    })

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

    const data: Record<string, unknown> = {}
    if (status) data.status = status
    if (notes !== undefined) data.notes = notes

    const lead = await prisma.lead.update({
      where: { id },
      data,
    })

    return NextResponse.json({ success: true, lead })
  } catch {
    return NextResponse.json({ error: 'Error al actualizar lead' }, { status: 500 })
  }
}
