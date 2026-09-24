import { PrismaClient, Prisma } from '@prisma/client'
import canonicalFloorPlans from '@/data/floor-plans.json'
import staticSiteConfig from '@/data/site-config.json'
import {
  COMMERCIAL_UNITS,
  RESIDENTIAL_LEVELS,
  HEIGHT_PREMIUM,
  apartmentCommercialPrice,
} from '@/data/commercial-pricing'

const TARGET_DATABASE = 'praga_clean'
const BOOTSTRAP_VERSION = 'praga-clean-2026-09-24-v1'
const BOOTSTRAP_META = '__clean_db_bootstrap_meta'
const SITE_CONFIG_META = '__site_config_meta'
const SITE_CONFIG_BASELINE = 'praga-approved-2026-09-22-v1'

function normalizeUrl(value: string | undefined) {
  if (!value) return ''
  let clean = value.trim()
  if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
    clean = clean.slice(1, -1)
  }
  return clean
}

export function databaseUrlFor(databaseName: string, raw?: string) {
  const source = normalizeUrl(raw || process.env.DATABASE_URL)
  if (!source) throw new Error('DATABASE_URL no está configurada')
  const parsed = new URL(source)
  parsed.pathname = '/' + databaseName
  return parsed.toString()
}

const UNIT_VIEWS: Record<number, string> = {
  1: 'Carrera 50',
  2: 'Interior',
  3: 'Interior',
  4: 'Calle 133 Sur',
  5: 'Carrera 50',
  6: 'Atrio',
  7: 'Atrio',
  8: 'Interior',
  9: 'Interior',
  10: 'Calle 133 Sur',
}

const UNIT_IMAGES: Record<number, string> = {
  1: '/images/typologies/78-01.jpg',
  2: '/images/typologies/60-01.jpg',
  3: '/images/typologies/60-01.jpg',
  4: '/images/typologies/104-01.jpg',
  5: '/images/typologies/33-01.jpg',
  6: '/images/typologies/33-01.jpg',
  7: '/images/typologies/33-01.jpg',
  8: '/images/typologies/33-01.jpg',
  9: '/images/typologies/33-01.jpg',
  10: '/images/typologies/33-01.jpg',
}

async function createSchema(client: PrismaClient) {
  const statements = [
    `CREATE TABLE IF NOT EXISTS apartments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      area DOUBLE PRECISION NOT NULL,
      bedrooms INTEGER NOT NULL,
      bathrooms INTEGER NOT NULL,
      floor INTEGER NOT NULL,
      view TEXT NOT NULL,
      typology TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'available',
      price DOUBLE PRECISION NOT NULL,
      image TEXT,
      plan_360_url TEXT,
      features TEXT,
      created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP(3) NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS apartments_floor_idx ON apartments(floor)`,
    `CREATE INDEX IF NOT EXISTS apartments_status_idx ON apartments(status)`,
    `CREATE TABLE IF NOT EXISTS amenities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT,
      category TEXT NOT NULL,
      image TEXT,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      "order" INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP(3) NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      interest TEXT,
      message TEXT,
      source TEXT NOT NULL DEFAULT 'website',
      status TEXT NOT NULL DEFAULT 'new',
      notes TEXT,
      created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP(3) NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS leads_status_idx ON leads(status)`,
    `CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads(created_at)`,
    `CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP(3) NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS quotes (
      id TEXT PRIMARY KEY,
      number TEXT NOT NULL UNIQUE,
      lead_id TEXT NOT NULL,
      apartment_id TEXT NOT NULL,
      discount DOUBLE PRECISION NOT NULL DEFAULT 0,
      final_price DOUBLE PRECISION NOT NULL,
      payment_plan TEXT NOT NULL DEFAULT 'Contado',
      notes TEXT NOT NULL DEFAULT '',
      valid_days INTEGER NOT NULL DEFAULT 30,
      valid_until TIMESTAMP(3) NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP(3) NOT NULL,
      CONSTRAINT quotes_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT quotes_apartment_id_fkey FOREIGN KEY (apartment_id) REFERENCES apartments(id) ON DELETE CASCADE ON UPDATE CASCADE
    )`,
    `CREATE INDEX IF NOT EXISTS quotes_status_idx ON quotes(status)`,
    `CREATE INDEX IF NOT EXISTS quotes_created_at_idx ON quotes(created_at)`,
    `CREATE TABLE IF NOT EXISTS site_config (
      section TEXT PRIMARY KEY,
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMP(3) NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS floor_plans (
      id TEXT PRIMARY KEY,
      floor_number INTEGER NOT NULL UNIQUE,
      floor_name TEXT,
      image TEXT,
      apartments JSONB NOT NULL DEFAULT '[]'::jsonb,
      updated_at TIMESTAMP(3) NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS floor_images (
      id TEXT PRIMARY KEY,
      floor_id TEXT NOT NULL,
      image_url TEXT NOT NULL,
      label TEXT,
      "order" INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP(3) NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS floor_images_floor_id_idx ON floor_images(floor_id)`,
  ]

  for (const statement of statements) {
    await client.$executeRawUnsafe(statement)
  }
}

