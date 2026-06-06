// ============================================
// PRAGA Living - Supabase Diagnostics Script
// ============================================
// Tests all Supabase components: connection, tables, storage, upload
// Uses environment variables instead of hardcoded secrets

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Faltan variables de entorno. Exporta:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL')
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY')
  console.error('   SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

console.log('═══════════════════════════════════════════')
console.log('  PRAGA Living - Diagnóstico de Supabase')
console.log('═══════════════════════════════════════════\n')

async function supabaseRequest(path, options = {}) {
  const key = options.useServiceRole ? SUPABASE_SERVICE_ROLE_KEY : SUPABASE_ANON_KEY
  const url = `${SUPABASE_URL}/rest/v1/${path}`
  const headers = {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
    'Prefer': options.prefer || 'return=representation',
  }
  const fetchOptions = { method: options.method || 'GET', headers }
  if (options.body) fetchOptions.body = JSON.stringify(options.body)
  try {
    const res = await fetch(url, fetchOptions)
    const data = await res.text()
    let parsed; try { parsed = JSON.parse(data) } catch { parsed = data }
    return { status: res.status, ok: res.ok, data: parsed }
  } catch (err) {
    return { status: 0, ok: false, error: err.message }
  }
}

async function checkStorage() {
  const key = SUPABASE_SERVICE_ROLE_KEY
  const url = `${SUPABASE_URL}/storage/v1/bucket/floor-plans`
  try {
    const res = await fetch(url, { headers: { 'apikey': key, 'Authorization': `Bearer ${key}` } })
    const data = await res.text()
    let parsed; try { parsed = JSON.parse(data) } catch { parsed = data }
    return { status: res.status, ok: res.ok, data: parsed }
  } catch (err) {
    return { status: 0, ok: false, error: err.message }
  }
}

async function testStorageUpload() {
  const key = SUPABASE_SERVICE_ROLE_KEY
  const url = `${SUPABASE_URL}/storage/v1/object/floor-plans/test-upload/test-${Date.now()}.txt`
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'text/plain' },
      body: 'This is a test file from PRAGA diagnostics'
    })
    const data = await res.text()
    let parsed; try { parsed = JSON.parse(data) } catch { parsed = data }
    return { status: res.status, ok: res.ok, data: parsed }
  } catch (err) {
    return { status: 0, ok: false, error: err.message }
  }
}

async function listBuckets() {
  const key = SUPABASE_SERVICE_ROLE_KEY
  const url = `${SUPABASE_URL}/storage/v1/bucket`
  try {
    const res = await fetch(url, { headers: { 'apikey': key, 'Authorization': `Bearer ${key}` } })
    const data = await res.text()
    let parsed; try { parsed = JSON.parse(data) } catch { parsed = data }
    return { status: res.status, ok: res.ok, data: parsed }
  } catch (err) {
    return { status: 0, ok: false, error: err.message }
  }
}

