import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const amenities = await prisma.amenity.findMany({
      orderBy: { order: 'asc' },
    })
    return NextResponse.json({ amenities, total: amenities.length })
  } catch {
    return NextResponse.json({ error: 'Error al obtener amenidades' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, name, description, category, active, icon } = body

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = name
    if (description !== undefined) data.description = description
    if (category !== undefined) data.category = category
    if (active !== undefined) data.active = active
    if (icon !== undefined) data.icon = icon

    const amenity = await prisma.amenity.update({
      where: { id },
      data,
    })

    return NextResponse.json({ success: true, amenity })
  } catch {
    return NextResponse.json({ error: 'Error al actualizar amenidad' }, { status: 500 })
  }
}
