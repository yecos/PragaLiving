import { NextRequest, NextResponse } from 'next/server'
import { getAllSiteConfig, updateSiteConfig } from '@/lib/data'

export async function GET() {
  try {
    // Try Supabase-first via data layer
    const config = await getAllSiteConfig()
    if (config && Object.keys(config).length > 0) {
      return NextResponse.json(config)
    }

    // No data found
    return NextResponse.json({})
  } catch {
    return NextResponse.json({ error: 'Config not found' }, { status: 404 })
  }
}

export async function POST(request: NextRequest) {
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
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
