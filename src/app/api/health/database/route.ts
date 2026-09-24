import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const databaseRows = await db.$queryRawUnsafe<Array<{ database: string }>>(
      'SELECT current_database() AS database'
    )
    const apartmentCount = await db.apartment.count()
    const levels = await db.apartment.groupBy({
      by: ['floor'],
      _count: { _all: true },
      orderBy: { floor: 'asc' },
    })
    const sample = await db.apartment.findFirst({
      where: { floor: 12, name: 'Apto 04' },
      select: { name: true, floor: true, area: true, price: true },
    })

    return NextResponse.json({
      ok: true,
      database: databaseRows[0]?.database || null,
      apartmentCount,
      levels: levels.map((row) => ({ floor: row.floor, count: row._count._all })),
      sample,
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
