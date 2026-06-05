import { NextRequest, NextResponse } from 'next/server'
import { readFile, writeFile } from 'fs/promises'
import path from 'path'
import { getFloorPlans, updateFloorPlan } from '@/lib/data'

const DATA_PATH = path.join(process.cwd(), 'src', 'data', 'floor-plans.json')

export async function GET() {
  try {
    // Try Supabase-first via data layer
    const floors = await getFloorPlans()
    if (floors && floors.length > 0) {
      return NextResponse.json({ floors })
    }

    // Fallback to file
    const data = await readFile(DATA_PATH, 'utf-8')
    return NextResponse.json(JSON.parse(data))
  } catch {
    return NextResponse.json({ floors: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Try to update individual floor plans in Supabase if the body has floors array
    if (body.floors && Array.isArray(body.floors)) {
      // Save to file as well (backup)
      await writeFile(DATA_PATH, JSON.stringify(body, null, 2), 'utf-8')

      // Try Supabase updates
      for (const floor of body.floors) {
        if (floor.floorNumber !== undefined && (floor.image || floor.apartments)) {
          await updateFloorPlan(floor.floorNumber, {
            image: floor.image,
            apartments: floor.apartments,
          })
        }
      }
    } else {
      // Just write to file
      await writeFile(DATA_PATH, JSON.stringify(body, null, 2), 'utf-8')
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error saving floor plans'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
