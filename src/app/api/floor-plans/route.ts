import { NextRequest, NextResponse } from 'next/server'
import { getApartments, getCommercialPricing, getFloorPlans, saveFloorPlansConfig } from '@/lib/data'
import { requireAdminWithCsrf } from '@/lib/auth-guard'
import { COMMERCIAL_UNITS, commercialPriceForUnit, type CommercialPricing } from '@/data/commercial-pricing'

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

function commercialUnitNumber(zone: FloorApartment): number | null {
  const idMatch = zone.id.match(/apto-(\d{1,2})$/i)
  if (idMatch) return Number(idMatch[1])

  const nameMatch = zone.name.match(/(?:apto|apartamento)\s*(\d{1,3})/i)
  if (!nameMatch) return null

  const raw = Number(nameMatch[1])
  return raw > 10 ? raw % 100 : raw
}

function officialCommercialPrice(
  zone: FloorApartment,
  floor: FloorConfig,
  pricing: CommercialPricing,
): number | null {
  const level = floorNumberFromFloor(floor)
  const unitNumber = commercialUnitNumber(zone)
  if (level === null || level < 5 || level > 16 || unitNumber === null) return null
  return commercialPriceForUnit(level, unitNumber, pricing)
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
    const [floorsRaw, apartments, pricing] = await Promise.all([
      getFloorPlans(),
      getApartments(),
      getCommercialPricing(),
    ])

    const floors = (floorsRaw as FloorConfig[]).map((floor) => {
      const level = floorNumberFromFloor(floor)
      const premium = level !== null ? (pricing.heightPremium[String(level)] ?? 0) : 0
      return {
      ...floor,
      typeLabel: floor.isResidential
        ? `Residencial · ${floor.apartments?.length || 0} unidades · ${premium > 0 ? `Prima altura ${formatPrice(premium)}` : 'Sin prima de altura'}`
        : floor.typeLabel,
      apartments: (floor.apartments || []).map((zone) => {
        const apartment = findApartmentRecord(zone, floor, apartments)
        const unitNumber = commercialUnitNumber(zone)
        const template = unitNumber !== null
          ? COMMERCIAL_UNITS.find((item) => item.unit === unitNumber)
          : undefined
        const officialPrice = officialCommercialPrice(zone, floor, pricing)

        return {
          ...zone,
          ...(template ? {
            name: `Apto ${String(template.unit).padStart(2, '0')}`,
            area: template.area,
            bedrooms: template.bedrooms,
            bathrooms: template.bathrooms,
            typology: template.typology,
          } : {}),
          ...(apartment ? {
            apartmentId: apartment.id,
            status: apartment.status,
          } : {}),
          price: officialPrice ?? zone.price,
          priceRange: officialPrice !== null ? formatPrice(officialPrice) : zone.priceRange,
        }
      }),
    }})

    return NextResponse.json({ floors }, {
      ...floor,
      apartments: (floor.apartments || []).map((zone) => {
        const apartment = findApartmentRecord(zone, floor, apartments)
        const level = floorNumberFromFloor(floor)
        const unitNumber = commercialUnitNumber(zone)
        const template = unitNumber !== null
          ? COMMERCIAL_UNITS.find((item) => item.unit === unitNumber)
          : undefined
        const officialPrice = template && level !== null
          ? apartmentCommercialPrice(level, template.area, template.pricePerM2)
          : null

        return {
          ...zone,
          ...(template ? {
            name: `Apto ${String(template.unit).padStart(2, '0')}`,
            area: template.area,
            bedrooms: template.bedrooms,
            bathrooms: template.bathrooms,
            typology: template.typology,
          } : {}),
          ...(apartment ? {
            apartmentId: apartment.id,
            status: apartment.status,
          } : {}),
          price: officialPrice ?? zone.price,
          priceRange: officialPrice !== null ? formatPrice(officialPrice) : zone.priceRange,
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
