/**
 * Seed floor_plans data into Supabase site_config table
 * and create the uploads storage bucket.
 *
 * Usage: node scripts/seed-floor-plans.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load env vars from .env file
const envPath = join(__dirname, '..', '.env')
const envContent = readFileSync(envPath, 'utf-8')
const envVars = {}
for (const line of envContent.split('\n')) {
  const match = line.match(/^([A-Z_]+)=(.*)$/)
  if (match) envVars[match[1]] = match[2]
}

const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase env vars. Check .env file.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function main() {
  console.log('🏗️  Seeding floor_plans into site_config...\n')

  // 1. Read the floor-plans.json data
  const jsonPath = join(__dirname, '..', 'src', 'data', 'floor-plans.json')
  const floorPlansData = JSON.parse(readFileSync(jsonPath, 'utf-8'))

  console.log(`   Loaded ${floorPlansData.floors.length} floors from floor-plans.json`)

  // 2. Upsert into site_config
  const { data, error } = await supabase
    .from('site_config')
    .upsert(
      {
        section: 'floor_plans',
        data: floorPlansData,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'section' }
    )
    .select()

  if (error) {
    console.error('   ❌ Error upserting site_config:', error.message)
    process.exit(1)
  }

  console.log('   ✅ Floor plans saved to site_config')

  // 3. Verify the data
  const { data: verifyData, error: verifyError } = await supabase
    .from('site_config')
    .select('data')
    .eq('section', 'floor_plans')
    .single()

  if (verifyError) {
    console.error('   ❌ Error verifying:', verifyError.message)
  } else {
    const floors = verifyData.data?.floors || []
    console.log(`   ✅ Verified: ${floors.length} floors stored in site_config`)
    for (const f of floors.slice(0, 5)) {
      console.log(`      - ${f.name}: ${f.apartments?.length || 0} apartments`)
    }
    if (floors.length > 5) {
      console.log(`      ... and ${floors.length - 5} more`)
    }
  }

  // 4. Create uploads bucket
  console.log('\n📦 Setting up Supabase Storage bucket "uploads"...')
  const { data: buckets } = await supabase.storage.listBuckets()
  const bucketExists = buckets?.some(b => b.name === 'uploads')

  if (bucketExists) {
    console.log('   ✅ Bucket "uploads" already exists')
  } else {
    const { error: bucketError } = await supabase.storage.createBucket('uploads', {
      public: true,
      fileSizeLimit: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
    })

    if (bucketError) {
      console.error('   ⚠️  Could not create bucket:', bucketError.message)
      console.log('   Please create it manually in Supabase Dashboard → Storage')
    } else {
      console.log('   ✅ Bucket "uploads" created successfully')
    }
  }

  console.log('\n✨ Done! Floor plans are now persisted in Supabase.')
  console.log('   The admin editor will save overlay changes to site_config.')
  console.log('   The public viewer will load overlays from site_config.\n')
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
