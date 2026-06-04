import { NextRequest, NextResponse } from 'next/server'

const apartments = [
  { id: '1', name: 'Studio 33', area: 33.05, bedrooms: 1, bathrooms: 1, status: 'available', price: 280000000, view: 'Atrio', floor: 1 },
  { id: '2', name: 'Studio 33', area: 33.75, bedrooms: 1, bathrooms: 1, status: 'available', price: 295000000, view: 'Exterior', floor: 2 },
  { id: '3', name: 'Studio Plus', area: 35.60, bedrooms: 1, bathrooms: 1, status: 'reserved', price: 310000000, view: 'Atrio', floor: 3 },
  { id: '4', name: 'Studio Plus', area: 35.80, bedrooms: 1, bathrooms: 1, status: 'available', price: 320000000, view: 'Exterior', floor: 4 },
  { id: '5', name: 'Apartamento 57', area: 57.05, bedrooms: 2, bathrooms: 1, status: 'available', price: 420000000, view: 'Exterior', floor: 5 },
  { id: '6', name: 'Apartamento 57', area: 57.09, bedrooms: 2, bathrooms: 1, status: 'sold', price: 435000000, view: 'Atrio', floor: 6 },
  { id: '7', name: 'Apartamento Premium', area: 74.73, bedrooms: 2, bathrooms: 2, status: 'reserved', price: 580000000, view: 'Exterior', floor: 8 },
  { id: '8', name: 'Penthouse', area: 97.45, bedrooms: 3, bathrooms: 2, status: 'available', price: 850000000, view: 'Panorámica', floor: 12 },
]

export async function GET() {
  return NextResponse.json({ apartments, total: apartments.length })
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, status, price } = body

    const apt = apartments.find(a => a.id === id)
    if (!apt) {
      return NextResponse.json({ error: 'Apartamento no encontrado' }, { status: 404 })
    }

    if (status) apt.status = status
    if (price) apt.price = price

    return NextResponse.json({ success: true, apartment: apt })
  } catch {
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
  }
}
