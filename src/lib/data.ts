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

  // Studios 33m² (Pisos 1-4, 6 units each)
  const studioViews = ['Atrio', 'Exterior', 'Atrio', 'Exterior', 'Atrio', 'Exterior']
  const studioAreas = [33.05, 33.75, 33.05, 33.75, 33.05, 33.75]
  for (let floor = 1; floor <= 4; floor++) {
    for (let unit = 1; unit <= 6; unit++) {
      apartments.push({
        id: mkId(),
        name: `Studio 33 ${unitCode(floor, unit)}`,
        area: studioAreas[unit - 1],
        bedrooms: 0,
        bathrooms: 1,
        floor,
        view: studioViews[unit - 1],
        typology: 'Studio',
        status: 'available',
        price: 280_000_000 + (floor - 1) * 8_000_000 + (unit - 1) * 1_500_000,
        image: '/images/renders/studio-33.png',
        plan360Url: null,
        features: JSON.stringify(['Cocina integral', 'Baño completo', 'Zona de ropas', 'Balconcito', 'Acabados premium']),
      })
    }
  }

  // Studios Plus 35m² (Pisos 3-4, 3 units each)
  const spViews = ['Exterior', 'Atrio', 'Exterior']
  const spAreas = [35.6, 35.8, 35.6]
  for (let floor = 3; floor <= 4; floor++) {
    for (let unit = 1; unit <= 3; unit++) {
      apartments.push({
        id: mkId(),
        name: `Studio Plus 35 ${unitCode(floor, unit + 6)}`,
        area: spAreas[unit - 1],
        bedrooms: 0,
        bathrooms: 1,
        floor,
        view: spViews[unit - 1],
        typology: 'Studio Plus',
        status: 'available',
        price: 310_000_000 + (floor - 3) * 12_000_000 + (unit - 1) * 2_000_000,
        image: '/images/renders/studio-33.png',
        plan360Url: null,
        features: JSON.stringify(['Cocina integral ampliada', 'Baño completo', 'Zona de ropas', 'Balcón', 'Acabados premium', 'Espacio para estudio']),
      })
    }
  }

  // Apartamento 2H 57m² (Pisos 5-8, 5 units each)
  const a2hViews = ['Atrio', 'Exterior', 'Atrio', 'Exterior', 'Panorámica']
  const a2hAreas = [57.05, 57.09, 57.05, 57.09, 57.05]
  for (let floor = 5; floor <= 8; floor++) {
    for (let unit = 1; unit <= 5; unit++) {
      apartments.push({
        id: mkId(),
        name: `Apto 2H 57 ${unitCode(floor, unit)}`,
        area: a2hAreas[unit - 1],
        bedrooms: 2,
        bathrooms: 1,
        floor,
        view: a2hViews[unit - 1],
        typology: 'Apartamento 2H',
        status: 'available',
        price: 420_000_000 + (floor - 5) * 12_000_000 + (unit - 1) * 2_500_000,
        image: '/images/renders/apto-57.png',
        plan360Url: null,
        features: JSON.stringify(['2 alcobas', 'Baño completo', 'Baño de visitas', 'Cocina integral', 'Zona de ropas', 'Balcón', 'Acabados premium']),
      })
    }
  }

  // Apartamento Premium 2H 74m² (2 units on floors 5-8, 4 units on floors 9-12)
  const premViews58 = ['Exterior', 'Panorámica']
  for (let floor = 5; floor <= 8; floor++) {
    for (let unit = 1; unit <= 2; unit++) {
      apartments.push({
        id: mkId(),
        name: `Apto Premium 2H 74 ${unitCode(floor, unit + 5)}`,
        area: 74.73,
        bedrooms: 2,
        bathrooms: 2,
        floor,
        view: premViews58[unit - 1],
        typology: 'Apartamento Premium 2H',
        status: 'available',
        price: 560_000_000 + (floor - 5) * 15_000_000 + (unit - 1) * 4_000_000,
        image: '/images/renders/apto-74.png',
        plan360Url: null,
        features: JSON.stringify(['2 alcobas con walk-in closet', '2 baños completos', 'Cocina integral con isla', 'Zona de ropas', 'Balcón amplio', 'Acabados premium', 'Piso porcelánico']),
      })
    }
  }
  const premViews912 = ['Atrio', 'Exterior', 'Panorámica', 'Exterior']
  for (let floor = 9; floor <= 12; floor++) {
    for (let unit = 1; unit <= 4; unit++) {
      apartments.push({
        id: mkId(),
        name: `Apto Premium 2H 74 ${unitCode(floor, unit)}`,
        area: 74.73,
        bedrooms: 2,
        bathrooms: 2,
        floor,
        view: premViews912[unit - 1],
        typology: 'Apartamento Premium 2H',
        status: 'available',
        price: 600_000_000 + (floor - 9) * 8_000_000 + (unit - 1) * 3_000_000,
        image: '/images/renders/apto-74.png',
        plan360Url: null,
        features: JSON.stringify(['2 alcobas con walk-in closet', '2 baños completos', 'Cocina integral con isla', 'Zona de ropas', 'Balcón amplio', 'Acabados premium', 'Piso porcelánico']),
      })
    }
  }

  // Penthouses 3H 97m² (Pisos 11-12, 1 each)
  apartments.push({
    id: mkId(), name: `Penthouse 3H 97 ${unitCode(11, 5)}`, area: 97.45, bedrooms: 3, bathrooms: 2,
    floor: 11, view: 'Panorámica', typology: 'Penthouse 3H', status: 'available',
    price: 780_000_000, image: '/images/renders/apto-97.png', plan360Url: null,
    features: JSON.stringify(['3 alcobas con walk-in closet', '2 baños completos + baño de visitas', 'Cocina integral con isla', 'Terraza panorámica', 'Acabados premium', 'Piso porcelánico', 'Doble altura en sala']),
  })
  apartments.push({
    id: mkId(), name: `Penthouse 3H 97 ${unitCode(12, 5)}`, area: 97.45, bedrooms: 3, bathrooms: 2,
    floor: 12, view: 'Panorámica', typology: 'Penthouse 3H', status: 'available',
    price: 920_000_000, image: '/images/renders/apto-97.png', plan360Url: null,
    features: JSON.stringify(['3 alcobas con walk-in closet', '2 baños completos + baño de visitas', 'Cocina integral con isla', 'Terraza panorámica', 'Acabados premium', 'Piso porcelánico', 'Doble altura en sala', 'Roof garden privado']),
  })

  // Mark some as sold/reserved for realism
  if (apartments.length > 0) {
    apartments[0].status = 'sold'
    apartments[3].status = 'sold'
    apartments[6].status = 'reserved'
    apartments[14].status = 'reserved'
    apartments[19].status = 'reserved'
    apartments[31].status = 'sold'
    apartments[35].status = 'reserved'
    apartments[42].status = 'reserved'
    apartments[53].status = 'reserved'
    apartments[apartments.length - 2].status = 'reserved'
  }

  return apartments
}