async function runDiagnostics() {
  const results = {}

  // 1. TEST CONNECTION (anon key)
  console.log('1. Probando conexión con Anon Key...')
  const connTest = await supabaseRequest('apartments?select=id&limit=1')
  results.connection = connTest.ok
  console.log(`   ${connTest.ok ? '✅' : '❌'} Status: ${connTest.status}`)
  if (!connTest.ok) console.log(`   Error:`, JSON.stringify(connTest.data).substring(0, 200))

  // 2. TEST SERVICE ROLE KEY
  console.log('\n2. Probando Service Role Key...')
  const srTest = await supabaseRequest('apartments?select=id&limit=1', { useServiceRole: true })
  results.serviceRole = srTest.ok
  console.log(`   ${srTest.ok ? '✅' : '❌'} Status: ${srTest.status}`)
  if (!srTest.ok) console.log(`   Error:`, JSON.stringify(srTest.data).substring(0, 200))

  // 3. CHECK ALL TABLES
  console.log('\n3. Verificando tablas...')
  const tables = ['apartments', 'amenities', 'leads', 'admin_users', 'site_config', 'quotes', 'floor_images']
  results.tables = {}
  for (const table of tables) {
    const res = await supabaseRequest(`${table}?select=id&limit=1`, { useServiceRole: true })
    results.tables[table] = res.ok
    const icon = res.ok ? '✅' : '❌'
    let count = '?'
    if (res.ok) {
      const countRes = await supabaseRequest(`${table}?select=id`, { useServiceRole: true })
      if (countRes.ok && Array.isArray(countRes.data)) count = countRes.data.length
    }
    console.log(`   ${icon} ${table}: ${res.ok ? `${count} registros` : `Error ${res.status}`}`)
    if (!res.ok) console.log(`      ${JSON.stringify(res.data).substring(0, 150)}`)
  }

  // 4. CHECK STORAGE BUCKETS
  console.log('\n4. Verificando Storage Buckets...')
  const buckets = await listBuckets()
  results.buckets = buckets.ok
  if (buckets.ok && Array.isArray(buckets.data)) {
    console.log(`   ✅ Buckets encontrados: ${buckets.data.length}`)
    for (const b of buckets.data) {
      console.log(`      - ${b.id} (public: ${b.public}, size_limit: ${b.file_size_limit || 'none'})`)
    }
    const hasFloorPlans = buckets.data.some(b => b.id === 'floor-plans')
    results.floorPlansBucket = hasFloorPlans
    console.log(`   ${hasFloorPlans ? '✅' : '❌'} Bucket 'floor-plans' ${hasFloorPlans ? 'existe' : 'NO EXISTE'}`)
  } else {
    console.log(`   ❌ Error listando buckets: Status ${buckets.status}`)
    console.log(`      ${JSON.stringify(buckets.data).substring(0, 200)}`)
    results.floorPlansBucket = false
  }

  // 5. CHECK FLOOR-PLANS BUCKET DETAILS
  console.log('\n5. Detalles del bucket floor-plans...')
  const bucketDetails = await checkStorage()
  if (bucketDetails.ok) {
    console.log(`   ✅ Bucket encontrado`)
    console.log(`      ID: ${bucketDetails.data.id}`)
    console.log(`      Public: ${bucketDetails.data.public}`)
    console.log(`      File size limit: ${bucketDetails.data.file_size_limit || 'none'}`)
    console.log(`      Allowed MIME: ${JSON.stringify(bucketDetails.data.allowed_mime_types || 'none')}`)
  } else {
    console.log(`   ❌ Bucket no encontrado o error: Status ${bucketDetails.status}`)
    console.log(`      ${JSON.stringify(bucketDetails.data).substring(0, 200)}`)
  }

  // 6. TEST UPLOAD TO STORAGE
  console.log('\n6. Probando subida de archivo al storage...')
  const uploadTest = await testStorageUpload()
  results.upload = uploadTest.ok
  if (uploadTest.ok) {
    console.log(`   ✅ Upload exitoso!`)
    console.log(`      Key: ${uploadTest.data.Key || uploadTest.data.key || 'N/A'}`)
  } else {
    console.log(`   ❌ Upload falló: Status ${uploadTest.status}`)
    console.log(`      ${JSON.stringify(uploadTest.data).substring(0, 300)}`)
  }

  // 7. CHECK FLOOR_IMAGES DATA
  console.log('\n7. Verificando datos de floor_images...')
  const floorImages = await supabaseRequest('floor_images?select=*&limit=5', { useServiceRole: true })
  if (floorImages.ok) {
    console.log(`   ✅ floor_images accesible: ${Array.isArray(floorImages.data) ? floorImages.data.length : 0} registros (muestra)`)
    if (Array.isArray(floorImages.data) && floorImages.data.length > 0) {
      for (const img of floorImages.data.slice(0, 3)) {
        console.log(`      - ${img.id}: floor_id=${img.floor_id}, url=${img.image_url?.substring(0, 60)}...`)
      }
    }
  } else {
    console.log(`   ❌ Error: ${floorImages.status}`)
    console.log(`      ${JSON.stringify(floorImages.data).substring(0, 200)}`)
  }

  // 8. CHECK STORAGE POLICIES (anon read)
  console.log('\n8. Verificando políticas de storage (lectura pública)...')
  const anonKey = SUPABASE_ANON_KEY
  const listUrl = `${SUPABASE_URL}/storage/v1/object/list/floor-plans`
  try {
    const listRes = await fetch(listUrl, {
      method: 'POST',
      headers: { 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ limit: 5 })
    })
    const listData = await listRes.text()
    let parsed; try { parsed = JSON.parse(listData) } catch { parsed = listData }
    if (listRes.ok) {
      console.log(`   ✅ Lectura pública funciona: ${Array.isArray(parsed) ? parsed.length : 0} objetos`)
    } else {
      console.log(`   ❌ Lectura pública falló: Status ${listRes.status}`)
      console.log(`      ${JSON.stringify(parsed).substring(0, 200)}`)
    }
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`)
  }

  // SUMMARY
  console.log('\n═══════════════════════════════════════════')
  console.log('  RESUMEN DE DIAGNÓSTICO')
  console.log('═══════════════════════════════════════════')
  const issues = []
  if (!results.connection) issues.push('❌ Conexión con Anon Key falla')
  if (!results.serviceRole) issues.push('❌ Conexión con Service Role Key falla')
  if (!results.tables.floor_images) issues.push('❌ Tabla floor_images NO EXISTE - Ejecutar schema.sql')
  if (!results.floorPlansBucket) issues.push('❌ Bucket de storage floor-plans NO EXISTE - Ejecutar schema.sql')
  if (!results.upload) issues.push('❌ Subida de archivos al storage FALLA')
  Object.entries(results.tables).forEach(([table, ok]) => {
    if (!ok) issues.push(`❌ Tabla ${table} no accesible`)
  })
  if (issues.length === 0) {
    console.log('\n  ✅ Todo funciona correctamente!')
  } else {
    console.log('\n  Problemas encontrados:')
    issues.forEach(i => console.log(`  ${i}`))
  }
  console.log('\n═══════════════════════════════════════════')
}

runDiagnostics().catch(console.error)
