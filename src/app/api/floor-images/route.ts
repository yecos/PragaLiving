import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient, isSupabaseConfigured } from '@/lib/supabase'

// GET /api/floor-images?floor_id=piso-1
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const floorId = searchParams.get('floor_id')

    if (!isSupabaseConfigured()) {
      // Return fallback static images
      const staticMap: Record<string, { id: string; floor_id: string; image_url: string; label: string }[]> = {
        's3': [{ id: 'fi-parq-1', floor_id: 's3', image_url: '/images/planos/planta-parqueaderos.jpg', label: 'Planta Parqueaderos' }],
        's2': [{ id: 'fi-parq-2', floor_id: 's2', image_url: '/images/planos/planta-parqueaderos.jpg', label: 'Planta Parqueaderos' }],
        's1': [{ id: 'fi-parq-3', floor_id: 's1', image_url: '/images/planos/planta-parqueaderos.jpg', label: 'Planta Parqueaderos' }],
        'pv': [{ id: 'fi-pv-1', floor_id: 'pv', image_url: '/images/planos/planta-parqueaderos.jpg', label: 'Planta Visitantes' }],
        'acceso': [{ id: 'fi-acc-1', floor_id: 'acceso', image_url: '/images/planos/planta-primer-piso.jpg', label: 'Planta Primer Piso' }],
        'comercial': [{ id: 'fi-com-1', floor_id: 'comercial', image_url: '/images/planos/planta-primer-piso.jpg', label: 'Planta Comercial' }],
        'social': [{ id: 'fi-soc-1', floor_id: 'social', image_url: '/images/planos/planta-social.jpg', label: 'Planta Zona Social' }],
        'cubierta': [{ id: 'fi-cub-1', floor_id: 'cubierta', image_url: '/images/planos/planta-techos.jpg', label: 'Planta Cubierta' }],
      }
      if (floorId && staticMap[floorId]) {
        return NextResponse.json({ images: staticMap[floorId] })
      }
      if (floorId && floorId.startsWith('piso-')) {
        return NextResponse.json({ images: [{ id: `fi-${floorId}`, floor_id: floorId, image_url: '/images/planos/planta-tipo.jpg', label: 'Planta Tipo' }] })
      }
      return NextResponse.json({ images: [] })
    }

    const supabase = createAdminSupabaseClient()
    let query = supabase.from('floor_images').select('*').order('order', { ascending: true })

    if (floorId) {
      query = query.eq('floor_id', floorId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Floor images GET error:', error)
      return NextResponse.json({ error: 'Error al obtener imágenes' }, { status: 500 })
    }

    return NextResponse.json({ images: data || [] })
  } catch (err) {
    console.error('Floor images GET error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// POST - add a floor image record
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { floor_id, image_url, label, order } = body

    if (!floor_id || !image_url) {
      return NextResponse.json({ error: 'floor_id e image_url son requeridos' }, { status: 400 })
    }

    const supabase = createAdminSupabaseClient()

    const { data, error } = await supabase
      .from('floor_images')
      .insert({
        floor_id,
        image_url,
        label: label || null,
        order: order || 0,
      })
      .select()
      .single()

    if (error) {
      console.error('Floor image POST error:', error)
      return NextResponse.json({ error: 'Error al crear imagen' }, { status: 500 })
    }

    return NextResponse.json({ success: true, image: data })
  } catch (err) {
    console.error('Floor image POST error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// PUT - update a floor image
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, label, order } = body

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    const supabase = createAdminSupabaseClient()
    const updates: Record<string, unknown> = {}
    if (label !== undefined) updates.label = label
    if (order !== undefined) updates.order = order
    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('floor_images')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Floor image PUT error:', error)
      return NextResponse.json({ error: 'Error al actualizar imagen' }, { status: 500 })
    }

    return NextResponse.json({ success: true, image: data })
  } catch (err) {
    console.error('Floor image PUT error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// DELETE - remove a floor image record
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    const supabase = createAdminSupabaseClient()

    // First get the image to potentially delete from storage
    const { data: imageData } = await supabase
      .from('floor_images')
      .select('image_url')
      .eq('id', id)
      .single()

    // Delete from database
    const { error } = await supabase
      .from('floor_images')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Floor image DELETE error:', error)
      return NextResponse.json({ error: 'Error al eliminar imagen' }, { status: 500 })
    }

    // If the image is in Supabase Storage (not a static /images/ path), delete from storage too
    if (imageData?.image_url && !imageData.image_url.startsWith('/images/')) {
      try {
        const urlObj = new URL(imageData.image_url)
        const pathParts = urlObj.pathname.split('/storage/v1/object/public/floor-plans/')
        if (pathParts.length > 1) {
          const storagePath = pathParts[1]
          await supabase.storage.from('floor-plans').remove([storagePath])
        }
      } catch {
        // URL parsing failed, skip storage deletion
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Floor image DELETE error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
