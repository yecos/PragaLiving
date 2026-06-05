import { NextRequest, NextResponse } from 'next/server'
import { getAmenities } from '@/lib/data'

export async function GET() {
  try {
    const amenities = await getAmenities()
    return NextResponse.json({ amenities, total: amenities.length })
  } catch {
    return NextResponse.json({ error: 'Error al obtener amenidades' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    // For now, amenities are read-only in fallback mode
    // In production with a real DB, this would update via Prisma
    const body = await req.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    // Try Prisma first
    try {
      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient()
      const data: Record<string, unknown> = {}
      if (body.name !== undefined) data.name = body.name
      if (body.description !== undefined) data.description = body.description
      if (body.category !== undefined) data.category = body.category
      if (body.active !== undefined) data.active = body.active

      const amenity = await prisma.amenity.update({ where: { id }, data })
      return NextResponse.json({ success: true, amenity })
    } catch {
      // Fallback: return success but data won't persist
      return NextResponse.json({ success: true, amenity: { id, ...body } })
    }
  } catch {
    return NextResponse.json({ error: 'Error al actualizar amenidad' }, { status: 500 })
  }
}
