// ============================================
// PRAGA Living — Data Layer (Prisma + Neon only)
// ============================================
// Simplified from the Supabase+Prisma+fallback hybrid.
// All data access now goes through Prisma with a single PostgreSQL backend (Neon).
// This is more secure (no anon key exposed in browser, no RLS needed — auth at
// app layer via requireAdmin) and easier to reason about.

import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import type { Prisma } from '@prisma/client'
import { randomUUID } from 'crypto'
import canonicalFloorPlans from '@/data/floor-plans.json'
import { COMMERCIAL_UNITS, apartmentCommercialPrice } from '@/data/commercial-pricing'

const prisma = db

// ==========================================
// APARTMENTS
// ==========================================

export async function getApartments(filters?: { status?: string; floor?: number; typology?: string }) {
  const where: Prisma.ApartmentWhereInput = {}
  if (filters?.status) where.status = filters.status
  if (filters?.floor !== undefined) where.floor = filters.floor
  if (filters?.typology) where.typology = filters.typology

  return prisma.apartment.findMany({
    where,
    orderBy: [{ floor: 'asc' }, { name: 'asc' }],
  })
}

export async function getApartmentById(id: string) {
  return prisma.apartment.findUnique({ where: { id } })
}

export async function updateApartment(id: string, data: { status?: string; price?: number }) {
  const current = await prisma.apartment.findUnique({ where: { id } })
  if (!current) throw new Error('Apartamento no encontrado')

  const updateData: Prisma.ApartmentUpdateInput = {}
  if (data.status) updateData.status = data.status

  const unitMatch = current.name.match(/(\d{1,2})$/)
  const unitNumber = unitMatch ? Number(unitMatch[1]) : null
  const template = unitNumber ? COMMERCIAL_UNITS.find((item) => item.unit === unitNumber) : undefined
  if (template && current.floor >= 5 && current.floor <= 16) {
    updateData.price = apartmentCommercialPrice(current.floor, template.area, template.pricePerM2)
  }

  return prisma.apartment.update({ where: { id }, data: updateData })
}

// ==========================================
// AMENITIES
// ==========================================

export async function getAmenities() {
  return prisma.amenity.findMany({ orderBy: { order: 'asc' } })
}

export async function updateAmenity(id: string, data: Record<string, unknown>) {
  const updateData: Prisma.AmenityUpdateInput = {}
  if (data.name !== undefined) updateData.name = data.name as string
  if (data.description !== undefined) updateData.description = data.description as string
  if (data.category !== undefined) updateData.category = data.category as string
  if (data.active !== undefined) updateData.active = data.active as boolean
  return prisma.amenity.update({ where: { id }, data: updateData })
}

// ==========================================
// LEADS
// ==========================================

export async function getLeads(filters?: { status?: string }) {
  const where: Prisma.LeadWhereInput = {}
  if (filters?.status) where.status = filters.status
  return prisma.lead.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })
}

export async function createLead(data: {
  name: string
  phone: string
  email: string
  interest?: string | null
  message?: string | null
  source?: string
}) {
  return prisma.lead.create({
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email,
      interest: data.interest || null,
      message: data.message || null,
      source: data.source || 'website',
    },
  })
}

export async function updateLead(id: string, data: { status?: string; notes?: string }) {
  const updateData: Prisma.LeadUpdateInput = {}
  if (data.status) updateData.status = data.status
  if (data.notes !== undefined) updateData.notes = data.notes
  return prisma.lead.update({ where: { id }, data: updateData })
}

// ==========================================
// QUOTES
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
  validUntil: Date | string
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
  createdAt: Date | string
  updatedAt: Date | string
}

