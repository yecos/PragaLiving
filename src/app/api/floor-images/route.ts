import { NextRequest, NextResponse } from 'next/server'
import { getFloorImages, createFloorImage, updateFloorImage, deleteFloorImage } from '@/lib/data'
import { requireAdmin, requireAdminWithCsrf } from '@/lib/auth-guard'

// Static fallback map used only when the database is unreachable.
// Real data lives in Postgres via Prisma.
const STATIC_FALLBACK: Record<string, { id: string; floor_id: string; image_url: string; label: string }[]> = {
  's3': [{ id: 'fi-parq-1', floor_id: 's3', image_url: '/images/planos/planta-parqueaderos.jpg', label: 'Planta Parqueaderos' }],
  's2': [{ id: 'fi-parq-2', floor_id: 's2', image_url: '/images/planos/planta-parqueaderos.jpg', label: 'Planta Parqueaderos' }],
  's1': [{ id: 'fi-parq-3', floor_id: 's1', image_url: '/images/planos/planta-parqueaderos.jpg', label: 'Planta Parqueaderos' }],
  'pv': [{ id: 'fi-pv-1', floor_id: 'pv', image_url: '/images/planos/planta-parqueaderos.jpg', label: 'Planta Visitantes' }],
  'acceso': [{ id: 'fi-acc-1', floor_id: 'acceso', image_url: '/images/planos/planta-primer-piso.jpg', label: 'Planta Primer Piso' }],
  'comercial': [{ id: 'fi-com-1', floor_id: 'comercial', image_url: '/images/planos/planta-primer-piso.jpg', label: 'Planta Comercial' }],
  'social': [{ id: 'fi-soc-1', floor_id: 'social', image_url: '/images/planos/planta-social.jpg', label: 'Planta Zona Social' }],
  'cubierta': [{ id: 'fi-cub-1', floor_id: 'cubierta', image_url: '/images/planos/planta-techos.jpg', label: 'Planta Cubierta' }],
}

// GET /api/floor-images?floor_id=piso-1 — public read
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const floorId = searchParams.get('floor_id')

    const images = await getFloorImages(floorId || undefined)

    if (images.length === 0 && floorId) {
      // Fallback to static images for non-residential floors when DB has nothing
      if (STATIC_FALLBACK[floorId]) {
        return NextResponse.json({ images: STATIC_FALLBACK[floorId] })
      }
      if (floorId.startsWith('piso-')) {
        return NextResponse.json({ images: [{ id: `fi-${floorId}`, floor_id: floorId, image_url: '/images/planos/planta-tipo.jpg', label: 'Planta Tipo' }] })
      }
    }

    return NextResponse.json({ images })
  } catch (err) {
    console.error('Floor images GET error:', err)
    // Last-resort fallback to static map
    const { searchParams } = new URL(req.url)
    const floorId = searchParams.get('floor_id')
    if (floorId && STATIC_FALLBACK[floorId]) {
      return NextResponse.json({ images: STATIC_FALLBACK[floorId] })
    }
    return NextResponse.json({ images: [] })
  }
}

// POST — ADMIN ONLY: add a floor image record
export async function POST(req: NextRequest) {
  const auth = await requireAdminWithCsrf(req)
  if (!auth.authorized) return auth.error!

  try {
    const body = await req.json()
    const { floor_id, image_url, label, order } = body

    if (!floor_id || !image_url) {
      return NextResponse.json({ error: 'floor_id e image_url son requeridos' }, { status: 400 })
    }

    const created = await createFloorImage({
      floorId: floor_id,
      imageUrl: image_url,
      label: label ?? null,
      order: order ?? 0,
    })

    return NextResponse.json({ success: true, image: created })
  } catch (err) {
    console.error('Floor image POST error:', err)
    return NextResponse.json({ error: 'Error al crear imagen' }, { status: 500 })
  }
}

// PUT — ADMIN ONLY: update a floor image
export async function PUT(req: NextRequest) {
  const auth = await requireAdminWithCsrf(req)
  if (!auth.authorized) return auth.error!

  try {
    const body = await req.json()
    const { id, label, order } = body

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    const updateData: { label?: string; order?: number } = {}
    if (label !== undefined) updateData.label = label
    if (order !== undefined) updateData.order = order

    const updated = await updateFloorImage(id, updateData)
    return NextResponse.json({ success: true, image: updated })
  } catch (err) {
    console.error('Floor image PUT error:', err)
    return NextResponse.json({ error: 'Error al actualizar imagen' }, { status: 500 })
  }
}

// DELETE — ADMIN ONLY: remove a floor image record
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!auth.authorized) return auth.error!

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    await deleteFloorImage(id)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Floor image DELETE error:', err)
    return NextResponse.json({ error: 'Error al eliminar imagen' }, { status: 500 })
  }
}
