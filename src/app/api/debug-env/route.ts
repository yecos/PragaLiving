import { NextResponse } from 'next/server'

export async function GET() {
  const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
  const urlPrefix = process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) || 'NOT SET'
  const keyPrefix = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) || 'NOT SET'

  // Try to create a Supabase client and test it
  let testResult = 'not_tested'
  if (hasUrl && hasKey) {
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const client = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data, error } = await client.from('site_config').select('section').limit(1)
      testResult = error ? `error: ${error.message}` : `ok: ${data?.length || 0} rows`
    } catch (err: any) {
      testResult = `exception: ${err.message}`
    }
  }

  return NextResponse.json({
    hasUrl,
    hasKey,
    hasServiceKey,
    urlPrefix,
    keyPrefix,
    nodeEnv: process.env.NODE_ENV,
    testResult,
  })
}

export const dynamic = 'force-dynamic'
