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

// PUT — ADMIN ONLY: edit the apartment master record.
// Final price is never entered manually; it is derived from area + commercial settings.
export async function PUT(req: NextRequest) {
  const auth = await requireAdminWithCsrf(req)
  if (!auth.authorized) return auth.error!

  try {
    const body = await req.json()
    const { id, status, name, area, bedrooms, bathrooms, view, typology, image, plan360Url, features } = body

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    const validStatuses = ['consult', 'available', 'reserved', 'sold']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
    }

    if (name !== undefined && (typeof name !== 'string' || !name.trim() || name.length > 80)) {
      return NextResponse.json({ error: 'Nombre inválido' }, { status: 400 })
    }

    const parsedArea = area !== undefined ? Number(area) : undefined
    if (parsedArea !== undefined && (!Number.isFinite(parsedArea) || parsedArea <= 0 || parsedArea > 1000)) {
      return NextResponse.json({ error: 'Área inválida' }, { status: 400 })
    }

    const parsedBedrooms = bedrooms !== undefined ? Number(bedrooms) : undefined
    const parsedBathrooms = bathrooms !== undefined ? Number(bathrooms) : undefined
    if (parsedBedrooms !== undefined && (!Number.isInteger(parsedBedrooms) || parsedBedrooms < 0 || parsedBedrooms > 20)) {
      return NextResponse.json({ error: 'Número de alcobas inválido' }, { status: 400 })
    }
    if (parsedBathrooms !== undefined && (!Number.isInteger(parsedBathrooms) || parsedBathrooms < 0 || parsedBathrooms > 20)) {
      return NextResponse.json({ error: 'Número de baños inválido' }, { status: 400 })
    }

    const data = {
      ...(status !== undefined ? { status } : {}),
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(parsedArea !== undefined ? { area: parsedArea } : {}),
      ...(parsedBedrooms !== undefined ? { bedrooms: parsedBedrooms } : {}),
      ...(parsedBathrooms !== undefined ? { bathrooms: parsedBathrooms } : {}),
      ...(view !== undefined ? { view: String(view).trim() } : {}),
      ...(typology !== undefined ? { typology: String(typology).trim() } : {}),
      ...(image !== undefined ? { image: image ? String(image).trim() : null } : {}),
      ...(plan360Url !== undefined ? { plan360Url: plan360Url ? String(plan360Url).trim() : null } : {}),
      ...(features !== undefined ? { features: features ? String(features) : null } : {}),
    }

    const apartment = await updateApartment(id, data)
    return NextResponse.json({ success: true, apartment })
  } catch (err) {
    console.error('[apartments] PUT error:', err)
    return NextResponse.json({ error: 'Error al actualizar apartamento' }, { status: 500 })
  }
}
