// Centralized data layer that works both with Prisma (local dev) and hardcoded fallback (Vercel production)
// Vercel serverless functions can't access local SQLite files, so we provide fallback data

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ==========================================
// HARDCODED FALLBACK DATA (for production)
// ==========================================

const unitCode = (floor: number, unit: number) => `P${floor}-${String(unit).padStart(2, '0')}`

function generateFallbackApartments() {
  const apartments: Array<{
    id: string; name: string; area: number; bedrooms: number; bathrooms: number;
    floor: number; view: string; typology: string; status: string; price: number;
    image: string | null; plan360Url: string | null; features: string | null;
  }> = []

  let uid = 1
  const mkId = () => `fallback-${uid++}`

  // 4 apartments per floor, 12 residential floors = 48 total
  // West wing (smaller): 2 apartments · East wing (larger): 2 apartments
  // Unit 1,2 = West wing (Atrio / Calle 133 Sur) · Unit 3,4 = East wing (Autopista Sur / Valle de Aburrá)
  const views4 = ['Atrio', 'Calle 133 Sur', 'Autopista Sur', 'Valle de Aburrá']

  // ─── Tipo A: Pisos 1-4 — 2 aptos 1 alcoba (oeste) + 2 aptos 2 alcobas (este) — 16 apartments ───
  const tipoAWestAreas = [68.50, 71.20, 69.80, 72.40] // 1 alcoba ~65-75m²
  const tipoAEastAreas = [87.30, 89.60, 88.10, 91.50] // 2 alcobas ~85-95m²
  for (let floor = 1; floor <= 4; floor++) {
    // West wing: 2 apartments of 1 alcoba
    for (let unit = 1; unit <= 2; unit++) {
      const aptNumber = floor * 100 + unit
      const area = tipoAWestAreas[floor - 1] + (unit - 1) * 2.5
      const basePrice = 180_000_000
      const floorPremium = (floor - 1) * 8_000_000
      const unitPremium = (unit - 1) * 3_000_000
      apartments.push({
        id: mkId(),
        name: `Apto ${aptNumber}`,
        area,
        bedrooms: 1,
        bathrooms: 1,
        floor,
        view: views4[unit - 1],
        typology: 'Tipo A · 1 Alcoba',
        status: 'available',
        price: basePrice + floorPremium + unitPremium,
        image: '/images/renders/apto-57.png',
        plan360Url: null,
        features: JSON.stringify(['1 alcoba', 'Baño completo', 'Sala', 'Cocina integral', 'Zona de ropas', 'Acabados premium']),
      })
    }
    // East wing: 2 apartments of 2 alcobas
    for (let unit = 3; unit <= 4; unit++) {
      const aptNumber = floor * 100 + unit
      const area = tipoAEastAreas[floor - 1] + (unit - 3) * 2.8
      const basePrice = 195_000_000
      const floorPremium = (floor - 1) * 6_000_000
      const unitPremium = (unit - 3) * 4_000_000
      apartments.push({
        id: mkId(),
        name: `Apto ${aptNumber}`,
        area,
        bedrooms: 2,
        bathrooms: 2,
        floor,
        view: views4[unit - 1],
        typology: 'Tipo A · 2 Alcobas',
        status: 'available',
        price: basePrice + floorPremium + unitPremium,
        image: '/images/renders/apto-74.png',
        plan360Url: null,
        features: JSON.stringify(['2 alcobas', '2 baños completos', 'Sala-comedor', 'Cocina integral', 'Balcón', 'Zona de ropas', 'Acabados premium']),
      })
    }
  }

  // ─── Tipo B: Pisos 5-8 — 2 aptos 1 alcoba (oeste) + 2 aptos 2 alcobas (este) — 16 apartments ───
  const tipoBWestAreas = [72.40, 74.80, 73.50, 76.10] // 1 alcoba ~70-78m²
  const tipoBEastAreas = [91.20, 93.50, 92.80, 96.40] // 2 alcobas ~90-100m²
  for (let floor = 5; floor <= 8; floor++) {
    // West wing: 2 apartments of 1 alcoba
    for (let unit = 1; unit <= 2; unit++) {
      const aptNumber = floor * 100 + unit
      const area = tipoBWestAreas[floor - 5] + (unit - 1) * 3.2
      const basePrice = 250_000_000
      const floorPremium = (floor - 5) * 12_000_000
      const unitPremium = (unit - 1) * 5_000_000
      apartments.push({
        id: mkId(),
        name: `Apto ${aptNumber}`,
        area,
        bedrooms: 1,
        bathrooms: 1,
        floor,
        view: views4[unit - 1],
        typology: 'Tipo B · 1 Alcoba',
        status: 'available',
        price: basePrice + floorPremium + unitPremium,
        image: '/images/renders/apto-57.png',
        plan360Url: null,
        features: JSON.stringify(['1 alcoba', 'Baño completo', 'Sala', 'Cocina integral', 'Balcón con vegetación', 'Zona de ropas', 'Acabados premium']),
      })
    }
    // East wing: 2 apartments of 2 alcobas
    for (let unit = 3; unit <= 4; unit++) {
      const aptNumber = floor * 100 + unit
      const area = tipoBEastAreas[floor - 5] + (unit - 3) * 3.5
      const basePrice = 280_000_000
      const floorPremium = (floor - 5) * 10_000_000
      const unitPremium = (unit - 3) * 6_000_000
      apartments.push({
        id: mkId(),
        name: `Apto ${aptNumber}`,
        area,
        bedrooms: 2,
        bathrooms: 2,
        floor,
        view: views4[unit - 1],
        typology: 'Tipo B · 2 Alcobas',
        status: 'available',
        price: basePrice + floorPremium + unitPremium,
        image: '/images/renders/apto-74.png',
        plan360Url: null,
        features: JSON.stringify(['2 alcobas', '2 baños completos', 'Sala-comedor', 'Cocina integral', 'Balcón con vegetación', 'Zona de ropas', 'Acabados premium']),
      })
    }
  }

  // ─── Tipo B+: Pisos 9-12 — 2 aptos 2 alcobas (oeste) + 2 aptos 3 alcobas vestier (este) — 16 apartments ───
  const tipoBPlusWestAreas = [88.50, 90.80, 89.60, 92.30] // 2 alcobas ~85-95m²
  const tipoBPlusEastAreas = [108.40, 111.20, 109.80, 114.60] // 3 alcobas vestier ~105-120m²
  for (let floor = 9; floor <= 12; floor++) {
    // West wing: 2 apartments of 2 alcobas
    for (let unit = 1; unit <= 2; unit++) {
      const aptNumber = floor * 100 + unit
      const area = tipoBPlusWestAreas[floor - 9] + (unit - 1) * 3.5
      const premiumMultiplier = 1.05 + (floor - 9) * 0.03
      const basePrice = Math.round(350_000_000 * premiumMultiplier)
      const floorPremium = (floor - 9) * 8_000_000
      const unitPremium = (unit - 1) * 6_000_000
      apartments.push({
        id: mkId(),
        name: `Apto ${aptNumber}`,
        area,
        bedrooms: 2,
        bathrooms: 2,
        floor,
        view: views4[unit - 1],
        typology: 'Tipo B+ · 2 Alcobas',
        status: 'available',
        price: basePrice + floorPremium + unitPremium,
        image: '/images/renders/apto-74.png',
        plan360Url: null,
        features: JSON.stringify(['2 alcobas', '2 baños completos', 'Sala-comedor con balcón', 'Cocina integrada', 'Balcón jardín', 'Zona de ropas', 'Acabados premium', 'Piso porcelánico']),
      })
    }
    // East wing: 2 apartments of 3 alcobas con vestier
    for (let unit = 3; unit <= 4; unit++) {
      const aptNumber = floor * 100 + unit
      const area = tipoBPlusEastAreas[floor - 9] + (unit - 3) * 4.2
      const premiumMultiplier = 1.10 + (floor - 9) * 0.04
      const basePrice = Math.round(420_000_000 * premiumMultiplier)
      const floorPremium = (floor - 9) * 10_000_000
      const unitPremium = (unit - 3) * 8_000_000
      apartments.push({
        id: mkId(),
        name: `Apto ${aptNumber}`,
        area,
        bedrooms: 3,
        bathrooms: 2,
        floor,
        view: views4[unit - 1],
        typology: 'Tipo B+ · 3 Alcobas Vestier',
        status: 'available',
        price: basePrice + floorPremium + unitPremium,
        image: '/images/renders/apto-97.png',
        plan360Url: null,
        features: JSON.stringify(['3 alcobas con vestier', '2 baños completos', 'Sala-comedor con balcón', 'Cocina integrada', 'Balcón jardín', 'Zona de ropas', 'Walk-in closet', 'Acabados premium', 'Piso porcelánico']),
      })
    }
  }

  // Mark some as sold/reserved for realism (48 apartments total)
  const soldIndices = [0, 7, 15, 23, 35, 44]
  const reservedIndices = [3, 11, 19, 28, 38, 46]
  for (const idx of soldIndices) {
    if (idx < apartments.length) apartments[idx].status = 'sold'
  }
  for (const idx of reservedIndices) {
    if (idx < apartments.length) apartments[idx].status = 'reserved'
  }

  return apartments
}

