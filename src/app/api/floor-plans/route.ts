import { NextRequest, NextResponse } from 'next/server'
import { getApartments, getFloorPlans, saveFloorPlansConfig } from '@/lib/data'
import { requireAdminWithCsrf } from '@/lib/auth-guard'

type ApartmentRecord = Awaited<ReturnType<typeof getApartments>>[number]

type FloorApartment = {
  id: string
  apartmentId?: string
  name: string
  area: number
  bedrooms: number
  bathrooms: number
  typology: string
  priceRange: string
  price?: number
  status: string
  view: string
  polygon: number[][]
}

type FloorConfig = {
  id: string
  name: string
  typeLabel: string
  isResidential: boolean
  image: string
  apartments: FloorApartment[]
}

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function floorNumberFromFloor(floor: FloorConfig): number | null {
  const idMatch = floor.id.match(/(?:piso-)?(\d+)/i)
  if (idMatch) return Number(idMatch[1])

  const nameMatch = floor.name.match(/(\d+)/)
  return nameMatch ? Number(nameMatch[1]) : null
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(price)
}

function findApartmentRecord(
  zone: FloorApartment,
  floor: FloorConfig,
  apartments: ApartmentRecord[],
): ApartmentRecord | undefined {
  if (zone.apartmentId) {
    const byId = apartments.find((apartment) => apartment.id === zone.apartmentId)
    if (byId) return byId
  }

  const floorNumber = floorNumberFromFloor(floor)
  const sameFloor = floorNumber === null
    ? apartments
    : apartments.filter((apartment) => apartment.floor === floorNumber)

  const normalizedName = normalize(zone.name)
  const byName = sameFloor.find((apartment) => normalize(apartment.name) === normalizedName)
  if (byName) return byName

  return sameFloor.find((apartment) =>
    Math.abs(apartment.area - zone.area) < 0.25 &&
    normalize(apartment.typology) === normalize(zone.typology)
  )
}

export async function GET() {
  try {
    const [floorsRaw, apartments] = await Promise.all([
      getFloorPlans(),
      getApartments(),
    ])

    const floors = (floorsRaw as FloorConfig[]).map((floor) => ({
      ...floor,
      apartments: (floor.apartments || []).map((zone) => {
        const apartment = findApartmentRecord(zone, floor, apartments)
        if (!apartment) return zone

        return {
          ...zone,
          apartmentId: apartment.id,
          name: apartment.name,
          area: apartment.area,
          bedrooms: apartment.bedrooms,
          bathrooms: apartment.bathrooms,
          typology: apartment.typology,
          status: apartment.status,
          view: apartment.view,
          price: apartment.price,
          priceRange: apartment.price > 0 ? formatPrice(apartment.price) : zone.priceRange,
        }
      }),
    }))

    return NextResponse.json({ floors }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (err) {
    console.error('[floor-plans] GET error:', err)
    return NextResponse.json({ floors: [] }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  }
}

// POST — ADMIN ONLY: save floor plan geometry/overlays.
// Commercial data (price/status) comes from apartments and is merged on GET.
export async function POST(request: NextRequest) {
  const auth = await requireAdminWithCsrf(request)
  if (!auth.authorized) return auth.error!

  try {
    const body = await request.json()

    if (!body.floors || !Array.isArray(body.floors)) {
      return NextResponse.json(
        { success: false, error: 'Request body must have a "floors" array' },
        { status: 400 }
      )
    }

    const result = await saveFloorPlansConfig(body)

    if (result.success) {
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({
      success: false,
      error: result.error || 'Failed to persist floor plans',
    }, { status: 500 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error saving floor plans'
    console.error('[floor-plans] POST error:', error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
