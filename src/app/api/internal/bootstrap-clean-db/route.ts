import { NextRequest, NextResponse } from 'next/server'
import { bootstrapCleanDatabase } from '@/lib/clean-db-bootstrap'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') {
    return NextResponse.json({ error: 'Solo disponible en producción' }, { status: 403 })
  }

  const confirm = new URL(request.url).searchParams.get('confirm')
  if (confirm !== 'praga-clean-2026-09-24') {
    return NextResponse.json({ error: 'Confirmación inválida' }, { status: 403 })
  }

  try {
    const result = await bootstrapCleanDatabase()
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    console.error('[bootstrap-clean-db]', error)
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Error creando la base limpia',
    }, { status: 500 })
  }
}
