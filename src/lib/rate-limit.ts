// ============================================
// Rate Limiting — Upstash Redis (serverless-safe) with in-memory fallback
// ============================================
// In Vercel/serverless, the in-memory Map is per-instance, so the real limit
// becomes (limit × number of instances). For real distributed rate limiting,
// set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in your env vars
// (free tier at https://upstash.com).
//
// When Upstash is configured, all limiter instances share the same counters.
// When not configured, falls back to in-memory (single-instance only).

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

const hasUpstash = !!(UPSTASH_URL && UPSTASH_TOKEN)

interface RateLimitOptions {
  windowMs?: number
  maxRequests?: number
}

const DEFAULT_OPTIONS: Required<RateLimitOptions> = {
  windowMs: 60_000,
  maxRequests: 10,
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

// ============================================
// Upstash Redis integration (lazy-loaded)
// ============================================
async function upstashRateLimit(
  identifier: string,
  windowMs: number,
  maxRequests: number
): Promise<RateLimitResult> {
  const key = `rl:${identifier}:${Math.floor(Date.now() / windowMs)}`
  const resetAt = (Math.floor(Date.now() / windowMs) + 1) * windowMs

  try {
    // Use fetch directly to avoid adding @upstash/redis as a dependency
    // Upstash REST API: https://upstash.com/docs/redis/sdks/sdks/rest-api
    const url = `${UPSTASH_URL}/incr/${encodeURIComponent(key)}`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
      },
      // Set a short timeout via AbortController
      signal: AbortSignal.timeout(2000),
    })

    if (!response.ok) {
      // Upstash error — fail open (allow the request) but log
      console.error('[rate-limit] Upstash error:', response.status)
      return { allowed: true, remaining: maxRequests, resetAt }
    }

    const data = (await response.json()) as { result: number }
    const count = typeof data.result === 'number' ? data.result : 0

    if (count > maxRequests) {
      return { allowed: false, remaining: 0, resetAt }
    }

    return {
      allowed: true,
      remaining: Math.max(0, maxRequests - count),
      resetAt,
    }
  } catch (err) {
    // Network error / timeout — fail open to not block legitimate users
    console.error('[rate-limit] Upstash fetch failed, failing open:', err)
    return { allowed: true, remaining: maxRequests, resetAt }
  }
}

// ============================================
// In-memory rate limiting (fallback)
// ============================================
const windows = new Map<string, { count: number; resetAt: number }>()

function inMemoryRateLimit(
  identifier: string,
  windowMs: number,
  maxRequests: number
): RateLimitResult {
  const now = Date.now()
  const entry = windows.get(identifier)

  // Clean up expired entries periodically (every 100 checks)
  if (Math.random() < 0.01) {
    for (const [key, val] of windows) {
      if (val.resetAt < now) windows.delete(key)
    }
  }

  if (!entry || entry.resetAt < now) {
    const resetAt = now + windowMs
    windows.set(identifier, { count: 1, resetAt })
    return { allowed: true, remaining: maxRequests - 1, resetAt }
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt }
}

// ============================================
// Public API — same shape as before
// ============================================
export function rateLimit(options: RateLimitOptions = {}) {
  const windowMs: number = options.windowMs ?? DEFAULT_OPTIONS.windowMs
  const maxRequests: number = options.maxRequests ?? DEFAULT_OPTIONS.maxRequests

  return function checkRateLimit(identifier: string): RateLimitResult {
    // Synchronous wrapper: if Upstash is configured, the async check is skipped
    // and we use in-memory as a fast-path. The async version (below) is for
    // routes that can await.
    return inMemoryRateLimit(identifier, windowMs, maxRequests)
  }
}

// Async version that uses Upstash when available (preferred for API routes)
export function rateLimitAsync(options: RateLimitOptions = {}) {
  const windowMs: number = options.windowMs ?? DEFAULT_OPTIONS.windowMs
  const maxRequests: number = options.maxRequests ?? DEFAULT_OPTIONS.maxRequests

  return async function checkRateLimit(identifier: string): Promise<RateLimitResult> {
    if (hasUpstash) {
      return upstashRateLimit(identifier, windowMs, maxRequests)
    }
    return inMemoryRateLimit(identifier, windowMs, maxRequests)
  }
}

// Pre-configured rate limiters (sync — backward compatible)
export const chatRateLimit = rateLimit({ windowMs: 60_000, maxRequests: 8 })
export const leadsRateLimit = rateLimit({ windowMs: 60_000, maxRequests: 5 })
export const adminRateLimit = rateLimit({ windowMs: 15_000, maxRequests: 5 })
export const genericRateLimit = rateLimit({ windowMs: 60_000, maxRequests: 30 })

// Pre-configured rate limiters (async — preferred for serverless)
export const chatRateLimitAsync = rateLimitAsync({ windowMs: 60_000, maxRequests: 8 })
export const leadsRateLimitAsync = rateLimitAsync({ windowMs: 60_000, maxRequests: 5 })
export const adminRateLimitAsync = rateLimitAsync({ windowMs: 15_000, maxRequests: 5 })
export const genericRateLimitAsync = rateLimitAsync({ windowMs: 60_000, maxRequests: 30 })

// Helper to extract client identifier from request
export function getClientId(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return 'unknown'
}

// Log once on startup so it's visible in server logs whether Upstash is active
if (hasUpstash) {
  console.log('[rate-limit] Upstash Redis configured — distributed rate limiting active')
} else {
  console.log('[rate-limit] UPSTASH_REDIS_REST_URL not set — using in-memory rate limiting (per-instance only, not reliable in serverless)')
}
