import { NextRequest, NextResponse } from 'next/server'
import { getAllSiteConfig, updateSiteConfig } from '@/lib/data'
import staticSiteConfig from '@/data/site-config.json'
import { requireAdmin, requireAdminWithCsrf } from '@/lib/auth-guard'

const staticConfig = staticSiteConfig as Record<string, any>

function mergePublishedConfig(dbConfig: Record<string, unknown>) {
  const merged = { ...staticConfig, ...dbConfig } as Record<string, any>
  const dbGeneral = (dbConfig.general || {}) as Record<string, any>
  const dbContacto = (dbConfig.contacto || {}) as Record<string, any>
  const dbFooter = (dbConfig.footer || {}) as Record<string, any>

  // Contact details and the public gallery are maintained in the repository.
  // Keep these values consistent even when an older DB seed is still present.
  merged.general = {
    ...staticConfig.general,
    ...dbGeneral,
    phone: staticConfig.general.phone,
    whatsapp: staticConfig.general.whatsapp,
    email: staticConfig.general.email,
  }
  merged.contacto = {
    ...staticConfig.contacto,
    ...dbContacto,
    methods: staticConfig.contacto.methods,
    notificationEmail: staticConfig.contacto.notificationEmail,
  }
  merged.footer = {
    ...staticConfig.footer,
    ...dbFooter,
    linkGroups: staticConfig.footer.linkGroups,
  }
  merged.galeria = staticConfig.galeria

  return merged
}

export async function GET() {
  try {
    const dbConfig = await getAllSiteConfig()
    if (dbConfig && Object.keys(dbConfig).length > 0) {
      return NextResponse.json(mergePublishedConfig(dbConfig))
    }

    return NextResponse.json(staticConfig)
  } catch (err) {
    console.error('[site-config] GET error:', err)
    return NextResponse.json(staticConfig)
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
    if (body._section && body._data) {
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
