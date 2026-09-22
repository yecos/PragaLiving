'use client'

import { useState, useEffect } from 'react'

export function useSiteConfig() {
  const [config, setConfig] = useState<Record<string, any> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/site-config')
      .then(r => r.json())
      .then(data => {
        setConfig(data)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [])

  return { config, loading }
}
