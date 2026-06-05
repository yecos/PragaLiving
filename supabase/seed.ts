/**
 * PRAGA Living — Supabase Seed Script
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co \
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... \
 *   bun run supabase/seed.ts
 *
 * Populates: apartments (110), amenities (10), site_config sections,
 * and floor_plans from the local JSON data.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

// ── Supabase client ────────────────────────────────────────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '❌ Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY env vars.\n' +
      'Set them before running this script.'
  )
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ── Apartment generation (mirrors generateFallbackApartments) ──────
function generateApartments() {
  const apartments: Array<{
    name: string
    area: number
    bedrooms: number
    bathrooms: number
    floor: number
    view: string
    typology: string
    status: string
    price: number
    image: string | null
    plan_360_url: string | null
    features: string[] | null
  }> = []

  // 10 units per floor — areas from DWG
  const unitData = [
    // Top row (above corridor)
    { area: 74.75, beds: 3, baths: 2, typ: 'Tipo A · 3 Alcobas', view: 'Carrera 50', corner: true },
    { area: 57.0, beds: 2, baths: 1, typ: 'Tipo B · 2 Alcobas', view: 'Calle 133 Sur', corner: false },
    { area: 57.0, beds: 2, baths: 1, typ: 'Tipo B · 2 Alcobas', view: 'Atrio', corner: false },
    { area: 97.45, beds: 3, baths: 2, typ: 'Tipo A+ · 3 Alcobas', view: 'Panorámica', corner: true },
    // Bottom row (below corridor)
    { area: 33.4, beds: 1, baths: 1, typ: 'Tipo C · 1 Alcoba', view: 'Carrera 50', corner: false },
    { area: 35.6, beds: 1, baths: 1, typ: 'Tipo C · 1 Alcoba', view: 'Interior', corner: false },
    { area: 35.8, beds: 1, baths: 1, typ: 'Tipo C · 1 Alcoba', view: 'Atrio', corner: false },
    { area: 33.75, beds: 1, baths: 1, typ: 'Tipo C · 1 Alcoba', view: 'Calle 133 Sur', corner: false },
    { area: 33.05, beds: 1, baths: 1, typ: 'Tipo C · 1 Alcoba', view: 'Calle 133 Sur', corner: false },
    { area: 33.75, beds: 1, baths: 1, typ: 'Tipo C · 1 Alcoba', view: 'Carrera 50', corner: false },
  ]

  for (let floor = 1; floor <= 11; floor++) {
    for (let unit = 0; unit < 10; unit++) {
      const ud = unitData[unit]
      const aptNumber = floor * 100 + (unit + 1)
      const isTipoA = ud.corner
      const isTipoC = unit >= 4

      // Pricing — Caldas, Antioquia
      const basePrice = isTipoC ? 120_000_000 : ud.area > 80 ? 310_000_000 : 230_000_000
      const floorPremium = isTipoC
        ? (floor - 1) * 3_000_000
        : isTipoA
          ? (floor - 1) * 8_000_000
          : (floor - 1) * 5_000_000

      apartments.push({
        name: `Apto ${aptNumber}`,
        area: ud.area,
        bedrooms: ud.beds,
        bathrooms: ud.baths,
        floor,
        view: ud.view,
        typology: ud.typ,
        status: 'available',
        price: basePrice + floorPremium,
        image: isTipoA
          ? '/images/renders/apto-74.png'
          : isTipoC
            ? '/images/renders/studio-33.png'
            : '/images/renders/apto-57.png',
        plan_360_url: null,
        features:
          ud.beds >= 3
            ? ['3 alcobas', '2 baños completos', 'Sala-comedor', 'Cocina integral', 'Balcón', 'Zona de ropas', 'Acabados premium', ud.corner ? 'Unidad esquinera' : 'Vista panorámica']
            : ud.beds === 2
              ? ['2 alcobas', 'Baño completo', 'Sala-comedor', 'Cocina integral', 'Balcón', 'Zona de ropas', 'Acabados premium']
              : ['1 alcoba', 'Baño completo', 'Sala-comedor', 'Cocina integral', 'Zona de ropas', 'Acabados premium'],
      })
    }
  }

  // Mark some as sold/reserved for realism
  const soldIndices = [0, 7, 22, 48, 60, 84, 95, 105]
  const reservedIndices = [3, 14, 31, 42, 55, 67, 78, 99]
  for (const idx of soldIndices) {
    if (idx < apartments.length) apartments[idx].status = 'sold'
  }
  for (const idx of reservedIndices) {
    if (idx < apartments.length) apartments[idx].status = 'reserved'
  }

  return apartments
}

// ── Amenities (mirrors generateFallbackAmenities) ──────────────────
function generateAmenities() {
  return [
    { name: 'Ludoteca', description: 'Zona de juego y aprendizaje para los más pequeños. Segura, divertida y diseñada para estimular la creatividad infantil.', icon: 'Gamepad2', category: 'leisure', image: '/images/renders/atrio-main.png', active: true, order: 1 },
    { name: 'Gimnasio', description: 'Gimnasio equipado con máquinas de última generación, zona de pesos libres y área de entrenamiento funcional.', icon: 'Dumbbell', category: 'wellness', image: '/images/renders/gimnasio.png', active: true, order: 2 },
    { name: 'Vitality Pool', description: 'Piscina de vitalidad con hidromasaje y cromoterapia. Un oasis de relajación con vistas al atrio central.', icon: 'Waves', category: 'wellness', image: '/images/renders/vitality-pool.png', active: true, order: 3 },
    { name: 'Salón Social', description: 'Espacio elegante para reuniones, celebraciones y eventos. Con cocina de apoyo, terraza y capacidad para 40 personas.', icon: 'Wine', category: 'social', image: '/images/renders/salon-social.png', active: true, order: 4 },
    { name: 'Sauna', description: 'Sauna seco con maderas aromáticas para la relajación profunda. Un ritual de bienestar que renueva cuerpo y mente.', icon: 'Thermometer', category: 'wellness', image: '/images/renders/vitality-pool.png', active: true, order: 5 },
    { name: 'Baño Turco', description: 'Baño turco con aromaterapia para purificar y relajar. La tradición milenaria del hammam en tu edificio.', icon: 'Cloud', category: 'wellness', image: '/images/renders/vitality-pool.png', active: true, order: 6 },
    { name: 'Vestieres', description: 'Vestieres completos con casilleros, duchas y zona de cambio para uso antes y después de las amenidades.', icon: 'Shirt', category: 'wellness', image: '/images/renders/coworking.png', active: true, order: 7 },
    { name: 'Sala Coworking', description: 'Espacio de trabajo compartido con internet de alta velocidad, zonas de reunión individual y grupal para profesionales y emprendedores.', icon: 'Laptop', category: 'service', image: '/images/renders/coworking.png', active: true, order: 8 },
    { name: 'Lobby Doble Altura', description: 'Lobby de doble altura con recepción 24h, conexión directa al atrio central y diseño que marca la diferencia.', icon: 'DoorOpen', category: 'social', image: '/images/renders/lobby.png', active: true, order: 9 },
    { name: 'Terraza Cubierta / Jardín Elevado', description: 'Terraza panorámica en la cubierta con jardín elevado, zona lounge y vistas 360° de Caldas y el Valle de Aburrá.', icon: 'Sun', category: 'leisure', image: '/images/renders/hero-day.jpg', active: true, order: 10 },
  ]
}

// ── Site Config from JSON ──────────────────────────────────────────
function loadSiteConfigSections() {
  const configPath = join(process.cwd(), 'src', 'data', 'site-config.json')
  const raw = JSON.parse(readFileSync(configPath, 'utf-8'))
  const sections: Array<{ section: string; data: unknown }> = []

  for (const [key, value] of Object.entries(raw)) {
    sections.push({ section: key, data: value })
  }

  return sections
}

// ── Floor Plans from JSON ──────────────────────────────────────────
function loadFloorPlans() {
  const plansPath = join(process.cwd(), 'src', 'data', 'floor-plans.json')
  const raw = JSON.parse(readFileSync(plansPath, 'utf-8'))
  const plans: Array<{ floor_number: number; floor_name: string; image: string; apartments: unknown }> = []

  for (const floor of raw.floors) {
    // Extract numeric floor number from id like "piso-1", "s3", etc.
    let floorNumber = 0
    if (floor.id.startsWith('piso-')) {
      floorNumber = parseInt(floor.id.replace('piso-', ''), 10)
    } else if (floor.id.startsWith('s')) {
      floorNumber = -parseInt(floor.id.replace('s', ''), 10)
    } else if (floor.id === 'pv') {
      floorNumber = -10
    } else if (floor.id === 'acceso') {
      floorNumber = 0
    } else if (floor.id === 'comercial') {
      floorNumber = -11
    } else if (floor.id === 'social') {
      floorNumber = -12
    }

    plans.push({
      floor_number: floorNumber,
      floor_name: floor.name,
      image: floor.image || null,
      apartments: floor.apartments || [],
    })
  }

  return plans
}

// ── Main seed function ─────────────────────────────────────────────
async function main() {
  console.log('🌱 Seeding PRAGA Living Supabase database...\n')

  // 1. Seed apartments
  console.log('📦 Seeding apartments...')
  const apartments = generateApartments()
  console.log(`   Generated ${apartments.length} apartments`)

  // Insert in batches of 25
  const batchSize = 25
  for (let i = 0; i < apartments.length; i += batchSize) {
    const batch = apartments.slice(i, i + batchSize)
    const { error } = await supabase.from('apartments').insert(batch)
    if (error) {
      console.error(`   ❌ Error inserting apartments batch ${i / batchSize + 1}:`, error.message)
    } else {
      console.log(`   ✅ Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(apartments.length / batchSize)} inserted`)
    }
  }

  // 2. Seed amenities
  console.log('\n🏨 Seeding amenities...')
  const amenities = generateAmenities()
  const { error: amenityError } = await supabase.from('amenities').insert(amenities)
  if (amenityError) {
    console.error('   ❌ Error inserting amenities:', amenityError.message)
  } else {
    console.log(`   ✅ ${amenities.length} amenities inserted`)
  }

  // 3. Seed site_config
  console.log('\n⚙️  Seeding site_config...')
  const siteConfigSections = loadSiteConfigSections()
  const { error: configError } = await supabase.from('site_config').insert(siteConfigSections)
  if (configError) {
    console.error('   ❌ Error inserting site_config:', configError.message)
  } else {
    console.log(`   ✅ ${siteConfigSections.length} site_config sections inserted`)
  }

  // 4. Seed floor_plans
  console.log('\n🏗️  Seeding floor_plans...')
  const floorPlans = loadFloorPlans()
  const { error: plansError } = await supabase.from('floor_plans').insert(floorPlans)
  if (plansError) {
    console.error('   ❌ Error inserting floor_plans:', plansError.message)
  } else {
    console.log(`   ✅ ${floorPlans.length} floor_plans inserted`)
  }

  console.log('\n✨ Seed completed!')
}

main().catch((e) => {
  console.error('Fatal error:', e)
  process.exit(1)
})
