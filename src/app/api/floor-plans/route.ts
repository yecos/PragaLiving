import { NextRequest, NextResponse } from 'next/server'
import { getFloorPlans, saveFloorPlansConfig } from '@/lib/data'

export async function GET() {
  try {
    // Try Supabase-first via data layer
    const floors = await getFloorPlans()
    if (floors && floors.length > 0) {
      return NextResponse.json({ floors })
    }

    // No data found anywhere
    return NextResponse.json({ floors: [] })
  } catch {
    return NextResponse.json({ floors: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate that body has floors array
    if (!body.floors || !Array.isArray(body.floors)) {
      return NextResponse.json(
        { success: false, error: 'Request body must have a "floors" array' },
        { status: 400 }
      )
    }

    // Save entire config to Supabase via site_config (persists on Vercel)
    const result = await saveFloorPlansConfig(body)

    if (result.success) {
      return NextResponse.json({ success: true })
    }

    // If Supabase save failed, still return what happened
    return NextResponse.json({
      success: false,
      error: result.error || 'Failed to persist to Supabase',
    }, { status: 500 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error saving floor plans'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
