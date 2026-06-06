'use client'

// ============================================
// Google Analytics Component for PRAGA Living
// ============================================
// Drop-in GA4 component - only renders when NEXT_PUBLIC_GA_MEASUREMENT_ID is set

import Script from 'next/script'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, Suspense } from 'react'

// Declare gtag on window
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

// Track page views
function TrackPageViews() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!GA_MEASUREMENT_ID || GA_MEASUREMENT_ID.startsWith('PENDING')) return
    if (typeof window === 'undefined' || !window.gtag) return

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')

    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
    })
  }, [pathname, searchParams])

  return null
}

// Main GA component
export default function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID || GA_MEASUREMENT_ID.startsWith('PENDING')) {
    return null
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
      <Suspense fallback={null}>
        <TrackPageViews />
      </Suspense>
    </>
  )
}

// ============================================
// Utility: Track custom events
// ============================================
export function trackEvent(
  action: string,
  category: string,
  label?: string,
  value?: number
) {
  if (!GA_MEASUREMENT_ID || GA_MEASUREMENT_ID.startsWith('PENDING')) return
  if (typeof window === 'undefined' || !window.gtag) return

  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  })
}

// Pre-defined event trackers for PRAGA Living
export const trackEvents = {
  leadCreated: (source: string) => trackEvent('lead_created', 'conversion', source),
  quoteGenerated: (apartmentName: string) => trackEvent('quote_generated', 'conversion', apartmentName),
  apartmentViewed: (apartmentName: string) => trackEvent('apartment_viewed', 'engagement', apartmentName),
  tour360Started: () => trackEvent('tour_360_started', 'engagement'),
  whatsappClicked: () => trackEvent('whatsapp_clicked', 'conversion'),
  floorPlanViewed: (floor: number) => trackEvent('floor_plan_viewed', 'engagement', `Piso ${floor}`),
  contactFormSubmitted: () => trackEvent('contact_form_submitted', 'conversion'),
}
