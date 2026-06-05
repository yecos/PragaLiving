import { NextResponse } from 'next/server'

export async function GET() {
  const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const urlPrefix = process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) || 'NOT SET'

  // Try to create a Supabase client and test it
  let testResult = 'not_tested'
  let tableInfo = 'not_checked'
  let allTables = 'not_checked'
  if (hasUrl && hasKey) {
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const client = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      // Test reading site_config
      const { data, error } = await client.from('site_config').select('*').limit(1)
      testResult = error ? `error: ${error.message} (code: ${error.code})` : `ok: ${data?.length || 0} rows`
      
      if (data && data.length > 0) {
        tableInfo = JSON.stringify(Object.keys(data[0]))
      }

      // List all tables by trying common ones
      const tables = ['apartments', 'amenities', 'leads', 'admin_users', 'site_config', 'floor_plans', 'quotes']
      const existing = []
      for (const t of tables) {
        const { error: e } = await client.from(t).select('*').limit(1)
        if (!e || e.code !== '42P01') existing.push(t)
      }
      allTables = existing.join(', ')
    } catch (err: any) {
      testResult = `exception: ${err.message}`
    }
  }

  return NextResponse.json({
    hasUrl,
    hasKey,
    urlPrefix,
    testResult,
    tableInfo,
    allTables,
  })
}

export const dynamic = 'force-dynamic'