function json(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
}

export async function bootstrapCleanDatabase() {
  const sourceUrl = normalizeUrl(process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL)
  if (!sourceUrl) throw new Error('No existe DATABASE_URL/DIRECT_DATABASE_URL')

  const source = new PrismaClient({ datasourceUrl: sourceUrl })
  let target: PrismaClient | null = null

  try {
    const existing = await source.$queryRawUnsafe<Array<{ datname: string }>>(
      `SELECT datname FROM pg_database WHERE datname = '${TARGET_DATABASE.replace(/'/g, "''")}'`
    )

    if (existing.length === 0) {
      await source.$executeRawUnsafe(`CREATE DATABASE "${TARGET_DATABASE}"`)
    }

    const targetUrl = databaseUrlFor(TARGET_DATABASE, sourceUrl)
    target = new PrismaClient({ datasourceUrl: targetUrl })
    await target.$connect()
    await createSchema(target)

    const existingMeta = await target.siteConfig.findUnique({ where: { section: BOOTSTRAP_META } })
    const meta = existingMeta?.data as { version?: string } | null
    if (meta?.version === BOOTSTRAP_VERSION) {
      const total = await target.apartment.count()
      return { database: TARGET_DATABASE, created: false, seeded: true, apartments: total }
    }

    const [admins, amenities, leads, floorImages, configRows] = await Promise.all([
      source.adminUser.findMany(),
      source.amenity.findMany(),
      source.lead.findMany(),
      source.floorImage.findMany(),
      source.siteConfig.findMany(),
    ])

    await target.quote.deleteMany()
    await target.apartment.deleteMany()
    await target.floorPlan.deleteMany()
    await target.siteConfig.deleteMany()
    await target.floorImage.deleteMany()
    await target.lead.deleteMany()
    await target.amenity.deleteMany()
    await target.adminUser.deleteMany()

    if (admins.length) await target.adminUser.createMany({ data: admins })
    if (amenities.length) await target.amenity.createMany({ data: amenities })
    if (leads.length) await target.lead.createMany({ data: leads })
    if (floorImages.length) await target.floorImage.createMany({ data: floorImages })

    const apartmentRows = RESIDENTIAL_LEVELS.flatMap((level) =>
      COMMERCIAL_UNITS.map((unit) => {
        const heightPremium = HEIGHT_PREMIUM[level] ?? 0
        return {
          name: `Apto ${String(unit.unit).padStart(2, '0')}`,
          area: unit.area,
          bedrooms: unit.bedrooms,
          bathrooms: unit.bathrooms,
          floor: level,
          view: UNIT_VIEWS[unit.unit] || 'Por definir',
          typology: unit.typology,
          status: 'consult',
          price: apartmentCommercialPrice(level, unit.area, unit.pricePerM2),
          image: UNIT_IMAGES[unit.unit] || null,
          plan360Url: null,
          features: JSON.stringify([
            `Nivel ${String(level).padStart(2, '0')}`,
            `APTO ${String(unit.unit).padStart(2, '0')}`,
            `Valor base por m²: $${unit.pricePerM2.toLocaleString('es-CO')}`,
            `Prima de altura: $${heightPremium.toLocaleString('es-CO')}`,
          ]),
        }
      }),
    )
    await target.apartment.createMany({ data: apartmentRows })

    const canonical = canonicalFloorPlans as {
      floors: Array<{
        id: string
        name: string
        image?: string
        isResidential?: boolean
        apartments?: unknown[]
      }>
    }

    for (const floor of canonical.floors.filter((item) => item.isResidential)) {
      const match = floor.id.match(/nivel-(\d+)/i)
      const level = match ? Number(match[1]) : NaN
      if (!Number.isInteger(level)) continue
      await target.floorPlan.create({
        data: {
          floorNumber: level,
          floorName: floor.name,
          image: floor.image || null,
          apartments: json(floor.apartments || []),
        },
      })
    }

    // Preserve the current approved website content, but never carry internal
    // migration/back-up records into the new clean database.
    for (const row of configRows.filter((row) => !row.section.startsWith('__'))) {
      await target.siteConfig.upsert({
        where: { section: row.section },
        create: { section: row.section, data: json(row.data) },
        update: { data: json(row.data) },
      })
    }

    const staticConfig = staticSiteConfig as Record<string, unknown>
    const canonicalSections: Record<string, unknown> = {
      floor_plans: canonicalFloorPlans,
      tipologias: staticConfig.tipologias || {},
      commercialPricing: staticConfig.commercialPricing || {},
    }

    for (const [section, data] of Object.entries(canonicalSections)) {
      await target.siteConfig.upsert({
        where: { section },
        create: { section, data: json(data) },
        update: { data: json(data) },
      })
    }

    await target.siteConfig.upsert({
      where: { section: SITE_CONFIG_META },
      create: {
        section: SITE_CONFIG_META,
        data: json({ version: SITE_CONFIG_BASELINE, initializedAt: new Date().toISOString() }),
      },
      update: {
        data: json({ version: SITE_CONFIG_BASELINE, initializedAt: new Date().toISOString() }),
      },
    })

    const count = await target.apartment.count()
    const perFloor = await target.apartment.groupBy({
      by: ['floor'],
      _count: { _all: true },
      orderBy: { floor: 'asc' },
    })
    const apt04Level12 = await target.apartment.findFirst({
      where: { floor: 12, name: 'Apto 04' },
    })

    const valid =
      count === 120 &&
      perFloor.length === 12 &&
      perFloor.every((row) => row.floor >= 5 && row.floor <= 16 && row._count._all === 10) &&
      apt04Level12?.price === 732_000_000

    if (!valid) {
      throw new Error('Validación fallida: la nueva base no coincide con la tabla comercial oficial')
    }

    await target.siteConfig.upsert({
      where: { section: BOOTSTRAP_META },
      create: {
        section: BOOTSTRAP_META,
        data: json({
          version: BOOTSTRAP_VERSION,
          createdAt: new Date().toISOString(),
          apartments: count,
          levels: RESIDENTIAL_LEVELS,
          level12Apto04: apt04Level12?.price,
          quotesMigrated: 0,
        }),
      },
      update: {
        data: json({
          version: BOOTSTRAP_VERSION,
          createdAt: new Date().toISOString(),
          apartments: count,
          levels: RESIDENTIAL_LEVELS,
          level12Apto04: apt04Level12?.price,
          quotesMigrated: 0,
        }),
      },
    })

    return {
      database: TARGET_DATABASE,
      created: existing.length === 0,
      seeded: true,
      apartments: count,
      levels: perFloor.map((row) => ({ floor: row.floor, count: row._count._all })),
      level12Apto04: apt04Level12?.price,
      admins: admins.length,
      amenities: amenities.length,
      leads: leads.length,
      floorImages: floorImages.length,
    }
  } finally {
    await source.$disconnect().catch(() => undefined)
    if (target) await target.$disconnect().catch(() => undefined)
  }
}