function generateFallbackAmenities() {
  return [
    { id: 'fa-1', name: 'Ludoteca', description: 'Zona de juego y aprendizaje para los más pequeños. Segura, divertida y diseñada para estimular la creatividad infantil.', icon: 'Gamepad2', category: 'leisure', image: '/images/renders/atrio-main.png', active: true, order: 1 },
    { id: 'fa-2', name: 'Gimnasio', description: 'Gimnasio equipado con máquinas de última generación, zona de pesos libres y área de entrenamiento funcional.', icon: 'Dumbbell', category: 'wellness', image: '/images/renders/gimnasio.png', active: true, order: 2 },
    { id: 'fa-3', name: 'Vitality Pool', description: 'Piscina de vitalidad con hidromasaje y cromoterapia. Un oasis de relajación con vistas al patio central.', icon: 'Waves', category: 'wellness', image: '/images/renders/vitality-pool.png', active: true, order: 3 },
    { id: 'fa-4', name: 'Salón Social', description: 'Espacio elegante para reuniones, celebraciones y eventos. Con cocina de apoyo, terraza y capacidad para 40 personas.', icon: 'Wine', category: 'social', image: '/images/renders/salon-social.png', active: true, order: 4 },
    { id: 'fa-5', name: 'Sauna', description: 'Sauna seco con maderas aromáticas para la relajación profunda. Un ritual de bienestar que renueva cuerpo y mente.', icon: 'Thermometer', category: 'wellness', image: '/images/renders/vitality-pool.png', active: true, order: 5 },
    { id: 'fa-6', name: 'Baño Turco', description: 'Baño turco con aromaterapia para purificar y relajar. La tradición milenaria del hammam en tu edificio.', icon: 'Cloud', category: 'wellness', image: '/images/renders/vitality-pool.png', active: true, order: 6 },
    { id: 'fa-7', name: 'Vestieres', description: 'Vestieres completos con casilleros, duchas y zona de cambio para uso antes y después de las amenidades.', icon: 'Shirt', category: 'wellness', image: '/images/renders/coworking.png', active: true, order: 7 },
    { id: 'fa-8', name: 'Terraza Cubierta', description: 'Terraza panorámica en la cubierta con jardín elevado, zona lounge y vistas 360° de Caldas y el Valle de Aburrá.', icon: 'Sun', category: 'leisure', image: '/images/renders/hero-day.jpg', active: true, order: 8 },
    { id: 'fa-9', name: 'Lobby Doble Altura', description: 'Lobby de doble altura con recepción 24h, conexión directa al atrio central y diseño que marca la diferencia.', icon: 'DoorOpen', category: 'social', image: '/images/renders/lobby.png', active: true, order: 9 },
    { id: 'fa-10', name: 'Parqueaderos', description: 'Tres niveles de sótano con 17 parqueaderos por nivel para residentes, visitantes y áreas de bodegas.', icon: 'Car', category: 'service', image: '/images/renders/exterior-dusk.png', active: true, order: 10 },
  ]
}

