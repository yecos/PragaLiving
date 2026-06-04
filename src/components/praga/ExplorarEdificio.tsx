'use client'

import { useRef, useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'

const buildingLevels = [
  {
    id: 'cobertura',
    name: 'Cubierta',
    type: 'Terraza · Jardín superior',
    icon: '⌂',
    description: 'Espacio de cubierta con terraza panorámica y jardín elevado que ofrece vistas 360° de la ciudad. Un oasis en la altura diseñado para el descanso y la contemplación del paisaje urbano.',
    features: ['Vista 360°', 'Jardín elevado', 'Zona descanso', 'Iluminación ambiental'],
    render: '/images/renders/hero-day.png',
  },
  {
    id: 'residencial-12',
    name: 'Pisos 9–12',
    type: 'Residencial Premium',
    icon: '▦',
    description: 'Los niveles más exclusivos de la torre residencial con unidades de mayor área, vistas panorámicas privilegiadas y acabados de la más alta categoría. Residencias diseñadas para quienes buscan lo extraordinario.',
    features: ['Penthouses', 'Vistas privilegiadas', 'Acabados exclusivos', 'Terrazas privadas'],
    render: '/images/renders/apto-97.png',
  },
  {
    id: 'residencial-8',
    name: 'Pisos 5–8',
    type: 'Residencial',
    icon: '▦',
    description: 'Niveles residenciales intermedios con orientación óptima para la luz natural y ventilación cruzada. Tipologías de 2 y 3 habitaciones con balcones privados con vegetación.',
    features: ['2-3 habitaciones', 'Balcones jardín', 'Ventilación cruzada', 'Vistas intermedias'],
    render: '/images/renders/apto-74.png',
  },
  {
    id: 'residencial-4',
    name: 'Pisos 1–4',
    type: 'Residencial',
    icon: '▦',
    description: 'Primeros niveles residenciales con acceso directo al atrio y la zona social. Studios y apartamentos de 2 habitaciones con vista al atrio interior y la vegetación central.',
    features: ['Studios y 2 habitaciones', 'Vista al atrio', 'Acceso directo amenidades', 'Precios accesibles'],
    render: '/images/renders/apto-57.png',
  },
  {
    id: 'social',
    name: 'Zona Social',
    type: 'Coworking · Gimnasio · Salón Social · Ludoteca · Wellness',
    icon: '◇',
    description: 'El corazón social del edificio. Un nivel completo dedicado al bienestar, la productividad y la convivencia. Todas las amenidades conectadas visualmente con el atrio central.',
    features: ['Coworking', 'Gimnasio', 'Wellness completo', 'Ludoteca'],
    render: '/images/renders/coworking.png',
  },
  {
    id: 'comercial',
    name: 'Nivel Comercial',
    type: 'Locales · Servicios',
    icon: '□',
    description: 'Nivel de locales comerciales y servicios en la base del edificio, diseñados para complementar la experiencia residencial con conveniencia y vitalidad urbana.',
    features: ['Locales comerciales', 'Café', 'Servicios', 'Acceso independiente'],
    render: '/images/renders/lobby.png',
  },
  {
    id: 'acceso',
    name: 'Nivel Acceso',
    type: 'Lobby · Recepción · Comercio',
    icon: '◊',
    description: 'El primer contacto con PRAGA Living. Un lobby de doble altura que conecta directamente con el atrio, creando una experiencia de llegada que marca la diferencia desde el primer paso.',
    features: ['Lobby doble altura', 'Recepción 24h', 'Acceso al atrio', 'Seguridad'],
    render: '/images/renders/lobby.png',
  },
  {
    id: 'sotanos',
    name: 'Sótanos 1–3',
    type: 'Parqueaderos · Cuarto técnico · Visitantes',
    icon: '▬',
    description: 'Tres niveles de sótano con parqueaderos privativos y de visitantes, cuarto técnico y bodegas. Acceso controlado y circulación vehicular eficiente.',
    features: ['Parqueaderos privativos', 'Visitantes', 'Bodegas', 'Cuarto técnico'],
    render: '/images/renders/exterior-dusk.png',
  },
]

const viewModes = [
  { id: 'exploded', name: 'Vista Explotada', icon: '⬒' },
  { id: 'corte', name: 'Corte Vertical', icon: '⬡' },
  { id: 'fachada', name: 'Fachada', icon: '⬢' },
]

export default function ExplorarEdificio() {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [selectedLevel, setSelectedLevel] = useState(4) // zona social by default
  const [viewMode, setViewMode] = useState('exploded')
  const [hoveredLevel, setHoveredLevel] = useState<number | null>(null)

  return (
    <section id="edificio" ref={ref} className="relative py-24 md:py-32 bg-[#0A0A0A] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-[10px] tracking-[0.5em] uppercase text-[#8B6B4B] mb-4"
          >
            Explorar Edificio
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, delay: 0.2 }}
            className="font-[family-name:var(--font-cormorant)] text-3xl md:text-5xl text-[#F5F1EA] font-light"
          >
            Digital Twin
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="font-[family-name:var(--font-inter)] text-sm text-[#D8D1C8]/50 mt-4 max-w-xl mx-auto"
          >
            Navega cada nivel del edificio. Explora la distribución, las amenidades y las residencias.
          </motion.p>
          <motion.div
            initial={{ width: 0 }}
            animate={isInView ? { width: 60 } : {}}
            transition={{ duration: 1, delay: 0.5 }}
            className="h-[1px] bg-[#8B6B4B] mx-auto mt-6"
          />
        </div>

        {/* View mode selector */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex border border-[#D8D1C8]/10">
            {viewModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id)}
                className={`px-5 py-2.5 text-[10px] tracking-[0.15em] uppercase transition-all duration-300 ${
                  viewMode === mode.id
                    ? 'bg-[#8B6B4B] text-[#F5F1EA]'
                    : 'text-[#D8D1C8]/40 hover:text-[#D8D1C8]/60'
                }`}
              >
                {mode.name}
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Building visualization - left side */}
          <div className="lg:col-span-5">
            <div className="relative bg-[#111111] p-6 min-h-[600px]">
              {/* Exploded view building */}
              <div className="relative h-full flex flex-col-reverse gap-1 justify-center items-center py-4">
                {buildingLevels.map((level, i) => {
                  const isSelected = selectedLevel === i
                  const isHovered = hoveredLevel === i
                  // Width varies by floor type
                  const widthPct = level.id.startsWith('sotanos') ? 70 
                    : level.id === 'acceso' || level.id === 'comercial' ? 85
                    : level.id === 'social' ? 80
                    : level.id === 'cobertura' ? 60
                    : 75

                  return (
                    <motion.button
                      key={level.id}
                      initial={{ opacity: 0, scaleX: 0 }}
                      animate={isInView ? { opacity: 1, scaleX: 1 } : {}}
                      transition={{ duration: 0.5, delay: 0.6 + i * 0.08 }}
                      onClick={() => setSelectedLevel(i)}
                      onMouseEnter={() => setHoveredLevel(i)}
                      onMouseLeave={() => setHoveredLevel(null)}
                      className={`relative transition-all duration-500 border ${
                        isSelected
                          ? 'border-[#8B6B4B] bg-[#8B6B4B]/20'
                          : isHovered
                          ? 'border-[#8B6B4B]/50 bg-[#8B6B4B]/10'
                          : 'border-[#D8D1C8]/10 bg-[#1A1A1A] hover:border-[#D8D1C8]/20'
                      }`}
                      style={{
                        width: `${widthPct}%`,
                        height: viewMode === 'exploded' ? 'auto' : 'auto',
                        padding: '8px 12px',
                        transform: viewMode === 'exploded' 
                          ? `translateY(${isSelected ? -4 : 0}px)` 
                          : 'none',
                        gap: viewMode === 'exploded' ? '4px' : '0',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[9px] tracking-[0.1em] uppercase transition-colors ${
                          isSelected ? 'text-[#8B6B4B]' : 'text-[#D8D1C8]/30'
                        }`}>
                          {level.name}
                        </span>
                        <span className={`text-[10px] transition-colors ${
                          isSelected ? 'text-[#8B6B4B]' : 'text-[#D8D1C8]/15'
                        }`}>
                          {level.icon}
                        </span>
                      </div>
                      {isSelected && (
                        <motion.div
                          layoutId="building-indicator"
                          className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#8B6B4B]"
                        />
                      )}
                    </motion.button>
                  )
                })}
              </div>

              {/* Building label */}
              <div className="absolute top-4 left-6">
                <p className="text-[9px] tracking-[0.3em] uppercase text-[#8B6B4B]/50">PRAGA Living</p>
                <p className="text-[8px] tracking-[0.2em] text-[#D8D1C8]/20 mt-0.5">{viewModes.find(v => v.id === viewMode)?.name}</p>
              </div>
            </div>
          </div>

          {/* Level detail - right side */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedLevel}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {/* Level render */}
                <div className="relative h-[300px] md:h-[350px] overflow-hidden">
                  <img
                    src={buildingLevels[selectedLevel].render}
                    alt={buildingLevels[selectedLevel].name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <span className="text-[9px] tracking-[0.2em] uppercase text-[#8B6B4B] bg-[#111111]/80 px-2 py-1">
                      {buildingLevels[selectedLevel].type.split('·')[0].trim()}
                    </span>
                  </div>
                </div>

                {/* Level info */}
                <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl text-[#8B6B4B]/30">{buildingLevels[selectedLevel].icon}</span>
                    <div>
                      <h3 className="font-[family-name:var(--font-cormorant)] text-2xl text-[#F5F1EA]">
                        {buildingLevels[selectedLevel].name}
                      </h3>
                      <p className="text-[9px] tracking-[0.15em] uppercase text-[#8B6B4B]">
                        {buildingLevels[selectedLevel].type}
                      </p>
                    </div>
                  </div>

                  <div className="h-[1px] bg-[#8B6B4B]/20 my-4" />

                  <p className="font-[family-name:var(--font-inter)] text-sm text-[#D8D1C8]/50 leading-relaxed mb-6">
                    {buildingLevels[selectedLevel].description}
                  </p>

                  {/* Features */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {buildingLevels[selectedLevel].features.map((feat, i) => (
                      <span key={i} className="text-[9px] tracking-[0.1em] uppercase border border-[#8B6B4B]/20 text-[#8B6B4B] px-3 py-1.5">
                        {feat}
                      </span>
                    ))}
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-3">
                    <a href="#recorridos" className="text-[10px] tracking-[0.15em] uppercase bg-[#8B6B4B] text-[#F5F1EA] px-5 py-2.5 hover:bg-[#7A5C3E] transition-colors">
                      Tour 360°
                    </a>
                    <a href="#contacto" className="text-[10px] tracking-[0.15em] uppercase border border-[#8B6B4B]/30 text-[#8B6B4B] px-5 py-2.5 hover:bg-[#8B6B4B]/10 transition-colors">
                      Contactar
                    </a>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 1 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-12"
        >
          {[
            { label: 'Sótanos', value: '3' },
            { label: 'Nivel Acceso', value: '1' },
            { label: 'Zona Social', value: '1' },
            { label: 'Pisos Residenciales', value: '12' },
            { label: 'Total Niveles', value: '18' },
          ].map((stat, i) => (
            <div key={i} className="text-center p-4 border border-[#D8D1C8]/5">
              <p className="font-[family-name:var(--font-cormorant)] text-3xl text-[#8B6B4B]">{stat.value}</p>
              <p className="text-[9px] tracking-[0.15em] uppercase text-[#D8D1C8]/30 mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
