import { NextRequest, NextResponse } from 'next/server'
import { getApartments, updateApartment } from '@/lib/data'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || undefined
    const floor = searchParams.get('floor') ? parseInt(searchParams.get('floor')!) : undefined
    const typology = searchParams.get('typology') || undefined

    const apartments = await getApartments({ status, floor, typology })
    return NextResponse.json({ apartments, total: apartments.length })
  } catch {
    return NextResponse.json({ error: 'Error al obtener apartamentos' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, status, price } = body

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    const data: { status?: string; price?: number } = {}
    if (status) data.status = status
    if (price !== undefined) data.price = parseFloat(price)

    const apartment = await updateApartment(id, data)
    return NextResponse.json({ success: true, apartment })
  } catch {
    return NextResponse.json({ error: 'Error al actualizar apartamento' }, { status: 500 })
  }
}
