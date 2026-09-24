
'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { useSiteConfig } from '@/hooks/useSiteConfig'

type Typology = {
  id: string
  unit: string
  name: string
  area: string
  bedrooms: string
  bathrooms: string
  images: string[]
  description: string
  features: string[]
  status: string
}

const typologyImages = (prefix: string, count: number) =>
  Array.from({ length: count }, (_, index) =>
    '/images/typologies/' + prefix + '-' + String(index + 1).padStart(2, '0') + '.jpg',
  )

const defaultTypologies: Typology[] = [
  {
    id: 'tipo-01', unit: '01', name: 'APTO 01 · 78.51 m²', area: '78.51', bedrooms: '3', bathrooms: '2',
    images: typologyImages('78', 5),
    description: 'Tipología APTO 01 de 78.51 m². Se mantiene independiente de las demás por su posición, orientación y distribución dentro de la planta.',
    features: ['APTO 01', '3 Habitaciones', '2 Baños', 'Valor base por m²: $7.000.000'],
    status: 'Consultar disponibilidad',
  },
  {
    id: 'tipo-02', unit: '02', name: 'APTO 02 · 60 m²', area: '60', bedrooms: '2', bathrooms: '1',
    images: typologyImages('60', 6),
    description: 'Tipología APTO 02 de 60 m². Aunque comparte metraje con APTO 03, corresponde a una tipología independiente.',
    features: ['APTO 02', '2 Habitaciones', '1 Baño', 'Valor base por m²: $7.000.000'],
    status: 'Consultar disponibilidad',
  },
  {
    id: 'tipo-03', unit: '03', name: 'APTO 03 · 60 m²', area: '60', bedrooms: '2', bathrooms: '1',
    images: typologyImages('60', 6),
    description: 'Tipología APTO 03 de 60 m². Se presenta por separado de APTO 02 por su ubicación y configuración en planta.',
    features: ['APTO 03', '2 Habitaciones', '1 Baño', 'Valor base por m²: $7.000.000'],
    status: 'Consultar disponibilidad',
  },
  {
    id: 'tipo-04', unit: '04', name: 'APTO 04 · 104 m²', area: '104', bedrooms: '3', bathrooms: '2',
    images: typologyImages('104', 11),
    description: 'Tipología APTO 04 de 104 m², la unidad de mayor área del nivel.',
    features: ['APTO 04', '3 Habitaciones', '2 Baños', 'Valor base por m²: $7.000.000'],
    status: 'Consultar disponibilidad',
  },
  {
    id: 'tipo-05', unit: '05', name: 'APTO 05 · 34.28 m²', area: '34.28', bedrooms: '1', bathrooms: '1',
    images: typologyImages('33', 4),
    description: 'Tipología APTO 05, apartaestudio de 34.28 m².',
    features: ['APTO 05', '1 Alcoba', '1 Baño', 'Valor base por m²: $7.500.000'],
    status: 'Consultar disponibilidad',
  },
  {
    id: 'tipo-06', unit: '06', name: 'APTO 06 · 35.6 m²', area: '35.6', bedrooms: '1', bathrooms: '1',
    images: typologyImages('33', 4),
    description: 'Tipología APTO 06, apartaestudio de 35.6 m².',
    features: ['APTO 06', '1 Alcoba', '1 Baño', 'Valor base por m²: $7.500.000'],
    status: 'Consultar disponibilidad',
  },
  {
    id: 'tipo-07', unit: '07', name: 'APTO 07 · 35.8 m²', area: '35.8', bedrooms: '1', bathrooms: '1',
    images: typologyImages('33', 4),
    description: 'Tipología APTO 07, apartaestudio de 35.8 m².',
    features: ['APTO 07', '1 Alcoba', '1 Baño', 'Valor base por m²: $7.500.000'],
    status: 'Consultar disponibilidad',
  },
  {
    id: 'tipo-08', unit: '08', name: 'APTO 08 · 33.75 m²', area: '33.75', bedrooms: '1', bathrooms: '1',
    images: typologyImages('33', 4),
    description: 'Tipología APTO 08 de 33.75 m². Se mantiene separada de APTO 10 aunque comparta el mismo metraje.',
    features: ['APTO 08', '1 Alcoba', '1 Baño', 'Valor base por m²: $7.500.000'],
    status: 'Consultar disponibilidad',
  },
  {
    id: 'tipo-09', unit: '09', name: 'APTO 09 · 33.05 m²', area: '33.05', bedrooms: '1', bathrooms: '1',
    images: typologyImages('33', 4),
    description: 'Tipología APTO 09, apartaestudio de 33.05 m².',
    features: ['APTO 09', '1 Alcoba', '1 Baño', 'Valor base por m²: $7.500.000'],
    status: 'Consultar disponibilidad',
  },
  {
    id: 'tipo-10', unit: '10', name: 'APTO 10 · 33.75 m²', area: '33.75', bedrooms: '1', bathrooms: '1',
    images: typologyImages('33', 4),
    description: 'Tipología APTO 10 de 33.75 m². Se mantiene separada de APTO 08 por su posición y configuración dentro del nivel.',
    features: ['APTO 10', '1 Alcoba', '1 Baño', 'Valor base por m²: $7.500.000'],
    status: 'Consultar disponibilidad',
  },
]

