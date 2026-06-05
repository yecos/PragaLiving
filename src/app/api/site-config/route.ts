import { NextRequest, NextResponse } from 'next/server'
import { readFile, writeFile } from 'fs/promises'
import path from 'path'
import { getAllSiteConfig, updateSiteConfig } from '@/lib/data'

const CONFIG_PATH = path.join(process.cwd(), 'src', 'data', 'site-config.json')

export async function GET() {
  try {
    // Try Supabase-first via data layer
    const config = await getAllSiteConfig()
    if (config && Object.keys(config).length > 0) {
      return NextResponse.json(config)
    }

    // Fallback to file
    const data = await readFile(CONFIG_PATH, 'utf-8')
    return NextResponse.json(JSON.parse(data))
  } catch {
    return NextResponse.json({ error: 'Config file not found' }, { status: 404 })
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

      // Try Supabase first
      const result = await updateSiteConfig(section, sectionData)
      if (result.success) {
        // Also write to file as a backup/secondary store
        try {
          let currentConfig: Record<string, unknown> = {}
          try {
            const data = await readFile(CONFIG_PATH, 'utf-8')
            currentConfig = JSON.parse(data)
          } catch {
            // If file doesn't exist, start fresh
          }
          currentConfig[section] = sectionData
          await writeFile(CONFIG_PATH, JSON.stringify(currentConfig, null, 2), 'utf-8')
        } catch {
          // File write failure is non-critical if Supabase succeeded
        }
        return NextResponse.json({ success: true })
      }
    }

    // Full config update — write to file (Supabase section-by-section handled above)
    let currentConfig: Record<string, unknown> = {}
    try {
      const data = await readFile(CONFIG_PATH, 'utf-8')
      currentConfig = JSON.parse(data)
    } catch {
      // If file doesn't exist, start fresh
    }

    if (body._section && body._data) {
      const section = body._section as string
      const sectionData = body._data
      currentConfig[section] = sectionData
    } else {
      currentConfig = body
    }

    const jsonStr = JSON.stringify(currentConfig, null, 2)
    await writeFile(CONFIG_PATH, jsonStr, 'utf-8')

    return NextResponse.json({ success: true, config: currentConfig })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save config'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