const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'praga2024',
  name: 'Administrador PRAGA',
  role: 'admin',
}

// In-memory stores for fallback mode (leads created in production)
let fallbackLeads: Array<{
  id: string; name: string; phone: string; email: string;
  interest: string | null; message: string | null; source: string;
  status: string; notes: string | null; createdAt: string;
}> = []

// Track apartment status/price overrides in fallback mode
const fallbackApartmentOverrides = new Map<string, { status?: string; price?: number }>()

// ==========================================
// HELPER: Try Prisma, fallback to hardcoded
// ==========================================

let dbAvailable: boolean | null = null

async function checkDb(): Promise<boolean> {
  if (dbAvailable !== null) return dbAvailable
  try {
    await prisma.$queryRaw`SELECT 1`
    dbAvailable = true
    return true
  } catch {
    dbAvailable = false
    return false
  }
}

// ==========================================
// EXPORTED DATA FUNCTIONS
// ==========================================

export async function getApartments(filters?: { status?: string; floor?: number; typology?: string }) {
  const hasDb = await checkDb()

  if (hasDb) {
    try {
      const where: Record<string, unknown> = {}
      if (filters?.status) where.status = filters.status
      if (filters?.floor) where.floor = filters.floor
      if (filters?.typology) where.typology = filters.typology

      const apartments = await prisma.apartment.findMany({
        where,
        orderBy: [{ floor: 'asc' }, { name: 'asc' }],
      })
      return apartments
    } catch {
      // Fall through to fallback
    }
  }

  // Fallback
  let apts = generateFallbackApartments()
  if (filters?.status) apts = apts.filter(a => a.status === filters.status)
  if (filters?.floor) apts = apts.filter(a => a.floor === filters.floor)
  if (filters?.typology) apts = apts.filter(a => a.typology === filters.typology)

  // Apply overrides
  return apts.map(a => {
    const override = fallbackApartmentOverrides.get(a.id)
    return override ? { ...a, ...override } : a
  })
}

