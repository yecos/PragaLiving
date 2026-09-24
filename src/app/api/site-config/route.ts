import { NextRequest, NextResponse } from 'next/server'
import { getAllSiteConfig, updateSiteConfig } from '@/lib/data'
import staticSiteConfig from '@/data/site-config.json'
import { requireAdminWithCsrf } from '@/lib/auth-guard'

const staticConfig = staticSiteConfig as Record<string, any>
const CONFIG_META_SECTION = '__site_config_meta'
const CONFIG_BASELINE_VERSION = 'praga-approved-2026-09-22-v1'

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function deepMerge(fallback: unknown, override: unknown): unknown {
  if (isPlainObject(fallback) && isPlainObject(override)) {
    const result: Record<string, unknown> = { ...fallback }
    for (const [key, value] of Object.entries(override)) {
      result[key] = key in result ? deepMerge(result[key], value) : value
    }
    return result
  }
  return override === undefined ? fallback : override
}

function hasApprovedBaseline(dbConfig: Record<string, unknown>) {
  const meta = dbConfig[CONFIG_META_SECTION]
  return isPlainObject(meta) && meta.version === CONFIG_BASELINE_VERSION
}

function publishedConfig(dbConfig: Record<string, unknown>) {
  if (!hasApprovedBaseline(dbConfig)) return staticConfig
  const cleanDb = Object.fromEntries(
    Object.entries(dbConfig).filter(([key]) => !key.startsWith('__')),
  )
  return deepMerge(staticConfig, cleanDb) as Record<string, any>
}

async function ensureApprovedBaseline(dbConfig: Record<string, unknown>) {
  if (hasApprovedBaseline(dbConfig)) return

  for (const [section, sectionData] of Object.entries(staticConfig)) {
    const result = await updateSiteConfig(section, sectionData)
    if (!result.success) {
      throw new Error(`No se pudo sincronizar la sección "${section}"`)
    }
  }

  const metaResult = await updateSiteConfig(CONFIG_META_SECTION, {
    version: CONFIG_BASELINE_VERSION,
    initializedAt: new Date().toISOString(),
  })
  if (!metaResult.success) throw new Error('No se pudo marcar la configuración inicial')
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const dbConfig = await getAllSiteConfig()
    return NextResponse.json(publishedConfig(dbConfig), {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (err) {
    console.error('[site-config] GET error:', err)
    return NextResponse.json(staticConfig, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  }
}

// POST — ADMIN ONLY.
// On the first save after this migration, copy the already-approved public page
// into Neon first. Only then apply the requested edit.
export async function POST(request: NextRequest) {
  const auth = await requireAdminWithCsrf(request)
  if (!auth.authorized) return auth.error!

  try {
    const body = await request.json()
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid config data' }, { status: 400 })
    }

    const dbConfig = await getAllSiteConfig()
    await ensureApprovedBaseline(dbConfig)

    if (typeof body._section === 'string' && Object.prototype.hasOwnProperty.call(body, '_data')) {
      const result = await updateSiteConfig(body._section, body._data)
      if (!result.success) {
        return NextResponse.json({ error: result.error || 'Failed to save' }, { status: 500 })
      }
      return NextResponse.json({ success: true, baselineSynced: !hasApprovedBaseline(dbConfig) })
    }

    const results: Record<string, boolean> = {}
    for (const [section, sectionData] of Object.entries(body)) {
      if (section.startsWith('_')) continue
      const result = await updateSiteConfig(section, sectionData)
      results[section] = result.success
    }

    return NextResponse.json({
      success: Object.values(results).every(Boolean),
      results,
      baselineSynced: !hasApprovedBaseline(dbConfig),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save config'
    console.error('[site-config] POST error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
