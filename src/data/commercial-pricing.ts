// PRAGA Living — estructura comercial central.
// Las áreas/tipologías son fijas; los valores comerciales se editan desde Admin.

export const RESIDENTIAL_LEVELS = Array.from({ length: 12 }, (_, i) => i + 5)

export type CommercialPricing = {
  currency: 'COP'
  apartmentM2: number
  studioM2: number
  parkingCar: number
  parkingMoto: number
  utilitySmall: number
  utilityLarge: number
  heightPremium: Record<string, number>
}

export const DEFAULT_COMMERCIAL_PRICING: CommercialPricing = {
  currency: 'COP',
  apartmentM2: 7_000_000,
  studioM2: 7_500_000,
  parkingCar: 60_000_000,
  parkingMoto: 15_000_000,
  utilitySmall: 15_000_000,
  utilityLarge: 20_000_000,
  heightPremium: {
    '5': 0,
    '6': 0,
    '7': 0,
    '8': 0,
    '9': 1_000_000,
    '10': 2_000_000,
    '11': 3_000_000,
    '12': 4_000_000,
    '13': 5_000_000,
    '14': 6_000_000,
    '15': 7_000_000,
    '16': 8_000_000,
  },
}

export const HEIGHT_PREMIUM: Record<number, number> = Object.fromEntries(
  Object.entries(DEFAULT_COMMERCIAL_PRICING.heightPremium).map(([level, value]) => [Number(level), value]),
) as Record<number, number>

export const COMMERCIAL_UNITS = [
  { unit: 1, area: 78.51, bedrooms: 3, bathrooms: 2, typology: '78.51 m²', category: 'apartment', pricePerM2: 7_000_000 },
  { unit: 2, area: 60, bedrooms: 2, bathrooms: 1, typology: '60 m²', category: 'apartment', pricePerM2: 7_000_000 },
  { unit: 3, area: 60, bedrooms: 2, bathrooms: 1, typology: '60 m²', category: 'apartment', pricePerM2: 7_000_000 },
  { unit: 4, area: 104, bedrooms: 3, bathrooms: 2, typology: '104 m²', category: 'apartment', pricePerM2: 7_000_000 },
  { unit: 5, area: 34.28, bedrooms: 1, bathrooms: 1, typology: '34.28 m²', category: 'studio', pricePerM2: 7_500_000 },
  { unit: 6, area: 35.6, bedrooms: 1, bathrooms: 1, typology: '35.6 m²', category: 'studio', pricePerM2: 7_500_000 },
  { unit: 7, area: 35.8, bedrooms: 1, bathrooms: 1, typology: '35.8 m²', category: 'studio', pricePerM2: 7_500_000 },
  { unit: 8, area: 33.75, bedrooms: 1, bathrooms: 1, typology: '33.75 m²', category: 'studio', pricePerM2: 7_500_000 },
  { unit: 9, area: 33.05, bedrooms: 1, bathrooms: 1, typology: '33.05 m²', category: 'studio', pricePerM2: 7_500_000 },
  { unit: 10, area: 33.75, bedrooms: 1, bathrooms: 1, typology: '33.75 m²', category: 'studio', pricePerM2: 7_500_000 },
] as const

export const COMMERCIAL_EXTRAS = {
  parkingCar: DEFAULT_COMMERCIAL_PRICING.parkingCar,
  parkingMoto: DEFAULT_COMMERCIAL_PRICING.parkingMoto,
  utilitySmall: DEFAULT_COMMERCIAL_PRICING.utilitySmall,
  utilityLarge: DEFAULT_COMMERCIAL_PRICING.utilityLarge,
} as const

function nonNegativeNumber(value: unknown, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

export function normalizeCommercialPricing(value: unknown): CommercialPricing {
  const input = value && typeof value === 'object' ? value as Record<string, unknown> : {}
  const premiums = input.heightPremium && typeof input.heightPremium === 'object'
    ? input.heightPremium as Record<string, unknown>
    : {}

  const heightPremium: Record<string, number> = {}
  for (const level of RESIDENTIAL_LEVELS) {
    const key = String(level)
    heightPremium[key] = nonNegativeNumber(
      premiums[key],
      DEFAULT_COMMERCIAL_PRICING.heightPremium[key],
    )
  }

  return {
    currency: 'COP',
    apartmentM2: nonNegativeNumber(input.apartmentM2, DEFAULT_COMMERCIAL_PRICING.apartmentM2),
    studioM2: nonNegativeNumber(input.studioM2, DEFAULT_COMMERCIAL_PRICING.studioM2),
    parkingCar: nonNegativeNumber(input.parkingCar, DEFAULT_COMMERCIAL_PRICING.parkingCar),
    parkingMoto: nonNegativeNumber(input.parkingMoto, DEFAULT_COMMERCIAL_PRICING.parkingMoto),
    utilitySmall: nonNegativeNumber(input.utilitySmall, DEFAULT_COMMERCIAL_PRICING.utilitySmall),
    utilityLarge: nonNegativeNumber(input.utilityLarge, DEFAULT_COMMERCIAL_PRICING.utilityLarge),
    heightPremium,
  }
}

export function pricePerM2ForUnit(unitNumber: number, pricing: CommercialPricing) {
  const unit = COMMERCIAL_UNITS.find((item) => item.unit === unitNumber)
  if (!unit) return 0
  return unit.category === 'studio' ? pricing.studioM2 : pricing.apartmentM2
}

export function commercialPriceForUnit(level: number, unitNumber: number, pricing: CommercialPricing) {
  const unit = COMMERCIAL_UNITS.find((item) => item.unit === unitNumber)
  if (!unit) return null

  const pricePerM2 = pricePerM2ForUnit(unitNumber, pricing)
  const premium = pricing.heightPremium[String(level)] ?? 0
  return Math.round(unit.area * pricePerM2 + premium)
}

// Legacy helper used by seed/static data. Runtime pricing should prefer commercialPriceForUnit().
export function apartmentCommercialPrice(level: number, area: number, pricePerM2: number) {
  return Math.round(area * pricePerM2 + (HEIGHT_PREMIUM[level] ?? 0))
}

export function formatCop(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)
}
