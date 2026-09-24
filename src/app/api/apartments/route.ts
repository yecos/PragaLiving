import { NextRequest, NextResponse } from 'next/server'
import { getApartments, updateApartment } from '@/lib/data'
import { requireAdmin, requireAdminWithCsrf } from '@/lib/auth-guard'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || undefined
    const floor = searchParams.get('floor') ? parseInt(searchParams.get('floor')!) : undefined
    const typology = searchParams.get('typology') || undefined

    const apartments = await getApartments({ status, floor, typology })
    return NextResponse.json({ apartments, total: apartments.length })
  } catch (err) {
    console.error('[apartments] GET error:', err)
    return NextResponse.json({ error: 'Error al obtener apartamentos' }, { status: 500 })
  }
}

// PUT — ADMIN ONLY: change apartment availability status.
// Price is canonical and derived from area + level premium.
export async function PUT(req: NextRequest) {
  const auth = await requireAdminWithCsrf(req)
  if (!auth.authorized) return auth.error!

  try {
    const body = await req.json()
    const { id, status } = body

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    const validStatuses = ['consult', 'available', 'reserved', 'sold']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
    }

    const data: { status?: string } = {}
    if (status) data.status = status

    const apartment = await updateApartment(id, data)
    return NextResponse.json({ success: true, apartment })
  } catch (err) {
    console.error('[apartments] PUT error:', err)
    return NextResponse.json({ error: 'Error al actualizar apartamento' }, { status: 500 })
  }
}
