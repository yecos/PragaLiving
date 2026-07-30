// ============================================
// Auth Guard for API Routes
// ============================================
// Reusable helper that enforces admin authentication on API routes.
// Usage:
//   import { requireAdmin } from '@/lib/auth-guard'
//   export async function POST(req: NextRequest) {
//     const auth = await requireAdmin(req)
//     if (auth.error) return auth.error
//     // ... handler body
//   }

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'

export interface AuthResult {
  authorized: boolean
  error?: NextResponse
  user?: { id?: string | null; name?: string | null; email?: string | null; role?: string | null }
}

/**
 * Require an authenticated admin session for an API route.
 * Returns { authorized: true, user } on success, or { authorized: false, error } on failure.
 * The error is a ready-to-return NextResponse (401 JSON).
 */
export async function requireAdmin(req: NextRequest): Promise<AuthResult> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return {
        authorized: false,
        error: NextResponse.json(
          { error: 'No autenticado' },
          { status: 401 }
        ),
      }
    }

    // Optional: enforce role if you have editor vs admin distinctions
    const role = (session.user as { role?: string }).role
    if (role && role !== 'admin' && role !== 'editor') {
      return {
        authorized: false,
        error: NextResponse.json(
          { error: 'Permisos insuficientes' },
          { status: 403 }
        ),
      }
    }

    return {
      authorized: true,
      user: session.user as AuthResult['user'],
    }
  } catch (err) {
    console.error('[auth-guard] requireAdmin error:', err)
    return {
      authorized: false,
      error: NextResponse.json(
        { error: 'Error de autenticación' },
        { status: 500 }
      ),
    }
  }
}

/**
 * CSRF protection: verify that the request originates from the same site.
 * Checks the Origin header against the Host header.
 * Returns null if valid, or a NextResponse (403) if invalid.
 *
 * This is a defense-in-depth layer. The primary protection is SameSite cookies
 * set by NextAuth, but Origin checking helps for state-changing routes.
 */
export function checkCsrf(req: NextRequest): NextResponse | null {
  const method = req.method.toUpperCase()

  // Only check state-changing methods
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return null
  }

  const origin = req.headers.get('origin')
  const host = req.headers.get('host')
  const forwardedHost = req.headers.get('x-forwarded-host')

  // Allow same-origin requests (Origin matches Host)
  if (origin && host) {
    try {
      const originUrl = new URL(origin)
      const effectiveHost = forwardedHost || host
      if (originUrl.host === effectiveHost) {
        return null
      }
    } catch {
      // Invalid origin URL — treat as CSRF
    }
  }

  // Allow requests with no Origin (mobile apps, curl, server-to-server with proper auth)
  // — these still need to pass requireAdmin() check
  if (!origin) {
    return null
  }

  return NextResponse.json(
    { error: 'Solicitud no permitida desde este origen' },
    { status: 403 }
  )
}

/**
 * Combined helper: check CSRF first, then require admin session.
 * Use this for state-changing admin endpoints.
 */
export async function requireAdminWithCsrf(req: NextRequest): Promise<AuthResult> {
  const csrfError = checkCsrf(req)
  if (csrfError) {
    return { authorized: false, error: csrfError }
  }
  return requireAdmin(req)
}