function generateFallbackAmenities() {
  return [
    { id: 'fa-1', name: 'Coworking', description: 'Espacio de trabajo colaborativo con estaciones individuales, salas de reuniones y conectividad de alta velocidad.', icon: 'Laptop', category: 'work', image: '/images/renders/coworking.png', active: true, order: 1 },
    { id: 'fa-2', name: 'Gimnasio', description: 'Gimnasio equipado con máquinas de última generación, zona de pesos libres y área de entrenamiento funcional.', icon: 'Dumbbell', category: 'wellness', image: '/images/renders/gimnasio.png', active: true, order: 2 },
    { id: 'fa-3', name: 'Salón Social', description: 'Espacio elegante para reuniones, celebraciones y eventos. Con cocina de apoyo, terraza y capacidad para 40 personas.', icon: 'Wine', category: 'social', image: '/images/renders/salon-social.png', active: true, order: 3 },
    { id: 'fa-4', name: 'Ludoteca', description: 'Zona de juego y aprendizaje para los más pequeños. Segura, divertida y diseñada para estimular la creatividad infantil.', icon: 'Gamepad2', category: 'leisure', image: '/images/renders/atrio-main.png', active: true, order: 4 },
    { id: 'fa-5', name: 'Sauna', description: 'Sauna seco con maderas aromáticas para la relajación profunda. Un ritual de bienestar que renueva cuerpo y mente.', icon: 'Thermometer', category: 'wellness', image: '/images/renders/vitality-pool.png', active: true, order: 5 },
    { id: 'fa-6', name: 'Baño Turco', description: 'Baño turco con aromaterapia para purificar y relajar. La tradición milenaria del hammam en tu edificio.', icon: 'Cloud', category: 'wellness', image: '/images/renders/vitality-pool.png', active: true, order: 6 },
    { id: 'fa-7', name: 'Vitality Pool', description: 'Piscina de vitalidad con hidromasaje y cromoterapia. Un oasis de relajación con vistas al atrio.', icon: 'Waves', category: 'wellness', image: '/images/renders/vitality-pool.png', active: true, order: 7 },
    { id: 'fa-8', name: 'Hidromasaje', description: 'Jacuzzi exterior con vistas panorámicas. Relájate mientras contemplas la ciudad desde las alturas.', icon: 'Droplets', category: 'wellness', image: '/images/renders/vitality-pool.png', active: true, order: 8 },
    { id: 'fa-9', name: 'Hidroterapia', description: 'Circuito de hidroterapia con chorros a diferentes presiones y temperaturas. Recuperación y bienestar en cada sesión.', icon: 'HeartPulse', category: 'wellness', image: '/images/renders/vitality-pool.png', active: true, order: 9 },
    { id: 'fa-10', name: 'Zona Descanso', description: 'Espacio de calma y desconexión con camas de descanso, música ambiental y iluminación suave.', icon: 'Moon', category: 'wellness', image: '/images/renders/atrio-main.png', active: true, order: 10 },
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
