'use client'

import { useRef, useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'

const typologies = [
  {
    id: 'tipo-a',
    name: 'Tipo A',
    area: '75',
    bedrooms: '3',
    bathrooms: '2',
    image: '/images/renders/apto-97.png',
    description: 'Residencia espaciosa de tres habitaciones con dos baños completos. Suite principal con baño privado, dos habitaciones secundarias, sala-comedor abierta al balcón con vegetación, cocina semi-integrada y zona de ropas. Unidades esquineras con doble orientación y ventilación cruzada natural.',
    features: ['3 Habitaciones', 'Suite principal', '2 Baños completos', 'Balcón con vegetación', 'Cocina semi-integrada', 'Doble orientación'],
    status: 'Disponible',
  },
  {
    id: 'tipo-b',
    name: 'Tipo B',
    area: '48',
    bedrooms: '2',
    bathrooms: '1',
    image: '/images/renders/apto-57.png',
    description: 'Diseño compacto de dos habitaciones optimizado para máxima funcionalidad. Sala-comedor con balcón, cocina integrada y habitación principal con ventilación cruzada. La eficiencia del espacio no sacrifica la calidad de vida ni los acabados premium.',
    features: ['2 Habitaciones', 'Balcón', 'Cocina integrada', 'Baño completo', 'Ventilación cruzada', 'Acabados premium'],
    status: 'Disponible',
  },
  {
    id: 'tipo-a-premium',
    name: 'Tipo A Premium',
    area: '78',
    bedrooms: '3',
    bathrooms: '2',
    image: '/images/renders/apto-74.png',
    description: 'La mejor versión del Tipo A en los pisos más altos del edificio. Tres habitaciones con vistas privilegiadas hacia el Valle de Aburrá, acabados de nivel superior con piso porcelánico, grifería de diseño y balcón amplio con jardín vertical. La altura marca la diferencia.',
    features: ['3 Habitaciones', 'Vista Valle de Aburrá', 'Piso porcelánico', 'Balcón jardín vertical', 'Grifería premium', 'Acabados superiores'],
    status: 'Últimas unidades',
  },
]

export default function Tipologias() {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [selected, setSelected] = useState(0)
  const [viewMode, setViewMode] = useState<'grid' | 'compare'>('grid')

  return (
    <section id="tipologias" ref={ref} className="relative py-24 md:py-32 bg-[#111111]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-[10px] tracking-[0.5em] uppercase text-[#8B6B4B] mb-4"
          >
            Tipologías
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, delay: 0.2 }}
            className="font-[family-name:var(--font-cormorant)] text-3xl md:text-5xl text-[#F5F1EA] font-light"
          >
            Comparar Residencias
          </motion.h2>
          <motion.div
            initial={{ width: 0 }}
            animate={isInView ? { width: 60 } : {}}
            transition={{ duration: 1, delay: 0.5 }}
            className="h-[1px] bg-[#8B6B4B] mx-auto mt-6"
          />
        </div>

        {/* View toggle */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex border border-[#D8D1C8]/20">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-6 py-2 text-[10px] tracking-[0.2em] uppercase transition-all duration-300 ${
                viewMode === 'grid' ? 'bg-[#8B6B4B] text-[#F5F1EA]' : 'text-[#D8D1C8]/60 hover:text-[#F5F1EA]'
              }`}
            >
              Galería
            </button>
            <button
              onClick={() => setViewMode('compare')}
              className={`px-6 py-2 text-[10px] tracking-[0.2em] uppercase transition-all duration-300 ${
                viewMode === 'compare' ? 'bg-[#8B6B4B] text-[#F5F1EA]' : 'text-[#D8D1C8]/60 hover:text-[#F5F1EA]'
              }`}
            >
              Comparar
            </button>
          </div>
        </div>

        {viewMode === 'grid' ? (
          /* Grid view */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {typologies.map((typo, i) => (
              <motion.div
                key={typo.id}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.6 + i * 0.1 }}
                className="group cursor-pointer"
                onClick={() => {
                  setSelected(i)
                  setViewMode('compare')
                }}
              >
                <div className="relative overflow-hidden mb-5">
                  <img
                    src={typo.image}
                    alt={typo.name}
                    className="w-full h-64 object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-[#111111]/30 group-hover:bg-[#111111]/10 transition-colors duration-500" />
                  <div className="absolute top-4 right-4">
                    <span className={`text-[9px] tracking-[0.15em] uppercase px-3 py-1 ${
                      typo.status === 'Disponible' ? 'bg-[#4B5646] text-[#F5F1EA]' : 'bg-[#8B6B4B] text-[#F5F1EA]'
                    }`}>
                      {typo.status}
                    </span>
                  </div>
                </div>
                <div className="flex items-baseline justify-between mb-2">
                  <h3 className="font-[family-name:var(--font-cormorant)] text-xl text-[#F5F1EA] group-hover:text-[#8B6B4B] transition-colors">
                    {typo.name}
                  </h3>
                  <span className="font-[family-name:var(--font-cormorant)] text-2xl text-[#8B6B4B]">
                    {typo.area}
                  </span>
                </div>
                <p className="text-[11px] text-[#D8D1C8]/50">{typo.area} m² · {typo.bedrooms} Hab · {typo.bathrooms} Baños</p>
              </motion.div>
            ))}
          </div>
        ) : (
          /* Compare view */
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Selector column */}
            <div className="lg:col-span-1 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible">
              {typologies.map((typo, i) => (
                <button
                  key={typo.id}
                  onClick={() => setSelected(i)}
                  className={`text-left p-3 min-w-[120px] lg:min-w-0 transition-all duration-300 border ${
                    selected === i
                      ? 'border-[#8B6B4B] bg-[#8B6B4B]/10'
                      : 'border-[#D8D1C8]/10 hover:border-[#8B6B4B]/30'
                  }`}
                >
                  <p className={`text-[10px] tracking-[0.1em] uppercase ${
                    selected === i ? 'text-[#8B6B4B]' : 'text-[#D8D1C8]/40'
                  }`}>
                    {typo.name}
                  </p>
                  <p className={`font-[family-name:var(--font-cormorant)] text-lg mt-1 ${
                    selected === i ? 'text-[#F5F1EA]' : 'text-[#D8D1C8]/40'
                  }`}>
                    {typo.area} m²
                  </p>
                </button>
              ))}
            </div>

            {/* Detail view */}
            <div className="lg:col-span-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selected}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-8"
                >
                  <div className="relative overflow-hidden h-[350px] md:h-[400px]">
                    <img
                      src={typologies[selected].image}
                      alt={typologies[selected].name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col justify-center">
                    <p className="text-[10px] tracking-[0.5em] uppercase text-[#8B6B4B] mb-2">
                      {typologies[selected].status}
                    </p>
                    <h3 className="font-[family-name:var(--font-cormorant)] text-3xl md:text-4xl text-[#F5F1EA] mb-2">
                      {typologies[selected].name}
                    </h3>
                    <p className="font-[family-name:var(--font-cormorant)] text-2xl text-[#8B6B4B] mb-6">
                      {typologies[selected].area} m²
                    </p>

                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="border border-[#D8D1C8]/20 p-3 text-center">
                        <p className="font-[family-name:var(--font-cormorant)] text-2xl text-[#F5F1EA]">{typologies[selected].bedrooms}</p>
                        <p className="text-[9px] tracking-[0.1em] uppercase text-[#D8D1C8]/50 mt-1">Habitaciones</p>
                      </div>
                      <div className="border border-[#D8D1C8]/20 p-3 text-center">
                        <p className="font-[family-name:var(--font-cormorant)] text-2xl text-[#F5F1EA]">{typologies[selected].bathrooms}</p>
                        <p className="text-[9px] tracking-[0.1em] uppercase text-[#D8D1C8]/50 mt-1">Baños</p>
                      </div>
                      <div className="border border-[#D8D1C8]/20 p-3 text-center">
                        <p className="font-[family-name:var(--font-cormorant)] text-2xl text-[#F5F1EA]">{typologies[selected].area}</p>
                        <p className="text-[9px] tracking-[0.1em] uppercase text-[#D8D1C8]/50 mt-1">m²</p>
                      </div>
                    </div>

                    <p className="font-[family-name:var(--font-inter)] text-sm text-[#D8D1C8]/60 leading-relaxed mb-6">
                      {typologies[selected].description}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-8">
                      {typologies[selected].features.map((f, i) => (
                        <span key={i} className="text-[10px] tracking-[0.1em] uppercase border border-[#8B6B4B]/30 text-[#8B6B4B] px-3 py-1.5">
                          {f}
                        </span>
                      ))}
                    </div>

                    <a
                      href="#contacto"
                      className="inline-block text-[11px] tracking-[0.2em] uppercase bg-[#8B6B4B] text-[#F5F1EA] px-8 py-3.5 hover:bg-[#7A5C3E] transition-all duration-300 w-fit"
                    >
                      Solicitar Información
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
