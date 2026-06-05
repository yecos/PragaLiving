import { NextRequest, NextResponse } from 'next/server'
import { readFile, writeFile } from 'fs/promises'
import path from 'path'

const DATA_PATH = path.join(process.cwd(), 'src', 'data', 'floor-plans.json')

export async function GET() {
  try {
    const data = await readFile(DATA_PATH, 'utf-8')
    return NextResponse.json(JSON.parse(data))
  } catch {
    return NextResponse.json({ floors: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    await writeFile(DATA_PATH, JSON.stringify(body, null, 2), 'utf-8')
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error saving floor plans'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
