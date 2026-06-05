import { NextRequest, NextResponse } from 'next/server'
import { readFile, writeFile } from 'fs/promises'
import path from 'path'

const CONFIG_PATH = path.join(process.cwd(), 'src', 'data', 'site-config.json')

export async function GET() {
  try {
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

    // Read current config to merge
    let currentConfig: Record<string, unknown> = {}
    try {
      const data = await readFile(CONFIG_PATH, 'utf-8')
      currentConfig = JSON.parse(data)
    } catch {
      // If file doesn't exist, start fresh
    }

    // If the body has a "section" and "data" field, merge only that section
    if (body._section && body._data) {
      const section = body._section as string
      const sectionData = body._data
      currentConfig[section] = sectionData
    } else {
      // Full config update
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
