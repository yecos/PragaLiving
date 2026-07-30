// ============================================
// One-time migration: Supabase → Neon (via Prisma)
// ============================================
// Usage:
//   bun run scripts/migrate-to-neon.ts
//
// Prerequisites:
//   1. Set DATABASE_URL and DIRECT_DATABASE_URL in .env to your Neon project
//   2. Run `bun run db:push` to create the schema in Neon
//   3. Run this script to import data from Supabase (if you want to preserve leads)
//
// If you don't have Supabase env vars set, the script will skip the data
// migration and just seed the database with defaults via prisma/seed.ts.

import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

async function main() {
  console.log('=== Neon Migration Script ===\n')

  // Step 1: Check Neon connection
  try {
    await prisma.$queryRaw`SELECT 1`
    console.log('✓ Neon connection: OK')
  } catch (err) {
    console.error('✗ Neon connection failed. Check DATABASE_URL:', err)
    process.exit(1)
  }

  // Step 2: Check if we have Supabase credentials (optional)
  const hasSupabase = !!(SUPABASE_URL && SUPABASE_SERVICE_KEY)

  if (!hasSupabase) {
    console.log('\n⚠ No Supabase credentials found. Skipping data migration.')
    console.log('  To migrate existing data from Supabase, set:')
    console.log('    NEXT_PUBLIC_SUPABASE_URL')
    console.log('    SUPABASE_SERVICE_ROLE_KEY')
    console.log('\n  Otherwise, run `bun run db:seed` to populate with defaults.\n')
    return
  }

  console.log('\n✓ Supabase credentials found. Starting data migration...\n')

  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!)

  // Step 3: Migrate leads (most important — PII)
  console.log('--- Migrating leads ---')
  const { data: leads, error: leadsErr } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: true })

  if (leadsErr) {
    console.error('✗ Failed to fetch leads:', leadsErr.message)
  } else if (leads && leads.length > 0) {
    let imported = 0
    for (const lead of leads) {
      try {
        await prisma.lead.upsert({
          where: { id: lead.id },
          create: {
            id: lead.id,
            name: lead.name,
            phone: lead.phone,
            email: lead.email,
            interest: lead.interest || null,
            message: lead.message || null,
            source: lead.source || 'website',
            status: lead.status || 'new',
            notes: lead.notes || null,
          },
          update: {},
        })
        imported++
      } catch (err) {
        console.error(`  ✗ Failed to import lead ${lead.id}:`, err)
      }
    }
    console.log(`  ✓ Imported ${imported}/${leads.length} leads`)
  } else {
    console.log('  - No leads to migrate')
  }

  // Step 4: Migrate site_config
  console.log('\n--- Migrating site_config ---')
  const { data: configs, error: configErr } = await supabase
    .from('site_config')
    .select('*')

  if (configErr) {
    console.error('✗ Failed to fetch site_config:', configErr.message)
  } else if (configs && configs.length > 0) {
    let imported = 0
    for (const cfg of configs) {
      // Handle both column name conventions (section/data OR key/value)
      const section = cfg.section || cfg.key
      const rawData = cfg.data ?? cfg.value
      const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData
      if (section) {
        try {
          await prisma.siteConfig.upsert({
            where: { section },
            create: { section, data },
            update: { data },
          })
          imported++
        } catch (err) {
          console.error(`  ✗ Failed to import section ${section}:`, err)
        }
      }
    }
    console.log(`  ✓ Imported ${imported}/${configs.length} config sections`)
  } else {
    console.log('  - No site_config to migrate')
  }

  // Step 5: Migrate quotes
  console.log('\n--- Migrating quotes ---')
  const { data: quotes, error: quotesErr } = await supabase
    .from('quotes')
    .select('*')
    .order('created_at', { ascending: true })

  if (quotesErr) {
    console.error('✗ Failed to fetch quotes:', quotesErr.message)
  } else if (quotes && quotes.length > 0) {
    let imported = 0
    for (const q of quotes) {
      try {
        await prisma.quote.upsert({
          where: { id: q.id },
          create: {
            id: q.id,
            number: q.number,
            leadId: q.lead_id,
            apartmentId: q.apartment_id,
            discount: Number(q.discount || 0),
            finalPrice: Number(q.final_price || 0),
            paymentPlan: q.payment_plan || 'Contado',
            notes: q.notes || '',
            validDays: q.valid_days || 30,
            validUntil: new Date(q.valid_until || Date.now() + 30 * 24 * 60 * 60 * 1000),
            status: q.status || 'draft',
          },
          update: {},
        })
        imported++
      } catch (err) {
        console.error(`  ✗ Failed to import quote ${q.id}:`, err)
      }
    }
    console.log(`  ✓ Imported ${imported}/${quotes.length} quotes`)
  } else {
    console.log('  - No quotes to migrate')
  }

  // Step 6: Migrate floor_plans table (if exists)
  console.log('\n--- Migrating floor_plans ---')
  const { data: floors, error: floorsErr } = await supabase
    .from('floor_plans')
    .select('*')
    .order('floor_number', { ascending: true })

  if (floorsErr) {
    console.log('  - floor_plans table not found or empty, skipping')
  } else if (floors && floors.length > 0) {
    let imported = 0
    for (const f of floors) {
      try {
        await prisma.floorPlan.upsert({
          where: { floorNumber: f.floor_number },
          create: {
            floorNumber: f.floor_number,
            floorName: f.floor_name || `Piso ${f.floor_number}`,
            image: f.image || null,
            apartments: f.apartments || [],
          },
          update: {},
        })
        imported++
      } catch (err) {
        console.error(`  ✗ Failed to import floor ${f.floor_number}:`, err)
      }
    }
    console.log(`  ✓ Imported ${imported}/${floors.length} floor plans`)
  } else {
    console.log('  - No floor_plans to migrate')
  }

  // Step 7: Migrate admin_users (re-hash passwords if needed)
  console.log('\n--- Migrating admin_users ---')
  const { data: admins, error: adminsErr } = await supabase
    .from('admin_users')
    .select('*')

  if (adminsErr) {
    console.error('✗ Failed to fetch admin_users:', adminsErr.message)
  } else if (admins && admins.length > 0) {
    let imported = 0
    for (const a of admins) {
      try {
        // If password is plaintext, hash it before importing
        let passwordHash = a.password
        if (!a.password.startsWith('$2a$') && !a.password.startsWith('$2b$')) {
          console.log(`  ⚠ Admin ${a.username} has plaintext password — hashing now`)
          passwordHash = bcrypt.hashSync(a.password, 12)
        }
        await prisma.adminUser.upsert({
          where: { username: a.username },
          create: {
            id: a.id,
            username: a.username,
            password: passwordHash,
            name: a.name || 'Admin',
            role: a.role || 'admin',
          },
          update: {},
        })
        imported++
      } catch (err) {
        console.error(`  ✗ Failed to import admin ${a.username}:`, err)
      }
    }
    console.log(`  ✓ Imported ${imported}/${admins.length} admin users`)
  } else {
    console.log('  - No admin_users to migrate')
  }

  console.log('\n=== Migration complete! ===')
  console.log('Next steps:')
  console.log('  1. Update Vercel env vars:')
  console.log('     - DATABASE_URL (Neon pooled)')
  console.log('     - DIRECT_DATABASE_URL (Neon direct)')
  console.log('     - Remove NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY')
  console.log('     - Keep ADMIN_USERNAME, ADMIN_PASSWORD_HASH, NEXTAUTH_SECRET, etc.')
  console.log('  2. Remove the Supabase integration from Vercel project settings.')
  console.log('  3. Deploy and verify.')
}

main()
  .catch((e) => {
    console.error('Migration failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
