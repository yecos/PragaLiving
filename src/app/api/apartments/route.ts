import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const floor = searchParams.get('floor')
    const typology = searchParams.get('typology')

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (floor) where.floor = parseInt(floor)
    if (typology) where.typology = typology

    const apartments = await prisma.apartment.findMany({
      where,
      orderBy: [{ floor: 'asc' }, { name: 'asc' }],
    })

    return NextResponse.json({ apartments, total: apartments.length })
  } catch {
    return NextResponse.json({ error: 'Error al obtener apartamentos' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, area, bedrooms, bathrooms, floor, view, typology, status, price, image, plan360Url, features } = body

    if (!name || !area || !floor || !typology || !price) {
      return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 })
    }

    const apartment = await prisma.apartment.create({
      data: {
        name,
        area: parseFloat(area),
        bedrooms: parseInt(bedrooms) || 0,
        bathrooms: parseInt(bathrooms) || 1,
        floor: parseInt(floor),
        view: view || 'Exterior',
        typology,
        status: status || 'available',
        price: parseFloat(price),
        image: image || null,
        plan360Url: plan360Url || null,
        features: features || null,
      },
    })

    return NextResponse.json({ success: true, apartment })
  } catch {
    return NextResponse.json({ error: 'Error al crear apartamento' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, status, price } = body

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    const data: Record<string, unknown> = {}
    if (status) data.status = status
    if (price !== undefined) data.price = parseFloat(price)

    const apartment = await prisma.apartment.update({
      where: { id },
      data,
    })

    return NextResponse.json({ success: true, apartment })
  } catch {
    return NextResponse.json({ error: 'Error al actualizar apartamento' }, { status: 500 })
  }
}
