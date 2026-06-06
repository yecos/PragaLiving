// Rate limiting middleware for API routes
// Simple in-memory sliding window implementation

const windows = new Map<string, { count: number; resetAt: number }>()

interface RateLimitOptions {
  windowMs?: number   // Time window in milliseconds (default: 60s)
  maxRequests?: number // Max requests per window (default: 10)
}

const DEFAULT_OPTIONS: RateLimitOptions = {
  windowMs: 60_000,    // 1 minute
  maxRequests: 10,
}

export function rateLimit(options: RateLimitOptions = {}) {
  const windowMs: number = options.windowMs ?? DEFAULT_OPTIONS.windowMs!
  const maxRequests: number = options.maxRequests ?? DEFAULT_OPTIONS.maxRequests!

  return function checkRateLimit(identifier: string): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now()
    const entry = windows.get(identifier)

    // Clean up expired entries periodically (every 100 checks)
    if (Math.random() < 0.01) {
      for (const [key, val] of windows) {
        if (val.resetAt < now) windows.delete(key)
      }
    }

    if (!entry || entry.resetAt < now) {
      // New window
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
}

// Pre-configured rate limiters for different endpoints
export const chatRateLimit = rateLimit({ windowMs: 60_000, maxRequests: 8 })     // 8 chat messages per minute
export const leadsRateLimit = rateLimit({ windowMs: 60_000, maxRequests: 5 })     // 5 lead submissions per minute
export const adminRateLimit = rateLimit({ windowMs: 15_000, maxRequests: 5 })     // 5 login attempts per 15 seconds
export const genericRateLimit = rateLimit({ windowMs: 60_000, maxRequests: 30 })  // 30 requests per minute

// Helper to extract client identifier from request
export function getClientId(request: Request): string {
  // Use X-Forwarded-For header (set by Vercel/proxy) or fallback to IP
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return 'unknown'
}
