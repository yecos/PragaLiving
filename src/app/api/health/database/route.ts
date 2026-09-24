import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getApartments, getCommercialPricing } from '@/lib/data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const databaseRows = await db.$queryRawUnsafe<Array<{ database: string }>>(
      'SELECT current_database() AS database'
    )
    const [apartments, pricing] = await Promise.all([
      getApartments(),
      getCommercialPricing(),
    ])
    const apartmentCount = apartments.length
    const levels = Array.from(
      apartments.reduce((map, apartment) => {
        map.set(apartment.floor, (map.get(apartment.floor) || 0) + 1)
        return map
      }, new Map<number, number>()),
    ).map(([floor, count]) => ({ floor, count })).sort((a, b) => a.floor - b.floor)
    const sample = apartments.find((apartment) => apartment.floor === 12 && apartment.name === 'Apto 04') || null

    return NextResponse.json({
      ok: true,
      database: databaseRows[0]?.database || null,
      apartmentCount,
      levels,
      pricing,
      sample: sample ? { name: sample.name, floor: sample.floor, area: sample.area, price: sample.price } : null,
    }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (error) {
    console.error('[database-health]', error)
    return NextResponse.json({
      ok: false,
      error: 'Database health check failed',
    }, { status: 500 })
  }
}