export default function Tipologias() {
  const { config } = useSiteConfig()
  const tipoConfig = config?.tipologias
  const commercialPricing = config?.commercialPricing
  const [inventory, setInventory] = useState<Array<{ name: string; area: number; status: string; floor?: number }>>([])

  useEffect(() => {
    let cancelled = false
    fetch('/api/apartments', { cache: 'no-store' })
      .then((res) => res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`)))
      .then((data) => {
        if (!cancelled) setInventory(Array.isArray(data.apartments) ? data.apartments : [])
      })
      .catch(() => {
        if (!cancelled) setInventory([])
      })
    return () => { cancelled = true }
  }, [])

  const label = tipoConfig?.label || 'Tipologías'
  const title = tipoConfig?.title || 'Comparar Residencias'
  const configuredItems = (tipoConfig?.items || []) as Array<Partial<Typology> & { image?: string }>
  const typologies: Typology[] = defaultTypologies.map((base, index) => {
    const configured = configuredItems.find(item => item.id === base.id) || {}
    const images = Array.isArray(configured.images) && configured.images.length > 0
      ? configured.images
      : typeof configured.image === 'string' && configured.image.trim()
        ? [configured.image.trim(), ...base.images.slice(1)]
        : base.images

    const canonicalInventory = inventory.filter((apartment) => apartment.floor !== undefined && apartment.floor >= 5 && apartment.floor <= 16)
    const unitName = `apto ${base.unit}`.toLowerCase()
    const matchingInventory = canonicalInventory.filter((apartment) => apartment.name.trim().toLowerCase() === unitName)
    const availableCount = matchingInventory.filter((apartment) => apartment.status === 'available').length
    const reservedCount = matchingInventory.filter((apartment) => apartment.status === 'reserved').length
    const inventoryStatus = matchingInventory.length === 0
      ? undefined
      : availableCount > 0
        ? 'Disponible'
        : reservedCount > 0
          ? 'Reservado'
          : 'Agotado'

    const unitNumber = Number(base.unit)
    const rate = unitNumber <= 4
      ? Number(commercialPricing?.apartmentM2 || 7_000_000)
      : Number(commercialPricing?.studioM2 || 7_500_000)
    const configuredFeatures = Array.isArray(configured.features) ? configured.features : base.features
    const features = [
      ...configuredFeatures.filter((feature) => !String(feature).toLowerCase().includes('valor base por m²')),
      `Valor base por m²: ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(rate)}`,
    ]

    return {
      ...base,
      ...configured,
      id: configured.id || base.id,
      images,
      features,
      status: inventoryStatus || configured.status || base.status,
    }
  })
  const ctaText = tipoConfig?.ctaText || 'Solicitar Información'
  const ctaLink = tipoConfig?.ctaLink || '#contacto'

  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [selected, setSelected] = useState(0)
  const [activeImage, setActiveImage] = useState(0)
  const [viewMode, setViewMode] = useState<'grid' | 'compare'>('grid')

  const current = typologies[selected]
  const selectTypology = (index: number) => {
    setSelected(index)
    setActiveImage(0)
  }

  const previousImage = () => {
    setActiveImage((currentIndex) => (currentIndex - 1 + current.images.length) % current.images.length)
  }

  const nextImage = () => {
    setActiveImage((currentIndex) => (currentIndex + 1) % current.images.length)
  }

  return (
    <section id="tipologias" ref={ref} className="relative bg-[#111111] py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="mb-4 text-[10px] uppercase tracking-[0.5em] text-[#8B6B4B]"
          >
            {label}
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, delay: 0.2 }}
            className="font-[family-name:var(--font-cormorant)] text-3xl font-light text-[#F5F1EA] md:text-5xl"
          >
            {title}
          </motion.h2>
          <motion.div
            initial={{ width: 0 }}
            animate={isInView ? { width: 60 } : {}}
            transition={{ duration: 1, delay: 0.5 }}
            className="mx-auto mt-6 h-px bg-[#8B6B4B]"
          />
        </div>

        <div className="mb-12 flex justify-center">
          <div className="inline-flex border border-[#D8D1C8]/20">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={[
                'px-6 py-2 text-[10px] uppercase tracking-[0.2em] transition-all duration-300',
                viewMode === 'grid' ? 'bg-[#8B6B4B] text-[#F5F1EA]' : 'text-[#D8D1C8]/60 hover:text-[#F5F1EA]',
              ].join(' ')}
            >
              Galería
            </button>
            <button
              type="button"
              onClick={() => setViewMode('compare')}
              className={[
                'px-6 py-2 text-[10px] uppercase tracking-[0.2em] transition-all duration-300',
                viewMode === 'compare' ? 'bg-[#8B6B4B] text-[#F5F1EA]' : 'text-[#D8D1C8]/60 hover:text-[#F5F1EA]',
              ].join(' ')}
            >
              Comparar
            </button>
          </div>
        </div>

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {typologies.map((typo, i) => (
              <motion.button
                type="button"
                key={typo.id}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.6 + i * 0.1 }}
                className="group cursor-pointer text-left"
                onClick={() => {
                  selectTypology(i)
                  setViewMode('compare')
                }}
              >
                <div className="relative mb-5 overflow-hidden bg-[#0A0A0A]">
                  <img
                    src={typo.images[0]}
                    alt={typo.name + ' — vista principal'}
                    className="h-64 w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-[#111111]/25 transition-colors duration-500 group-hover:bg-[#111111]/5" />
                  <div className="absolute right-4 top-4">
                    <span
                      className={[
                        'px-3 py-1 text-[9px] uppercase tracking-[0.15em]',
                        typo.status === 'Disponible' ? 'bg-[#4B5646] text-[#F5F1EA]' : 'bg-[#8B6B4B] text-[#F5F1EA]',
                      ].join(' ')}
                    >
                      {typo.status}
                    </span>
                  </div>
                  <div className="absolute bottom-4 left-4 bg-[#111111]/80 px-3 py-1 text-[9px] uppercase tracking-[0.15em] text-[#F5F1EA]/80">
                    {typo.images.length} vistas
                  </div>
                </div>
                <div className="mb-2 flex items-baseline justify-between">
                  <h3 className="font-[family-name:var(--font-cormorant)] text-xl text-[#F5F1EA] transition-colors group-hover:text-[#8B6B4B]">
                    {typo.name}
                  </h3>
                  <span className="font-[family-name:var(--font-cormorant)] text-2xl text-[#8B6B4B]">
                    {typo.area}
                  </span>
                </div>
                <p className="text-[11px] text-[#D8D1C8]/50">
                  {typo.area} m² · {typo.bedrooms} Hab · {typo.bathrooms} {Number(typo.bathrooms) === 1 ? 'Baño' : 'Baños'}
                </p>
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div className="flex gap-2 overflow-x-auto lg:col-span-1 lg:flex-col lg:overflow-x-visible">
              {typologies.map((typo, i) => (
                <button
                  type="button"
                  key={typo.id}
                  onClick={() => selectTypology(i)}
                  className={[
                    'min-w-[120px] border p-3 text-left transition-all duration-300 lg:min-w-0',
                    selected === i
                      ? 'border-[#8B6B4B] bg-[#8B6B4B]/10'
                      : 'border-[#D8D1C8]/10 hover:border-[#8B6B4B]/30',
                  ].join(' ')}
                >
                  <p
                    className={[
                      'text-[10px] uppercase tracking-[0.1em]',
                      selected === i ? 'text-[#8B6B4B]' : 'text-[#D8D1C8]/40',
                    ].join(' ')}
                  >
                    {typo.name}
                  </p>
                  <p
                    className={[
                      'mt-1 font-[family-name:var(--font-cormorant)] text-lg',
                      selected === i ? 'text-[#F5F1EA]' : 'text-[#D8D1C8]/40',
                    ].join(' ')}
                  >
                    {typo.images.length} vistas
                  </p>
                </button>
              ))}
            </div>

            <div className="lg:col-span-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selected}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4 }}
                  className="grid grid-cols-1 gap-8 md:grid-cols-2"
                >
                  <div>
                    <div className="relative h-[350px] overflow-hidden bg-[#0A0A0A] md:h-[400px]">
                      <img
                        src={current.images[activeImage]}
                        alt={current.name + ' — vista ' + (activeImage + 1)}
                        className="h-full w-full object-cover"
                      />
                      {current.images.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={previousImage}
                            aria-label="Imagen anterior"
                            className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-white/25 bg-[#111111]/60 text-xl text-[#F5F1EA] backdrop-blur-sm transition-colors hover:border-[#8B6B4B]"
                          >
                            ‹
                          </button>
                          <button
                            type="button"
                            onClick={nextImage}
                            aria-label="Imagen siguiente"
                            className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-white/25 bg-[#111111]/60 text-xl text-[#F5F1EA] backdrop-blur-sm transition-colors hover:border-[#8B6B4B]"
                          >
                            ›
                          </button>
                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#111111]/75 px-3 py-1 text-[9px] uppercase tracking-[0.15em] text-[#F5F1EA]/80">
                            Vista {activeImage + 1} / {current.images.length}
                          </div>
                        </>
                      )}
                    </div>
                    {current.images.length > 1 && (
                      <div className="mt-3 grid grid-cols-4 gap-2 md:grid-cols-6">
                        {current.images.map((src, index) => (
                          <button
                            type="button"
                            key={src}
                            onClick={() => setActiveImage(index)}
                            aria-label={'Ver vista ' + (index + 1) + ' de ' + current.name}
                            className={[
                              'relative aspect-[4/3] overflow-hidden border-2',
                              activeImage === index ? 'border-[#8B6B4B]' : 'border-transparent opacity-55 hover:opacity-90',
                            ].join(' ')}
                          >
                            <img src={src} alt="" className="h-full w-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col justify-center">
                    <p className="mb-2 text-[10px] uppercase tracking-[0.5em] text-[#8B6B4B]">
                      {current.status}
                    </p>
                    <h3 className="mb-2 font-[family-name:var(--font-cormorant)] text-3xl font-light text-[#F5F1EA] md:text-4xl">
                      {current.name}
                    </h3>
                    <p className="mb-6 font-[family-name:var(--font-cormorant)] text-2xl text-[#8B6B4B]">
                      {current.area} m²
                    </p>

                    <div className="mb-6 grid grid-cols-3 gap-4">
                      <div className="border border-[#D8D1C8]/20 p-3 text-center">
                        <p className="font-[family-name:var(--font-cormorant)] text-2xl text-[#F5F1EA]">{current.bedrooms}</p>
                        <p className="mt-1 text-[9px] uppercase tracking-[0.1em] text-[#D8D1C8]/50">Habitaciones</p>
                      </div>
                      <div className="border border-[#D8D1C8]/20 p-3 text-center">
                        <p className="font-[family-name:var(--font-cormorant)] text-2xl text-[#F5F1EA]">{current.bathrooms}</p>
                        <p className="mt-1 text-[9px] uppercase tracking-[0.1em] text-[#D8D1C8]/50">Baños</p>
                      </div>
                      <div className="border border-[#D8D1C8]/20 p-3 text-center">
                        <p className="font-[family-name:var(--font-cormorant)] text-2xl text-[#F5F1EA]">{current.area}</p>
                        <p className="mt-1 text-[9px] uppercase tracking-[0.1em] text-[#D8D1C8]/50">m²</p>
                      </div>
                    </div>

                    <p className="mb-6 font-[family-name:var(--font-inter)] text-sm leading-relaxed text-[#D8D1C8]/60">
                      {current.description}
                    </p>

                    <div className="mb-8 flex flex-wrap gap-2">
                      {current.features.map((feature) => (
                        <span key={feature} className="border border-[#8B6B4B]/30 px-3 py-1.5 text-[10px] uppercase tracking-[0.1em] text-[#8B6B4B]">
                          {feature}
                        </span>
                      ))}
                    </div>

                    <a
                      href={ctaLink}
                      className="inline-block w-fit bg-[#8B6B4B] px-8 py-3.5 text-[11px] uppercase tracking-[0.2em] text-[#F5F1EA] transition-all duration-300 hover:bg-[#7A5C3E]"
                    >
                      {ctaText}
                    </a>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
