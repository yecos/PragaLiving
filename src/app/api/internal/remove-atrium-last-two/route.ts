import { NextRequest, NextResponse } from 'next/server'
import { getSiteConfig, updateSiteConfig } from '@/lib/data'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const confirm = new URL(request.url).searchParams.get('confirm')
  if (confirm !== 'remove-atrium-last-two') {
    return NextResponse.json({ ok: false, error: 'Confirmación inválida' }, { status: 403 })
  }

  const current = await getSiteConfig('galeria')
  const gallery = current && typeof current === 'object'
    ? current as { items?: Array<{ id?: number; category?: string; src?: string; title?: string }>; [key: string]: unknown }
    : {}

  const before = Array.isArray(gallery.items) ? gallery.items : []
  const removed = before.filter((item) => item.category === 'Atrio' && [14, 15].includes(Number(item.id)))
  const items = before.filter((item) => !(item.category === 'Atrio' && [14, 15].includes(Number(item.id))))

  const result = await updateSiteConfig('galeria', { ...gallery, items })
  if (!result.success) {
    return NextResponse.json({ ok: false, error: result.error || 'No se pudo actualizar galería' }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    removed,
    atrioRemaining: items.filter((item) => item.category === 'Atrio').length,
  }, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  })
}
