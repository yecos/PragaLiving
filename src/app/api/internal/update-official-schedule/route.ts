import { NextRequest, NextResponse } from 'next/server'
import { getSiteConfig, updateSiteConfig } from '@/lib/data'

export const dynamic = 'force-dynamic'

const OFFICIAL_SCHEDULE = [
  { days: 'Domingo', hours: '10:00 a. m. – 4:00 p. m.' },
  { days: 'Lunes a Viernes', hours: '10:00 a. m. – 1:00 p. m. / 2:00 p. m. – 5:00 p. m.' },
  { days: 'Sábado', hours: '10:00 a. m. – 5:00 p. m.' },
]

export async function GET(request: NextRequest) {
  const confirm = new URL(request.url).searchParams.get('confirm')
  if (confirm !== 'official-praga-schedule') {
    return NextResponse.json({ ok: false, error: 'Confirmación inválida' }, { status: 403 })
  }

  const current = await getSiteConfig('contacto')
  const contacto = current && typeof current === 'object'
    ? current as Record<string, unknown>
    : {}

  const result = await updateSiteConfig('contacto', {
    ...contacto,
    schedule: OFFICIAL_SCHEDULE,
  })

  if (!result.success) {
    return NextResponse.json({ ok: false, error: result.error || 'No se pudo actualizar el horario' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, schedule: OFFICIAL_SCHEDULE }, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  })
}
