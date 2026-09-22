import { NextRequest, NextResponse } from 'next/server'
import { getAllSiteConfig, updateSiteConfig } from '@/lib/data'
import staticSiteConfig from '@/data/site-config.json'
import { requireAdmin, requireAdminWithCsrf } from '@/lib/auth-guard'

const staticConfig = staticSiteConfig as Record<string, any>

export const dynamic = 'force-dynamic'
export const revalidate = 0

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Static JSON is only the initial fallback. Once a section exists in the
 * database, the admin panel is the source of truth for that section.
 * Objects are merged recursively so a partial legacy row does not erase
 * fields that were added later; arrays are intentionally replaced as a unit
 * because the editor manages their order and membership.
 */
function mergePublishedConfig(dbConfig: Record<string, unknown>) {
  const merge = (fallback: unknown, override: unknown): unknown => {
    if (isPlainObject(fallback) && isPlainObject(override)) {
      const result: Record<string, unknown> = { ...fallback }
      for (const [key, value] of Object.entries(override)) {
        result[key] = key in result ? merge(result[key], value) : value
      }
      return result
    }
    return override === undefined ? fallback : override
  }

  return merge(staticConfig, dbConfig) as Record<string, any>
}

export async function GET() {
  try {
    const dbConfig = await getAllSiteConfig()
    if (dbConfig && Object.keys(dbConfig).length > 0) {
      return NextResponse.json(mergePublishedConfig(dbConfig), {
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      })
    }

    return NextResponse.json(staticConfig, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (err) {
    console.error('[site-config] GET error:', err)
    return NextResponse.json(staticConfig, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  }
}

// POST — ADMIN ONLY: update site content (texts, SEO, media, contact info)
export async function POST(request: NextRequest) {
  const auth = await requireAdminWithCsrf(request)
  if (!auth.authorized) return auth.error!

  try {
    const body = await request.json()

    // Validate that body is a non-null object
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid config data' }, { status: 400 })
    }

    // If the body has a "_section" and "_data" field, update only that section
    if (typeof body._section === 'string' && Object.prototype.hasOwnProperty.call(body, '_data')) {
      const section = body._section as string
      const sectionData = body._data

      const result = await updateSiteConfig(section, sectionData)
      if (result.success) {
        return NextResponse.json({ success: true })
      }
      return NextResponse.json({ error: result.error || 'Failed to save' }, { status: 500 })
    }

    // Full config update — update each section individually
    const results: Record<string, boolean> = {}
    for (const [section, sectionData] of Object.entries(body)) {
      if (section.startsWith('_')) continue
      const result = await updateSiteConfig(section, sectionData)
      results[section] = result.success
    }

    const allSuccess = Object.values(results).every(v => v)
    return NextResponse.json({ success: allSuccess, results })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save config'
    console.error('[site-config] POST error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
