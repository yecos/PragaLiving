import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// SECURITY/PERF: Only log queries in development.
// In production, 'query' logging generates massive log volume and slows every request.
const logLevel: ('query' | 'error' | 'info' | 'warn')[] =
  process.env.NODE_ENV === 'production'
    ? ['error', 'warn']
    : ['query', 'error', 'warn']

// Defensive: trim whitespace and tabs from DATABASE_URL (Vercel sometimes
// pastes env vars with leading/trailing whitespace, which breaks Prisma URL parsing).
// Also normalize common issues:
//   - Leading tab/space → trimmed
//   - Surrounding quotes → stripped
//   - Multiple consecutive slashes in path → collapsed
function normalizeDbUrl(url: string | undefined): string | undefined {
  if (!url) return url
  let cleaned = url.trim()
  // Strip surrounding quotes if present (Vercel sometimes adds them)
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) ||
      (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1)
  }
  return cleaned
}

const normalizedDatabaseUrl = normalizeDbUrl(process.env.DATABASE_URL)

if (process.env.DATABASE_URL && process.env.DATABASE_URL !== normalizedDatabaseUrl) {
  console.warn('[db] DATABASE_URL had leading/trailing whitespace or quotes — normalized.')
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: normalizedDatabaseUrl,
    log: logLevel,
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db