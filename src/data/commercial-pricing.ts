// PRAGA Living — tabla comercial oficial recibida en septiembre de 2026.
// Fuente única para áreas, valores base, prima de altura y adicionales.

export const RESIDENTIAL_LEVELS = Array.from({ length: 12 }, (_, i) => i + 5)

export const HEIGHT_PREMIUM: Record<number, number> = {
  5: 0, 6: 0, 7: 0, 8: 0,
  9: 1_000_000, 10: 2_000_000, 11: 3_000_000, 12: 4_000_000,
  13: 5_000_000, 14: 6_000_000, 15: 7_000_000, 16: 8_000_000,
}

export const COMMERCIAL_UNITS = [
  { unit: 1, area: 78.51, bedrooms: 3, bathrooms: 2, typology: '78.51 m²', pricePerM2: 7_000_000 },
  { unit: 2, area: 60, bedrooms: 2, bathrooms: 1, typology: '60 m²', pricePerM2: 7_000_000 },
  { unit: 3, area: 60, bedrooms: 2, bathrooms: 1, typology: '60 m²', pricePerM2: 7_000_000 },
  { unit: 4, area: 104, bedrooms: 3, bathrooms: 2, typology: '104 m²', pricePerM2: 7_000_000 },
  { unit: 5, area: 34.28, bedrooms: 1, bathrooms: 1, typology: '34.28 m²', pricePerM2: 7_500_000 },
  { unit: 6, area: 35.6, bedrooms: 1, bathrooms: 1, typology: '35.6 m²', pricePerM2: 7_500_000 },
  { unit: 7, area: 35.8, bedrooms: 1, bathrooms: 1, typology: '35.8 m²', pricePerM2: 7_500_000 },
  { unit: 8, area: 33.75, bedrooms: 1, bathrooms: 1, typology: '33.75 m²', pricePerM2: 7_500_000 },
  { unit: 9, area: 33.05, bedrooms: 1, bathrooms: 1, typology: '33.05 m²', pricePerM2: 7_500_000 },
  { unit: 10, area: 33.75, bedrooms: 1, bathrooms: 1, typology: '33.75 m²', pricePerM2: 7_500_000 },
] as const

export const COMMERCIAL_EXTRAS = {
  parkingCar: 60_000_000,
  parkingMoto: 15_000_000,
  utilitySmall: 15_000_000,
  utilityLarge: 20_000_000,
} as const

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
