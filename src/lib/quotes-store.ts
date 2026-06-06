// Shared Quote types and utilities
// NOTE: Quote storage is now in data.ts (Supabase-first, in-memory fallback)
// This file only exports types and the unified generateQuoteNumber function

export interface Quote {
  id: string
  number: string
  leadId: string
  apartmentId: string
  discount: number
  finalPrice: number
  paymentPlan: string
  notes: string
  validDays: number
  validUntil: string
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
  createdAt: string
  updatedAt: string
}

// Legacy in-memory store — kept for backward compatibility with API routes
// that import from this module. New code should use data.ts functions.
const globalForQuotes = globalThis as unknown as {
  quotesStore: Quote[] | undefined
  quoteCounter: number | undefined
}
export const quotesStore: Quote[] = globalForQuotes.quotesStore ?? []
export let quoteCounter = globalForQuotes.quoteCounter ?? 0

if (!globalForQuotes.quotesStore) {
  globalForQuotes.quotesStore = quotesStore
  globalForQuotes.quoteCounter = quoteCounter
}

export function generateQuoteNumber(): string {
  quoteCounter++
  if (globalForQuotes.quoteCounter !== undefined) {
    globalForQuotes.quoteCounter = quoteCounter
  }
  const year = new Date().getFullYear()
  return `COT-${year}-${String(quoteCounter).padStart(4, '0')}`
}