export async function getApartmentById(id: string) {
  const hasDb = await checkDb()

  if (hasDb) {
    try {
      return await prisma.apartment.findUnique({ where: { id } })
    } catch {
      // Fall through
    }
  }

  // Fallback
  const apts = generateFallbackApartments()
  const apt = apts.find(a => a.id === id)
  if (apt) {
    const override = fallbackApartmentOverrides.get(apt.id)
    return override ? { ...apt, ...override } : apt
  }
  return null
}

export async function updateApartment(id: string, data: { status?: string; price?: number }) {
  const hasDb = await checkDb()

  if (hasDb) {
    try {
      const updateData: Record<string, unknown> = {}
      if (data.status) updateData.status = data.status
      if (data.price !== undefined) updateData.price = data.price
      return await prisma.apartment.update({ where: { id }, data: updateData })
    } catch {
      // Fall through
    }
  }

  // Fallback: store override
  const existing = fallbackApartmentOverrides.get(id) || {}
  fallbackApartmentOverrides.set(id, { ...existing, ...data })

  const apts = generateFallbackApartments()
  const apt = apts.find(a => a.id === id)
  if (apt) return { ...apt, ...data }
  return null
}

export async function getAmenities() {
  const hasDb = await checkDb()

  if (hasDb) {
    try {
      return await prisma.amenity.findMany({ orderBy: { order: 'asc' } })
    } catch {
      // Fall through
    }
  }

  return generateFallbackAmenities()
}

export async function getLeads(filters?: { status?: string }) {
  const hasDb = await checkDb()

  if (hasDb) {
    try {
      const where: Record<string, unknown> = {}
      if (filters?.status) where.status = filters.status
      return await prisma.lead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      })
    } catch {
      // Fall through
    }
  }

  // Fallback
  let leads = fallbackLeads
  if (filters?.status) leads = leads.filter(l => l.status === filters.status)
  return leads
}

export async function createLead(data: { name: string; phone: string; email: string; interest?: string; message?: string; source?: string }) {
  const hasDb = await checkDb()

  if (hasDb) {
    try {
      return await prisma.lead.create({
        data: {
          name: data.name,
          phone: data.phone,
          email: data.email,
          interest: data.interest || null,
          message: data.message || null,
          source: data.source || 'website',
          status: 'new',
        },
      })
    } catch {
      // Fall through
    }
  }

  // Fallback
  const lead = {
    id: `lead-${Date.now()}`,
    name: data.name,
    phone: data.phone,
    email: data.email,
    interest: data.interest || null,
    message: data.message || null,
    source: data.source || 'website',
    status: 'new' as string,
    notes: null as string | null,
    createdAt: new Date().toISOString(),
  }
  fallbackLeads.push(lead)
  return lead
}

export async function updateLead(id: string, data: { status?: string; notes?: string }) {
  const hasDb = await checkDb()

  if (hasDb) {
    try {
      const updateData: Record<string, unknown> = {}
      if (data.status) updateData.status = data.status
      if (data.notes !== undefined) updateData.notes = data.notes
      return await prisma.lead.update({ where: { id }, data: updateData })
    } catch {
      // Fall through
    }
  }

  // Fallback
  const lead = fallbackLeads.find(l => l.id === id)
  if (lead) {
    if (data.status) lead.status = data.status
    if (data.notes !== undefined) lead.notes = data.notes
    return lead
  }
  return null
}

export async function verifyAdmin(username: string, password: string) {
  const hasDb = await checkDb()

  if (hasDb) {
    try {
      const admin = await prisma.adminUser.findUnique({ where: { username } })
      if (admin && admin.password === password) {
        return { success: true, user: { id: admin.id, username: admin.username, name: admin.name, role: admin.role } }
      }
      return { success: false, error: 'Credenciales inválidas' }
    } catch {
      // Fall through
    }
  }

  // Fallback: check hardcoded credentials
  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    return { success: true, user: { id: 'admin-1', username: ADMIN_CREDENTIALS.username, name: ADMIN_CREDENTIALS.name, role: ADMIN_CREDENTIALS.role } }
  }
  return { success: false, error: 'Credenciales inválidas' }
}
