// Centralized data layer that works with Supabase, Prisma (local dev), and hardcoded fallback (Vercel production)
// Priority: Supabase → Prisma → Hardcoded fallback
// v2: Security fixes (bcrypt), cached fallbacks, TTL on Supabase check, unified PrismaClient, fixed amenities

import { db } from '@/lib/db'
import { supabase, isSupabaseConfigured, createFreshSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

// Use the singleton PrismaClient from db.ts (fixes double-instance bug)
const prisma = db

// ==========================================
// HARDCODED FALLBACK DATA (for production)
// ==========================================

const unitCode = (floor: number, unit: number) => `P${floor}-${String(unit).padStart(2, '0')}`

// Cached fallback apartments — generated once, reused on subsequent calls
let _cachedApartments: Array<{
  id: string; name: string; area: number; bedrooms: number; bathrooms: number;
  floor: number; view: string; typology: string; status: string; price: number;
  image: string | null; plan360Url: string | null; features: string | null;
}> | null = null

function generateFallbackApartments(): Array<{
  id: string; name: string; area: number; bedrooms: number; bathrooms: number;
  floor: number; view: string; typology: string; status: string; price: number;
  image: string | null; plan360Url: string | null; features: string | null;
}> {
  if (_cachedApartments) return _cachedApartments

  const apartments: Array<{
    id: string; name: string; area: number; bedrooms: number; bathrooms: number;
    floor: number; view: string; typology: string; status: string; price: number;
    image: string | null; plan360Url: string | null; features: string | null;
  }> = []

  let uid = 1
  const mkId = () => `fallback-${uid++}`

  // ─── PRAGA Living — Real building data from DWG ───
  // 11 residential floors (Pisos 1-11), 10 apartments per floor = 110 total
  // Layout from DWG planta-tipo:
  //   Top row (above corridor): APTO 01 (corner ~75m²), APTO 02 (~57m²), APTO 03 (~57m²), APTO 04 (corner ~97m²)
  //   Bottom row (below corridor): APTO 05-10 (~33-36m² each, 1 alcoba)
  // Address: Cl. 133 Sur #49-94, Caldas, Antioquia

  // 10 units per floor — areas from DWG
  const unitData = [
    // Top row (above corridor)
    { area: 74.75, beds: 3, baths: 2, typ: 'Tipo A · 3 Alcobas', view: 'Carrera 50', corner: true },
    { area: 57.00, beds: 2, baths: 1, typ: 'Tipo B · 2 Alcobas', view: 'Calle 133 Sur', corner: false },
    { area: 57.00, beds: 2, baths: 1, typ: 'Tipo B · 2 Alcobas', view: 'Atrio', corner: false },
    { area: 97.45, beds: 3, baths: 2, typ: 'Tipo A+ · 3 Alcobas', view: 'Panorámica', corner: true },
    // Bottom row (below corridor)
    { area: 33.40, beds: 1, baths: 1, typ: 'Tipo C · 1 Alcoba', view: 'Carrera 50', corner: false },
    { area: 35.60, beds: 1, baths: 1, typ: 'Tipo C · 1 Alcoba', view: 'Interior', corner: false },
    { area: 35.80, beds: 1, baths: 1, typ: 'Tipo C · 1 Alcoba', view: 'Atrio', corner: false },
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
      const basePrice = isTipoC ? 120_000_000 : (ud.area > 80 ? 310_000_000 : 230_000_000)
      const floorPremium = isTipoC
        ? (floor - 1) * 3_000_000
        : (isTipoA ? (floor - 1) * 8_000_000 : (floor - 1) * 5_000_000)

      apartments.push({
        id: mkId(),
        name: `Apto ${aptNumber}`,
        area: ud.area,
        bedrooms: ud.beds,
        bathrooms: ud.baths,
        floor,
        view: ud.view,
        typology: ud.typ,
        status: 'available',
        price: basePrice + floorPremium,
        image: isTipoA ? '/images/renders/apto-74.png' : (isTipoC ? '/images/renders/studio-33.png' : '/images/renders/apto-57.png'),
        plan360Url: null,
        features: JSON.stringify(
          ud.beds >= 3
            ? ['3 alcobas', '2 baños completos', 'Sala-comedor', 'Cocina integral', 'Balcón', 'Zona de ropas', 'Acabados premium', ud.corner ? 'Unidad esquinera' : 'Vista panorámica']
            : ud.beds === 2
            ? ['2 alcobas', 'Baño completo', 'Sala-comedor', 'Cocina integral', 'Balcón', 'Zona de ropas', 'Acabados premium']
            : ['1 alcoba', 'Baño completo', 'Sala-comedor', 'Cocina integral', 'Zona de ropas', 'Acabados premium']
        ),
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

  _cachedApartments = apartments
  return apartments
}

function generateFallbackAmenities() {
  return [
    { id: 'fa-1', name: 'Ludoteca', description: 'Zona de juego y aprendizaje para los más pequeños. Segura, divertida y diseñada para estimular la creatividad infantil.', icon: 'Gamepad2', category: 'leisure', image: '/images/renders/ludoteca.png', active: true, order: 1 },
    { id: 'fa-2', name: 'Gimnasio', description: 'Gimnasio equipado con máquinas de última generación, zona de pesos libres y área de entrenamiento funcional.', icon: 'Dumbbell', category: 'wellness', image: '/images/renders/gimnasio.png', active: true, order: 2 },
    { id: 'fa-3', name: 'Vitality Pool', description: 'Piscina de vitalidad con hidromasaje y cromoterapia. Un oasis de relajación con vistas al atrio central.', icon: 'Waves', category: 'wellness', image: '/images/renders/vitality-pool.png', active: true, order: 3 },
    { id: 'fa-4', name: 'Salón Social', description: 'Espacio elegante para reuniones, celebraciones y eventos. Con cocina de apoyo, terraza y capacidad para 40 personas.', icon: 'Wine', category: 'social', image: '/images/renders/salon-social.png', active: true, order: 4 },
    { id: 'fa-5', name: 'Sauna', description: 'Sauna seco con maderas aromáticas para la relajación profunda. Un ritual de bienestar que renueva cuerpo y mente.', icon: 'Thermometer', category: 'wellness', image: '/images/renders/sauna.png', active: true, order: 5 },
    { id: 'fa-6', name: 'Baño Turco', description: 'Baño turco con aromaterapia para purificar y relajar. La tradición milenaria del hammam en tu edificio.', icon: 'Cloud', category: 'wellness', image: '/images/renders/bano-turco.png', active: true, order: 6 },
    { id: 'fa-7', name: 'Vestieres', description: 'Vestieres completos con casilleros, duchas y zona de cambio para uso antes y después de las amenidades.', icon: 'Shirt', category: 'wellness', image: '/images/renders/vestieres.png', active: true, order: 7 },
    { id: 'fa-8', name: 'Sala Coworking', description: 'Espacio de trabajo compartido con internet de alta velocidad, zonas de reunión individual y grupal para profesionales y emprendedores.', icon: 'Laptop', category: 'service', image: '/images/renders/coworking.png', active: true, order: 8 },
    { id: 'fa-9', name: 'Lobby Doble Altura', description: 'Lobby de doble altura con recepción 24h, conexión directa al atrio central y diseño que marca la diferencia.', icon: 'DoorOpen', category: 'social', image: '/images/renders/lobby.png', active: true, order: 9 },
    { id: 'fa-10', name: 'Terraza Cubierta / Jardín Elevado', description: 'Terraza panorámica en la cubierta con jardín elevado, zona lounge y vistas 360° de Caldas y el Valle de Aburrá.', icon: 'Sun', category: 'leisure', image: '/images/renders/terraza.png', active: true, order: 10 },
  ]
}

// SECURITY: Admin credentials are now loaded from environment variables only
// No hardcoded passwords in source code
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin'
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || ''  // bcrypt hash

// In-memory stores for fallback mode (leads created in production)
// NOTE: These are volatile — data is lost on server restart. Supabase is the primary store.
let fallbackLeads: Array<{
  id: string; name: string; phone: string; email: string;
  interest: string | null; message: string | null; source: string;
  status: string; notes: string | null; createdAt: string;
}> = []

// Track apartment status/price overrides in fallback mode
const fallbackApartmentOverrides = new Map<string, { status?: string; price?: number }>()

// ==========================================
// HELPER: Check Supabase availability (with TTL cache)
// ==========================================

let supabaseCheckedAt = 0
let supabaseAvailable = false
const SUPABASE_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

async function checkSupabase(): Promise<boolean> {
  const now = Date.now()
  if (now - supabaseCheckedAt < SUPABASE_CACHE_TTL && supabaseCheckedAt > 0) {
    return supabaseAvailable
  }
  if (!isSupabaseConfigured() || !supabase) {
    supabaseAvailable = false
    supabaseCheckedAt = now
    return false
  }
  try {
    const { error } = await supabase.from('apartments').select('id').limit(1)
    supabaseAvailable = !error
  } catch {
    supabaseAvailable = false
  }
  supabaseCheckedAt = now
  return supabaseAvailable
}

// HELPER: Try Prisma, fallback to hardcoded
let dbAvailable: boolean | null = null
let dbCheckedAt = 0
const DB_CACHE_TTL = 5 * 60 * 1000

async function checkDb(): Promise<boolean> {
  const now = Date.now()
  if (dbAvailable !== null && now - dbCheckedAt < DB_CACHE_TTL) return dbAvailable
  try {
    await prisma.$queryRaw`SELECT 1`
    dbAvailable = true
    dbCheckedAt = now
    return true
  } catch {
    dbAvailable = false
    dbCheckedAt = now
    return false
  }
}

// ==========================================
// HELPERS: Map Supabase rows to expected shape
// ==========================================

function mapSupabaseApartment(row: any) {
  return {
    id: row.id,
    name: row.name,
    area: Number(row.area),
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    floor: row.floor,
    view: row.view,
    typology: row.typology,
    status: row.status,
    price: Number(row.price),
    image: row.image,
    plan360Url: row.plan_360_url,
    features: typeof row.features === 'object' ? JSON.stringify(row.features) : row.features,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapSupabaseLead(row: any) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    interest: row.interest,
    message: row.message,
    source: row.source,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapSupabaseAmenity(row: any) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    icon: row.icon,
    category: row.category,
    image: row.image,
    active: row.active,
    order: row.order,
    createdAt: row.created_at,
    updatedAt: row.created_at,
  }
}

// ==========================================
// QUOTES — Now persisted to Supabase
// ==========================================

export interface Quote {
  id: string
  number: string
  leadId: string
  apartmentId: string
  discount: number
  finalPrice: number
  paymentPlan: string
  notes: string
  validDays: number
  validUntil: string
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
  createdAt: string
  updatedAt: string
}

// In-memory fallback for quotes (Supabase is primary)
const globalForQuotes = globalThis as unknown as {
  quotesStore: Quote[] | undefined
  quoteCounter: number | undefined
}
let fallbackQuotes: Quote[] = globalForQuotes.quotesStore ?? []
let quoteCounter = globalForQuotes.quoteCounter ?? 0

if (!globalForQuotes.quotesStore) {
  globalForQuotes.quotesStore = fallbackQuotes
  globalForQuotes.quoteCounter = quoteCounter
}

export function generateQuoteNumber(): string {
  quoteCounter++
  if (globalForQuotes.quoteCounter !== undefined) {
    globalForQuotes.quoteCounter = quoteCounter
  }
  const year = new Date().getFullYear()
  return `COT-${year}-${String(quoteCounter).padStart(4, '0')}`
}

export async function getQuotes(filters?: { status?: string }) {
  // 1. Try Supabase first
  const hasSupabase = await checkSupabase()
  if (hasSupabase && supabase) {
    try {
      let query = supabase.from('quotes').select('*').order('created_at', { ascending: false })
      if (filters?.status) query = query.eq('status', filters.status)

      const { data, error } = await query
      if (!error && data) {
        return data.map((row: any) => ({
          id: row.id,
          number: row.number,
          leadId: row.lead_id,
          apartmentId: row.apartment_id,
          discount: Number(row.discount),
          finalPrice: Number(row.final_price),
          paymentPlan: row.payment_plan,
          notes: row.notes || '',
          validDays: row.valid_days || 30,
          validUntil: row.valid_until,
          status: row.status,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        })) as Quote[]
      }
    } catch (err) {
      console.error('[data] Supabase quotes fetch error:', err)
    }
  }

  // 2. Fallback: in-memory
  let quotes = fallbackQuotes
  if (filters?.status) quotes = quotes.filter(q => q.status === filters.status)
  return quotes
}

export async function createQuote(data: { leadId: string; apartmentId: string; discount?: number; paymentPlan?: string; notes?: string; validDays?: number }) {
  // 1. Try Supabase first
  const hasSupabase = await checkSupabase()
  if (hasSupabase) {
    try {
      const adminClient = createAdminSupabaseClient()
      if (adminClient) {
        const insertData = {
          number: generateQuoteNumber(),
          lead_id: data.leadId,
          apartment_id: data.apartmentId,
          discount: data.discount || 0,
          payment_plan: data.paymentPlan || 'Contado',
          notes: data.notes || '',
          valid_days: data.validDays || 30,
          status: 'draft',
        }
        const { data: created, error } = await adminClient.from('quotes').insert(insertData).select().single()
        if (!error && created) {
          return { success: true, quote: created }
        }
        console.error('[data] Supabase quote insert error:', error?.message)
      }
    } catch (err) {
      console.error('[data] Supabase quote exception:', err)
    }
  }

  // 2. Fallback: in-memory
  const quote: Quote = {
    id: `quote-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    number: generateQuoteNumber(),
    leadId: data.leadId,
    apartmentId: data.apartmentId,
    discount: data.discount || 0,
    finalPrice: 0, // Will be calculated by API route
    paymentPlan: data.paymentPlan || 'Contado',
    notes: data.notes || '',
    validDays: data.validDays || 30,
    validUntil: new Date(Date.now() + (data.validDays || 30) * 24 * 60 * 60 * 1000).toISOString(),
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  fallbackQuotes.push(quote)
  return { success: true, quote }
}

export async function updateQuote(id: string, data: { status?: string }) {
  // 1. Try Supabase first
  const hasSupabase = await checkSupabase()
  if (hasSupabase) {
    try {
      const adminClient = createAdminSupabaseClient()
      if (adminClient) {
        const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
        if (data.status) {
          const validStatuses = ['draft', 'sent', 'accepted', 'rejected', 'expired']
          if (!validStatuses.includes(data.status)) {
            return { success: false, error: 'Estado inválido' }
          }
          updateData.status = data.status
        }
        const { data: updated, error } = await adminClient.from('quotes').update(updateData).eq('id', id).select().single()
        if (!error && updated) {
          return { success: true, quote: updated }
        }
      }
    } catch (err) {
      console.error('[data] Supabase quote update error:', err)
    }
  }

  // 2. Fallback: in-memory
  const quote = fallbackQuotes.find(q => q.id === id)
  if (quote) {
    if (data.status) quote.status = data.status as Quote['status']
    quote.updatedAt = new Date().toISOString()
    return { success: true, quote }
  }
  return { success: false, error: 'Cotización no encontrada' }
}

// ==========================================
// EXPORTED DATA FUNCTIONS
// ==========================================

export async function getApartments(filters?: { status?: string; floor?: number; typology?: string }) {
  // 1. Try Supabase first
  const hasSupabase = await checkSupabase()
  if (hasSupabase && supabase) {
    try {
      let query = supabase.from('apartments').select('*').order('floor', { ascending: true }).order('name', { ascending: true })
      if (filters?.status) query = query.eq('status', filters.status)
      if (filters?.floor) query = query.eq('floor', filters.floor)
      if (filters?.typology) query = query.eq('typology', filters.typology)

      const { data, error } = await query
      if (!error && data && data.length > 0) {
        return data.map(mapSupabaseApartment)
      }
    } catch (err) {
      console.error('[data] Supabase apartments error:', err)
    }
  }

  // 2. Try Prisma
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
    } catch (err) {
      console.error('[data] Prisma apartments error:', err)
    }
  }

  // 3. Fallback (cached)
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
  // 1. Try Supabase first
  const hasSupabase = await checkSupabase()
  if (hasSupabase && supabase) {
    try {
      const { data, error } = await supabase.from('apartments').select('*').eq('id', id).single()
      if (!error && data) {
        return mapSupabaseApartment(data)
      }
    } catch (err) {
      console.error('[data] Supabase apartment by ID error:', err)
    }
  }

  // 2. Try Prisma
  const hasDb = await checkDb()
  if (hasDb) {
    try {
      return await prisma.apartment.findUnique({ where: { id } })
    } catch (err) {
      console.error('[data] Prisma apartment by ID error:', err)
    }
  }

  // 3. Fallback (cached)
  const apts = generateFallbackApartments()
  const apt = apts.find(a => a.id === id)
  if (apt) {
    const override = fallbackApartmentOverrides.get(apt.id)
    return override ? { ...apt, ...override } : apt
  }
  return null
}

export async function updateApartment(id: string, data: { status?: string; price?: number }) {
  // 1. Try Supabase first
  const hasSupabase = await checkSupabase()
  if (hasSupabase && supabase) {
    try {
      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (data.status) updateData.status = data.status
      if (data.price !== undefined) updateData.price = data.price

      const { data: updated, error } = await supabase
        .from('apartments')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (!error && updated) {
        return mapSupabaseApartment(updated)
      }
    } catch (err) {
      console.error('[data] Supabase apartment update error:', err)
    }
  }

  // 2. Try Prisma
  const hasDb = await checkDb()
  if (hasDb) {
    try {
      const updateData: Record<string, unknown> = {}
      if (data.status) updateData.status = data.status
      if (data.price !== undefined) updateData.price = data.price
      return await prisma.apartment.update({ where: { id }, data: updateData })
    } catch (err) {
      console.error('[data] Prisma apartment update error:', err)
    }
  }

  // 3. Fallback: store override
  const existing = fallbackApartmentOverrides.get(id) || {}
  fallbackApartmentOverrides.set(id, { ...existing, ...data })

  const apts = generateFallbackApartments()
  const apt = apts.find(a => a.id === id)
  if (apt) return { ...apt, ...data }
  return null
}

export async function getAmenities() {
  // 1. Try Supabase first
  const hasSupabase = await checkSupabase()
  if (hasSupabase && supabase) {
    try {
      const { data, error } = await supabase.from('amenities').select('*').order('order', { ascending: true })
      if (!error && data && data.length > 0) {
        return data.map(mapSupabaseAmenity)
      }
    } catch (err) {
      console.error('[data] Supabase amenities error:', err)
    }
  }

  // 2. Try Prisma
  const hasDb = await checkDb()
  if (hasDb) {
    try {
      return await prisma.amenity.findMany({ orderBy: { order: 'asc' } })
    } catch (err) {
      console.error('[data] Prisma amenities error:', err)
    }
  }

  // 3. Fallback
  return generateFallbackAmenities()
}

export async function getLeads(filters?: { status?: string }) {
  // 1. Try Supabase first
  const hasSupabase = await checkSupabase()
  if (hasSupabase && supabase) {
    try {
      let query = supabase.from('leads').select('*').order('created_at', { ascending: false })
      if (filters?.status) query = query.eq('status', filters.status)

      const { data, error } = await query
      if (!error && data) {
        return data.map(mapSupabaseLead)
      }
    } catch (err) {
      console.error('[data] Supabase leads error:', err)
    }
  }

  // 2. Try Prisma
  const hasDb = await checkDb()
  if (hasDb) {
    try {
      const where: Record<string, unknown> = {}
      if (filters?.status) where.status = filters.status
      return await prisma.lead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      })
    } catch (err) {
      console.error('[data] Prisma leads error:', err)
    }
  }

  // 3. Fallback
  let leads = fallbackLeads
  if (filters?.status) leads = leads.filter(l => l.status === filters.status)
  return leads
}

export async function createLead(data: { name: string; phone: string; email: string; interest?: string; message?: string; source?: string }) {
  // 1. Try Supabase first
  const hasSupabase = await checkSupabase()
  if (hasSupabase && supabase) {
    try {
      const insertData = {
        name: data.name,
        phone: data.phone,
        email: data.email,
        interest: data.interest || null,
        message: data.message || null,
        source: data.source || 'website',
        status: 'new',
      }

      const { data: created, error } = await supabase
        .from('leads')
        .insert(insertData)
        .select()
        .single()

      if (!error && created) {
        return mapSupabaseLead(created)
      }
    } catch (err) {
      console.error('[data] Supabase create lead error:', err)
    }
  }

  // 2. Try Prisma
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
    } catch (err) {
      console.error('[data] Prisma create lead error:', err)
    }
  }

  // 3. Fallback
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
  // 1. Try Supabase first
  const hasSupabase = await checkSupabase()
  if (hasSupabase && supabase) {
    try {
      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (data.status) updateData.status = data.status
      if (data.notes !== undefined) updateData.notes = data.notes

      const { data: updated, error } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (!error && updated) {
        return mapSupabaseLead(updated)
      }
    } catch (err) {
      console.error('[data] Supabase update lead error:', err)
    }
  }

  // 2. Try Prisma
  const hasDb = await checkDb()
  if (hasDb) {
    try {
      const updateData: Record<string, unknown> = {}
      if (data.status) updateData.status = data.status
      if (data.notes !== undefined) updateData.notes = data.notes
      return await prisma.lead.update({ where: { id }, data: updateData })
    } catch (err) {
      console.error('[data] Prisma update lead error:', err)
    }
  }

  // 3. Fallback
  const lead = fallbackLeads.find(l => l.id === id)
  if (lead) {
    if (data.status) lead.status = data.status
    if (data.notes !== undefined) lead.notes = data.notes
    return lead
  }
  return null
}

export async function verifyAdmin(username: string, password: string) {
  // 1. Try Supabase first (passwords should be bcrypt-hashed in admin_users table)
  const hasSupabase = await checkSupabase()
  if (hasSupabase) {
    try {
      const adminClient = createAdminSupabaseClient()
      if (adminClient) {
        const { data, error } = await adminClient
          .from('admin_users')
          .select('*')
          .eq('username', username)
          .single()

        if (!error && data) {
          // Try bcrypt comparison first (for properly hashed passwords)
          if (data.password.startsWith('$2a$') || data.password.startsWith('$2b$')) {
            const match = await bcrypt.compare(password, data.password)
            if (match) {
              return { success: true, user: { id: data.id, username: data.username, name: data.name, role: data.role } }
            }
          } else {
            // Legacy: plaintext comparison (will be removed once all passwords are hashed)
            if (data.password === password) {
              return { success: true, user: { id: data.id, username: data.username, name: data.name, role: data.role } }
            }
          }
        }
      }
    } catch (err) {
      console.error('[data] Supabase admin verify error:', err)
    }
  }

  // 2. Try Prisma
  const hasDb = await checkDb()
  if (hasDb) {
    try {
      const admin = await prisma.adminUser.findUnique({ where: { username } })
      if (admin) {
        // Try bcrypt comparison first
        if (admin.password.startsWith('$2a$') || admin.password.startsWith('$2b$')) {
          const match = await bcrypt.compare(password, admin.password)
          if (match) {
            return { success: true, user: { id: admin.id, username: admin.username, name: admin.name, role: admin.role } }
          }
        } else if (admin.password === password) {
          // Legacy: plaintext comparison
          return { success: true, user: { id: admin.id, username: admin.username, name: admin.name, role: admin.role } }
        }
      }
    } catch (err) {
      console.error('[data] Prisma admin verify error:', err)
    }
  }

  // 3. Fallback: check env-var credentials (bcrypt hash)
  if (ADMIN_PASSWORD_HASH && username === ADMIN_USERNAME) {
    const match = await bcrypt.compare(password, ADMIN_PASSWORD_HASH)
    if (match) {
      return { success: true, user: { id: 'admin-1', username: ADMIN_USERNAME, name: 'Administrador PRAGA', role: 'admin' } }
    }
  }

  return { success: false, error: 'Credenciales inválidas' }
}

// ==========================================
// SITE CONFIG (Supabase → JSON fallback)
// ==========================================

// Helper: Supabase may return JSONB 'value' as a string or object depending on column type
function parseSiteConfigValue(val: unknown): unknown {
  if (typeof val === 'string') {
    try { return JSON.parse(val) } catch { return val }
  }
  return val
}

export async function getSiteConfig(section: string) {
  // 1. Try Supabase first
  const hasSupabase = await checkSupabase()
  if (hasSupabase && supabase) {
    try {
      const { data, error } = await supabase
        .from('site_config')
        .select('value')
        .eq('key', section)
        .single()

      if (!error && data) {
        return parseSiteConfigValue(data.value)
      }
    } catch (err) {
      console.error('[data] Supabase site config get error:', err)
    }
  }

  // 2. Try Prisma — not applicable (site_config uses JSON), fall through

  // 3. Fallback: load from JSON
  try {
    const siteConfig = await import('@/data/site-config.json')
    return ((siteConfig.default || siteConfig) as Record<string, unknown>)[section] || null
  } catch {
    return null
  }
}

export async function getAllSiteConfig() {
  // 1. Try Supabase first
  const hasSupabase = await checkSupabase()
  if (hasSupabase && supabase) {
    try {
      const { data, error } = await supabase.from('site_config').select('*')
      if (!error && data && data.length > 0) {
        const config: Record<string, unknown> = {}
        for (const row of data) {
          config[row.key] = parseSiteConfigValue(row.value)
        }
        return config
      }
    } catch (err) {
      console.error('[data] Supabase site config get all error:', err)
    }
  }

  // 2. Fallback: load from JSON
  try {
    const siteConfig = await import('@/data/site-config.json')
    return siteConfig.default || siteConfig
  } catch {
    return {}
  }
}

export async function updateSiteConfig(section: string, data: unknown) {
  // 1. Try Supabase with admin client (service role key — bypasses RLS, always works for writes)
  const client = createAdminSupabaseClient()
  if (client) {
    try {
      const { error } = await client
        .from('site_config')
        .upsert(
          { key: section, value: data, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        )

      if (!error) {
        // Reset the cache since we know Supabase is working
        supabaseCheckedAt = Date.now()
        supabaseAvailable = true
        return { success: true }
      }
      console.error('Supabase upsert error for section', section, ':', error.message, error.code, error.details)
    } catch (err) {
      console.error('Supabase upsert exception for section', section, ':', err)
    }
  }

  // 2. Fallback: try with anon key client
  const anonClient = createFreshSupabaseClient()
  if (anonClient && anonClient !== client) {
    try {
      const { error } = await anonClient
        .from('site_config')
        .upsert(
          { key: section, value: data, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        )

      if (!error) {
        supabaseCheckedAt = Date.now()
        supabaseAvailable = true
        return { success: true }
      }
      console.error('Supabase anon upsert error for section', section, ':', error.message)
    } catch (err) {
      console.error('Supabase anon upsert exception for section', section, ':', err)
    }
  } else if (!client) {
    console.error('Supabase not configured: URL=', !!process.env.NEXT_PUBLIC_SUPABASE_URL, ' KEY=', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  }

  // 3. Fallback: not persistable
  return { success: false, error: 'No database available to persist config' }
}

// ==========================================
// FLOOR PLANS (Supabase → JSON fallback)
// ==========================================

export async function getFloorPlans() {
  // 1. Try site_config in Supabase (stores entire floor plan config as JSONB)
  const hasSupabase = await checkSupabase()
  if (hasSupabase && supabase) {
    try {
      const { data, error } = await supabase
        .from('site_config')
        .select('value')
        .eq('key', 'floor_plans')
        .single()

      if (!error && data) {
        const val = parseSiteConfigValue(data.value) as Record<string, unknown> | null
        if (val?.floors && Array.isArray(val.floors) && val.floors.length > 0) {
          return val.floors
        }
      }
    } catch (err) {
      console.error('[data] Supabase floor plans error:', err)
    }

    // 2. Fallback: try floor_plans table (legacy, may have incomplete data)
    try {
      const { data, error } = await supabase.from('floor_plans').select('*').order('floor_number', { ascending: true })
      if (!error && data && data.length > 0) {
        // Map to expected FloorConfig format
        return data.map(row => ({
          id: row.floor_id || `piso-${row.floor_number}`,
          name: row.floor_name || `Piso ${row.floor_number}`,
          typeLabel: row.type_label || (row.is_residential ? 'Residencial' : 'Áreas Comunes'),
          isResidential: row.is_residential !== undefined ? row.is_residential : (row.floor_number > 0),
          image: row.image || '',
          apartments: row.apartments || [],
        }))
      }
    } catch (err) {
      console.error('[data] Supabase floor plans legacy error:', err)
    }
  }

  // 3. Fallback: load from JSON
  try {
    const floorPlans = await import('@/data/floor-plans.json')
    return (floorPlans.default || floorPlans).floors || []
  } catch {
    return []
  }
}

export async function updateFloorPlan(floorNumber: number, data: { image?: string; apartments?: unknown }) {
  // 1. Try Supabase first (legacy table approach)
  const hasSupabase = await checkSupabase()
  if (hasSupabase && supabase) {
    try {
      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (data.image !== undefined) updateData.image = data.image
      if (data.apartments !== undefined) updateData.apartments = data.apartments

      const { error } = await supabase
        .from('floor_plans')
        .update(updateData)
        .eq('floor_number', floorNumber)

      if (!error) return { success: true }
    } catch (err) {
      console.error('[data] Supabase floor plan update error:', err)
    }
  }

  // 2. Fallback: not persistable
  return { success: false, error: 'No database available to persist floor plan' }
}

export async function saveFloorPlansConfig(config: { floors: unknown[] }) {
  // Save entire floor plan config to site_config (primary method)
  return updateSiteConfig('floor_plans', config)
}
