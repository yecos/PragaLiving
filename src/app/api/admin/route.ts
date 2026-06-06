import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/data'
import { adminRateLimit, getClientId } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  // Rate limiting — 5 login attempts per 15 seconds per client
  const clientId = getClientId(req)
  const { allowed, resetAt } = adminRateLimit(clientId)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Por favor espera antes de intentar de nuevo.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)) } }
    )
  }

  try {
    const body = await req.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json({ error: 'Usuario y contraseña requeridos' }, { status: 400 })
    }

    const result = await verifyAdmin(username, password)

    if (result.success) {
      return NextResponse.json({ success: true, user: result.user })
    } else {
      return NextResponse.json({ error: result.error }, { status: 401 })
    }
  } catch {
    return NextResponse.json({ error: 'Error al iniciar sesión' }, { status: 500 })
  }
}
