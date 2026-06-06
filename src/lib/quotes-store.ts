// Shared in-memory quote store for the quotes API
// Uses globalThis to ensure state persists across module instances in Next.js dev mode

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

// Use globalThis to persist across HMR and different route handlers
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
