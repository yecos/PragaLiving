import { NextRequest, NextResponse } from 'next/server'
import { getAmenities, updateAmenity } from '@/lib/data'
import { requireAdmin, requireAdminWithCsrf } from '@/lib/auth-guard'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const amenities = await getAmenities()
    return NextResponse.json({ amenities, total: amenities.length })
  } catch (err) {
    console.error('[amenities] GET error:', err)
    return NextResponse.json({ error: 'Error al obtener amenidades' }, { status: 500 })
  }
}

// PUT — ADMIN ONLY: update amenity (name, description, category, active)
export async function PUT(req: NextRequest) {
  const auth = await requireAdminWithCsrf(req)
  if (!auth.authorized) return auth.error!

  try {
    const body = await req.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    // Use the singleton PrismaClient from db.ts (not a new instance per request)
    const data: Record<string, unknown> = {}
    if (body.name !== undefined) data.name = body.name
    if (body.description !== undefined) data.description = body.description
    if (body.category !== undefined) data.category = body.category
    if (body.active !== undefined) data.active = body.active

    try {
      const amenity = await db.amenity.update({ where: { id }, data })
      return NextResponse.json({ success: true, amenity })
    } catch (prismaErr) {
      console.error('[amenities] Prisma update failed:', prismaErr)
      // Fallback to data layer (Supabase)
      const updated = await updateAmenity(id, data)
      if (updated) {
        return NextResponse.json({ success: true, amenity: updated })
      }
      return NextResponse.json({ error: 'No se pudo actualizar la amenidad' }, { status: 500 })
    }
  } catch (err) {
    console.error('[amenities] PUT error:', err)
    return NextResponse.json({ error: 'Error al actualizar amenidad' }, { status: 500 })
  }
}
