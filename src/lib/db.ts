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

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: logLevel,
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db