// Serverless-safe quote number.
// Never rely on an in-memory counter: Vercel can run multiple instances and
// restart them independently, which can generate duplicate numbers.
export function generateQuoteNumber(): string {
  const now = new Date()
  const year = now.getFullYear()
  const date = `${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  const unique = randomUUID().slice(0, 6).toUpperCase()
  return `COT-${year}${date}-${unique}`
}

export async function getQuotes(filters?: { status?: string }): Promise<Quote[]> {
  const where: Prisma.QuoteWhereInput = {}
  if (filters?.status) where.status = filters.status
  const rows = await prisma.quote.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })
  return rows.map((r) => ({
    id: r.id,
    number: r.number,
    leadId: r.leadId,
    apartmentId: r.apartmentId,
    discount: r.discount,
    finalPrice: r.finalPrice,
    paymentPlan: r.paymentPlan,
    notes: r.notes,
    validDays: r.validDays,
    validUntil: r.validUntil,
    status: r.status as Quote['status'],
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }))
}

export async function createQuote(data: {
  leadId: string
  apartmentId: string
  discount?: number
  finalPrice: number
  paymentPlan?: string
  notes?: string
  validDays?: number
  validUntil?: Date
}): Promise<{ success: boolean; quote?: Quote; error?: string }> {
  try {
      const created = await prisma.quote.create({
      data: {
        number: generateQuoteNumber(),
        leadId: data.leadId,
        apartmentId: data.apartmentId,
        discount: data.discount || 0,
        finalPrice: data.finalPrice,
        paymentPlan: data.paymentPlan || 'Contado',
        notes: data.notes || '',
        validDays: data.validDays || 30,
        validUntil: data.validUntil || new Date(Date.now() + (data.validDays || 30) * 24 * 60 * 60 * 1000),
        status: 'draft',
      },
    })
    return {
      success: true,
      quote: {
        id: created.id,
        number: created.number,
        leadId: created.leadId,
        apartmentId: created.apartmentId,
        discount: created.discount,
        finalPrice: created.finalPrice,
        paymentPlan: created.paymentPlan,
        notes: created.notes,
        validDays: created.validDays,
        validUntil: created.validUntil,
        status: created.status as Quote['status'],
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      },
    }
  } catch (err) {
    console.error('[data] createQuote error:', err)
    return { success: false, error: 'No se pudo crear la cotización' }
  }
}

export async function updateQuote(
  id: string,
  data: { status?: string }
): Promise<{ success: boolean; quote?: Quote; error?: string }> {
  try {
    if (data.status) {
      const validStatuses = ['draft', 'sent', 'accepted', 'rejected', 'expired']
      if (!validStatuses.includes(data.status)) {
        return { success: false, error: 'Estado inválido' }
      }
    }
    const updated = await prisma.quote.update({ where: { id }, data })
    return {
      success: true,
      quote: {
        id: updated.id,
        number: updated.number,
        leadId: updated.leadId,
        apartmentId: updated.apartmentId,
        discount: updated.discount,
        finalPrice: updated.finalPrice,
        paymentPlan: updated.paymentPlan,
        notes: updated.notes,
        validDays: updated.validDays,
        validUntil: updated.validUntil,
        status: updated.status as Quote['status'],
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
    }
  } catch (err) {
    console.error('[data] updateQuote error:', err)
    return { success: false, error: 'Cotización no encontrada' }
  }
}

export async function getQuoteById(id: string): Promise<Quote | null> {
  const q = await prisma.quote.findUnique({ where: { id } })
  if (!q) return null
  return {
    id: q.id,
    number: q.number,
    leadId: q.leadId,
    apartmentId: q.apartmentId,
    discount: q.discount,
    finalPrice: q.finalPrice,
    paymentPlan: q.paymentPlan,
    notes: q.notes,
    validDays: q.validDays,
    validUntil: q.validUntil,
    status: q.status as Quote['status'],
    createdAt: q.createdAt,
    updatedAt: q.updatedAt,
  }
}

// ==========================================
// ADMIN AUTH
// ==========================================

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin'
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || ''

export async function verifyAdmin(username: string, password: string) {
  // 1. Try Prisma (admin_users table)
  try {
    const admin = await prisma.adminUser.findUnique({ where: { username } })
    if (admin) {
      // SECURITY: Only accept bcrypt-hashed passwords.
      // Plaintext comparison is FORBIDDEN — it would let anyone who can read
      // the admin_users table authenticate by reusing the stored hash directly.
      if (typeof admin.password === 'string' && (admin.password.startsWith('$2a$') || admin.password.startsWith('$2b$'))) {
        const match = await bcrypt.compare(password, admin.password)
        if (match) {
          return { success: true, user: { id: admin.id, username: admin.username, name: admin.name, role: admin.role } }
        }
      } else {
        console.error('[data] SECURITY: AdminUser.password is not bcrypt-hashed. Refusing to authenticate. Re-hash the password immediately.')
      }
    }
  } catch (err) {
    console.error('[data] Prisma admin verify error:', err)
  }

  // 2. Fallback: check env-var credentials (bcrypt hash required)
  // Used when DB is unreachable but env vars are set (e.g., during initial deploy)
  if (ADMIN_PASSWORD_HASH && username === ADMIN_USERNAME) {
    const match = await bcrypt.compare(password, ADMIN_PASSWORD_HASH)
    if (match) {
      return { success: true, user: { id: 'admin-1', username: ADMIN_USERNAME, name: 'Administrador PRAGA', role: 'admin' } }
    }
  }

  return { success: false, error: 'Credenciales inválidas' }
}

// ==========================================
// SITE CONFIG (JSONB sections)
// ==========================================

export async function getSiteConfig(section: string): Promise<unknown> {
  const row = await prisma.siteConfig.findUnique({ where: { section } })
  return row?.data ?? null
}

export async function getAllSiteConfig(): Promise<Record<string, unknown>> {
  const rows = await prisma.siteConfig.findMany()
  const config: Record<string, unknown> = {}
  for (const row of rows) {
    config[row.section] = row.data
  }
  return config
}

export async function updateSiteConfig(section: string, data: unknown): Promise<{ success: boolean; error?: string }> {
  try {
      // Prisma upsert with Json field
    await prisma.siteConfig.upsert({
      where: { section },
      create: { section, data: data as Prisma.InputJsonValue },
      update: { data: data as Prisma.InputJsonValue },
    })
    return { success: true }
  } catch (err) {
    console.error('[data] updateSiteConfig error:', err)
    return { success: false, error: 'Failed to save config' }
  }
}

// ==========================================
// FLOOR PLANS
// ==========================================
// Floor plans are stored as a single JSON blob in site_config.floor_plans
// (key='floor_plans'). This matches what the FloorPlanEditor reads/writes
// via saveFloorPlansConfig().
// The floor_plans table is kept for legacy/queries but is not the source
// of truth for the PlantaInteractiva component.

export async function getFloorPlans() {
  // 1. Read from site_config.floor_plans (primary — what the editor saves to)
  const row = await prisma.siteConfig.findUnique({ where: { section: 'floor_plans' } })
  if (row?.data) {
    const data = row.data as { floors?: Array<{ id?: string; name?: string; isResidential?: boolean }> }
    if (Array.isArray(data.floors) && data.floors.length > 0) {
      const residential = data.floors.filter((floor) => floor.isResidential)
      const usesCommercialLevels = residential.length === 12 &&
        residential.every((floor) => /nivel-(?:0[5-9]|1[0-6])/i.test(String(floor.id || '')))
      if (usesCommercialLevels) return data.floors as unknown[]
    }
  }

  // Commercial baseline: levels 05–16, 10 units per level and official prices.
  // This intentionally replaces the old demo floor numbering until the admin
  // saves a floor-plan configuration using the canonical commercial levels.
  return (canonicalFloorPlans as { floors: unknown[] }).floors

  
}

export async function updateFloorPlan(
  floorNumber: number,
  data: { image?: string; apartments?: unknown }
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData: Prisma.FloorPlanUpdateInput = {}
    if (data.image !== undefined) updateData.image = data.image
    if (data.apartments !== undefined) updateData.apartments = data.apartments as Prisma.InputJsonValue

    await prisma.floorPlan.upsert({
      where: { floorNumber },
      create: {
        floorNumber,
        image: data.image || null,
        apartments: (data.apartments as Prisma.InputJsonValue) ?? [],
      },
      update: updateData,
    })
    return { success: true }
  } catch (err) {
    console.error('[data] updateFloorPlan error:', err)
    return { success: false, error: 'Failed to persist floor plan' }
  }
}

export async function saveFloorPlansConfig(config: { floors: unknown[] }): Promise<{ success: boolean; error?: string }> {
  // Store entire floor plans config in site_config as a single JSON blob.
  // This preserves the previous behavior where all floor overlays are saved together.
  return updateSiteConfig('floor_plans', config)
}

// ==========================================
// FLOOR IMAGES
// ==========================================

export async function getFloorImages(floorId?: string) {
  const where: Prisma.FloorImageWhereInput = {}
  if (floorId) where.floorId = floorId
  return prisma.floorImage.findMany({
    where,
    orderBy: { order: 'asc' },
  })
}

export async function createFloorImage(data: {
  floorId: string
  imageUrl: string
  label?: string | null
  order?: number
}) {
  return prisma.floorImage.create({
    data: {
      floorId: data.floorId,
      imageUrl: data.imageUrl,
      label: data.label ?? null,
      order: data.order ?? 0,
    },
  })
}

export async function updateFloorImage(
  id: string,
  data: { label?: string; order?: number }
) {
  const updateData: Prisma.FloorImageUpdateInput = {}
  if (data.label !== undefined) updateData.label = data.label
  if (data.order !== undefined) updateData.order = data.order
  return prisma.floorImage.update({ where: { id }, data: updateData })
}

export async function deleteFloorImage(id: string) {
  return prisma.floorImage.delete({ where: { id } })
}
