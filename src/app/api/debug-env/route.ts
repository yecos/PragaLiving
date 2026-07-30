import { NextResponse } from 'next/server'

// TEMPORARY diagnostic endpoint — REMOVE after debugging.
// Returns sanitized env var status so we can see what's missing in Vercel.
export async function GET() {
  const env = {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL_set: !!process.env.DATABASE_URL,
    DATABASE_URL_starts_with: process.env.DATABASE_URL?.substring(0, 30) + '...',
    DATABASE_URL_has_pooler: process.env.DATABASE_URL?.includes('-pooler-') ?? false,
    DATABASE_URL_has_pgbouncer: process.env.DATABASE_URL?.includes('pgbouncer=true') ?? false,
    DIRECT_DATABASE_URL_set: !!process.env.DIRECT_DATABASE_URL,
    DIRECT_DATABASE_URL_starts_with: process.env.DIRECT_DATABASE_URL?.substring(0, 30) + '...',
    ADMIN_USERNAME_set: !!process.env.ADMIN_USERNAME,
    ADMIN_PASSWORD_HASH_set: !!process.env.ADMIN_PASSWORD_HASH,
    NEXTAUTH_SECRET_set: !!process.env.NEXTAUTH_SECRET,
    NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
    // Old Supabase vars (should be removed)
    NEXT_PUBLIC_SUPABASE_URL_set: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY_set: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY_set: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  }

  return NextResponse.json(env, { status: 200 })
}
