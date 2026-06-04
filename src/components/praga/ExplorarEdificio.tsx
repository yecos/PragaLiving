'use client'

import { useRef, useState, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { motion, useInView, AnimatePresence } from 'framer-motion'

/* ─── Dynamic import for Three.js (SSR incompatible) ─── */
const BuildingScene = dynamic(() => import('./BuildingScene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#0A0A0A]">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#8B6B4B] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-[10px] tracking-[0.3em] uppercase text-[#8B6B4B]/50">Cargando modelo 3D</p>
      </div>
    </div>
  ),
})

/* ─── Building Level Data ─── */
const buildingLevels = [
  {
    id: 'cobertura',
    name: 'Cubierta',
    type: 'Terraza · Jardín Elevado',
    icon: '⌂',
    description:
      'Terraza panorámica en la cima del edificio con jardín elevado, zona de descanso y vistas 360° de Caldas. Un oasis en la altura que conecta con el cielo y el paisaje antioqueño.',
    features: ['Vista 360°', 'Jardín elevado', 'Zona lounge', 'Iluminación ambiental'],
    render: '/images/renders/hero-day.jpg',
  },
  {
    id: 'residencial-12',
    name: 'Pisos 9–12',
    type: 'Residencial Premium · 2 Alcobas',
    icon: '▦',
    description:
      'Los niveles más exclusivos con apartamentos de 2 y 3 alcobas con vestier, baños completos, sala-comedor con balcón y cocina integrada. Vistas privilegiadas hacia el Valle de Aburrá y la Autopista Sur. 4 apartamentos por piso.',
    features: ['3 Alcobas Vestier', 'Balcón jardín', '2 Baños', '4 Aptos/Piso'],
    render: '/images/renders/apto-97.png',
  },
  {
    id: 'residencial-8',
    name: 'Pisos 5–8',
    type: 'Residencial · 1-2 Alcobas',
    icon: '▦',
    description:
      'Niveles intermedios con tipologías de 1 y 2 alcobas, ventilación cruzada a través del patio central y balcones con vegetación. 4 apartamentos por piso organizados en dos alas.',
    features: ['1-2 Alcobas', 'Patio central', 'Ventilación cruzada', '4 Aptos/Piso'],
    render: '/images/renders/apto-74.png',
  },
  {
    id: 'residencial-4',
    name: 'Pisos 1–4',
    type: 'Residencial · 1 Alcoba',
    icon: '▦',
    description:
      'Primeros pisos residenciales con apartamentos tipo de 1 y 2 alcobas (~68-90 m²), acceso directo al atrio y zona social. Distribución eficiente con sala, cocina y baño completo. 4 apartamentos por piso.',
    features: ['1-2 Alcobas', 'Vista al atrio', 'Acceso amenidades', '4 Aptos/Piso'],
    render: '/images/renders/apto-57.png',
  },
  {
    id: 'social',
    name: 'Zona Social',
    type: 'Ludoteca · Gimnasio · Vitality Pool · Salón · Sauna · Turco',
    icon: '◇',
    description:
      'El corazón social del edificio: Ludoteca infantil, gimnasio completo, Vitality Pool, salón social, vestieres, saunas y baño turco. Todo conectado visualmente con el patio central.',
    features: ['Vitality Pool', 'Gimnasio', 'Sauna/Turco', 'Ludoteca'],
    render: '/images/renders/coworking.png',
  },
  {
    id: 'comercial',
    name: 'Nivel Comercial',
    type: 'Locales 9701/9801 · 558.91 m²',
    icon: '□',
    description:
      'Dos locales comerciales de 558.91 m² en la base del edificio, con acceso independiente desde la Calle 133 Sur. Espacios versátiles para café, retail o servicios.',
    features: ['2 Locales', '558.91 m²', 'Acceso independiente', 'Calle 133 Sur'],
    render: '/images/renders/lobby.png',
  },
  {
    id: 'acceso',
    name: '1° Piso / Acceso',
    type: 'Lobby · Recepción · Local 1 (43.17 m²)',
    icon: '◊',
    description:
      'El primer contacto con PRAGA Living. Lobby de doble altura con recepción 24h, local comercial de 43.17 m², bodega y áreas verdes en fachada. Conexión directa al atrio central.',
    features: ['Lobby doble altura', 'Recepción 24h', 'Local 43.17m²', 'Áreas verdes'],
    render: '/images/renders/lobby.png',
  },
  {
    id: 'sotanos',
    name: 'Sótanos 1–3',
    type: 'Parqueaderos · 17 espacios/nivel · Visitantes · Bodegas',
    icon: '▬',
    description:
      'Tres niveles de sótano con parqueaderos para residentes (17 espacios por nivel), visitantes, áreas utilitarias (UTIL 01-05), bodegas y acceso por ascensor y escaleras.',
    features: ['17 parqueaderos/nivel', 'Visitantes', 'Bodegas', 'Cuarto técnico'],
    render: '/images/renders/exterior-dusk.png',
  },
]

/* ─── View Modes ─── */
const viewModes = [
  { id: 'exploded' as const, name: 'Vista Explotada', icon: '⬒' },
  { id: 'corte' as const, name: 'Corte Vertical', icon: '⬡' },
  { id: 'fachada' as const, name: 'Fachada', icon: '⬢' },
]

type ViewMode = 'exploded' | 'corte' | 'fachada'

/* ─── Stats Data ─── */
const stats = [
  { label: 'Sótanos', value: '3' },
  { label: 'Nivel Acceso', value: '1' },
  { label: 'Nivel Comercial', value: '1' },
  { label: 'Zona Social', value: '1' },
  { label: 'Pisos Residenciales', value: '12' },
  { label: 'Total Niveles', value: '18' },
  { label: 'Aptos/Piso', value: '4' },
  { label: 'Total Aptos', value: '48' },
]

/* ─── Loading Fallback for 3D Canvas ─── */
function CanvasLoader() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-[#0A0A0A]">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 border-2 border-[#8B6B4B]/20 rounded-full" />
          <div className="absolute inset-0 border-2 border-transparent border-t-[#8B6B4B] rounded-full animate-spin" />
        </div>
        <p className="text-[10px] tracking-[0.3em] uppercase text-[#8B6B4B]/60">
          Cargando modelo 3D
        </p>
        <p className="text-[8px] tracking-[0.2em] text-[#D8D1C8]/20 mt-2">
          Digital Twin PRAGA
        </p>
      </div>
    </div>
  )
}

/* ─── Main Component ─── */
export default function ExplorarEdificio() {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [selectedLevel, setSelectedLevel] = useState(4) // zona social
  const [viewMode, setViewMode] = useState<ViewMode>('exploded')
  const [hoveredLevel, setHoveredLevel] = useState<number | null>(null)

  const level = buildingLevels[selectedLevel]

  return (
    <section id="edificio" ref={ref} className="relative py-24 md:py-32 bg-[#0A0A0A] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        {/* ─── Header ─── */}
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
            Navega cada nivel del edificio en 3D. Haz clic en cualquier piso para explorar su distribución, amenidades y residencias.
          </motion.p>
          <motion.div
            initial={{ width: 0 }}
            animate={isInView ? { width: 60 } : {}}
            transition={{ duration: 1, delay: 0.5 }}
            className="h-[1px] bg-[#8B6B4B] mx-auto mt-6"
          />
        </div>

        {/* ─── View Mode Selector ─── */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex border border-[#D8D1C8]/10">
            {viewModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id)}
                className={`px-5 py-2.5 text-[10px] tracking-[0.15em] uppercase transition-all duration-300 flex items-center gap-2 ${
                  viewMode === mode.id
                    ? 'bg-[#8B6B4B] text-[#F5F1EA]'
                    : 'text-[#D8D1C8]/40 hover:text-[#D8D1C8]/60 hover:bg-[#8B6B4B]/5'
                }`}
              >
                <span className="text-sm">{mode.icon}</span>
                {mode.name}
              </button>
            ))}
          </div>
        </div>

        {/* ─── Main Content ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 3D Canvas — Left side */}
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 1, delay: 0.6 }}
              className="relative bg-[#050505] border border-[#D8D1C8]/5 h-[500px] md:h-[600px] overflow-hidden"
            >
              <Suspense fallback={<CanvasLoader />}>
                <BuildingScene
                  viewMode={viewMode}
                  selectedLevel={selectedLevel}
                  hoveredLevel={hoveredLevel}
                  onFloorClick={setSelectedLevel}
                  onFloorHover={setHoveredLevel}
                />
              </Suspense>

              {/* Canvas overlay labels */}
              <div className="absolute top-4 left-4 pointer-events-none">
                <p className="text-[9px] tracking-[0.3em] uppercase text-[#8B6B4B]/50">PRAGA Living</p>
                <p className="text-[8px] tracking-[0.2em] text-[#D8D1C8]/20 mt-0.5">
                  {viewModes.find((v) => v.id === viewMode)?.name}
                </p>
              </div>

              {/* Interaction hint */}
              <div className="absolute bottom-4 left-4 pointer-events-none">
                <p className="text-[8px] tracking-[0.15em] text-[#D8D1C8]/20">
                  Arrastra para rotar · Scroll para zoom · Clic para seleccionar
                </p>
              </div>

              {/* Selected floor indicator */}
              <div className="absolute bottom-4 right-4 pointer-events-none">
                <div className="bg-[#111111]/80 border border-[#8B6B4B]/20 px-3 py-1.5">
                  <p className="text-[9px] tracking-[0.15em] uppercase text-[#8B6B4B]">
                    {level.name}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Level Detail Panel — Right side */}
          <div className="lg:col-span-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedLevel}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5 }}
                className="h-full"
              >
                <div className="bg-[#0D0D0D] border border-[#D8D1C8]/5 h-full flex flex-col">
                  {/* Level render image */}
                  <div className="relative h-[200px] md:h-[220px] overflow-hidden">
                    <img
                      src={level.render}
                      alt={level.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/40 to-transparent" />
                    <div className="absolute bottom-4 left-4">
                      <span className="text-[9px] tracking-[0.2em] uppercase text-[#8B6B4B] bg-[#111111]/90 px-2.5 py-1 border border-[#8B6B4B]/20">
                        {level.type.split('·')[0].trim()}
                      </span>
                    </div>
                    {/* Level number badge */}
                    <div className="absolute top-4 right-4">
                      <div className="w-10 h-10 border border-[#8B6B4B]/30 flex items-center justify-center bg-[#111111]/80">
                        <span className="text-[10px] text-[#8B6B4B]">{level.icon}</span>
                      </div>
                    </div>
                  </div>

                  {/* Level info */}
                  <div className="flex-1 p-6 flex flex-col">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="flex-1">
                        <h3 className="font-[family-name:var(--font-cormorant)] text-2xl md:text-3xl text-[#F5F1EA] leading-tight">
                          {level.name}
                        </h3>
                        <p className="text-[9px] tracking-[0.15em] uppercase text-[#8B6B4B] mt-1.5">
                          {level.type}
                        </p>
                      </div>
                    </div>

                    <div className="h-[1px] bg-gradient-to-r from-[#8B6B4B]/30 via-[#8B6B4B]/10 to-transparent mb-4" />

                    <p className="font-[family-name:var(--font-inter)] text-sm text-[#D8D1C8]/50 leading-relaxed mb-6 flex-1">
                      {level.description}
                    </p>

                    {/* Features */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {level.features.map((feat, i) => (
                        <span
                          key={i}
                          className="text-[9px] tracking-[0.1em] uppercase border border-[#8B6B4B]/20 text-[#8B6B4B]/80 px-3 py-1.5 hover:border-[#8B6B4B]/40 transition-colors"
                        >
                          {feat}
                        </span>
                      ))}
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3">
                      <a
                        href="#recorridos"
                        className="text-[10px] tracking-[0.15em] uppercase bg-[#8B6B4B] text-[#F5F1EA] px-6 py-3 hover:bg-[#7A5C3E] transition-colors text-center flex-1"
                      >
                        Tour 360°
                      </a>
                      <a
                        href="#contacto"
                        className="text-[10px] tracking-[0.15em] uppercase border border-[#8B6B4B]/30 text-[#8B6B4B] px-6 py-3 hover:bg-[#8B6B4B]/10 transition-colors text-center flex-1"
                      >
                        Contactar
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ─── Floor Quick Select ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-6"
        >
          <div className="flex flex-wrap justify-center gap-2">
            {buildingLevels.map((lvl, i) => (
              <button
                key={lvl.id}
                onClick={() => setSelectedLevel(i)}
                onMouseEnter={() => setHoveredLevel(i)}
                onMouseLeave={() => setHoveredLevel(null)}
                className={`px-4 py-2 text-[9px] tracking-[0.1em] uppercase transition-all duration-300 border ${
                  selectedLevel === i
                    ? 'border-[#8B6B4B] bg-[#8B6B4B]/20 text-[#8B6B4B]'
                    : hoveredLevel === i
                    ? 'border-[#8B6B4B]/30 bg-[#8B6B4B]/5 text-[#8B6B4B]/70'
                    : 'border-[#D8D1C8]/5 text-[#D8D1C8]/30 hover:border-[#D8D1C8]/10 hover:text-[#D8D1C8]/50'
                }`}
              >
                {lvl.name}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ─── Stats Bar ─── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 1 }}
          className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-px mt-12 bg-[#D8D1C8]/5"
        >
          {stats.map((stat, i) => (
            <div key={i} className="text-center p-5 bg-[#0A0A0A]">
              <p className="font-[family-name:var(--font-cormorant)] text-3xl md:text-4xl text-[#8B6B4B]">
                {stat.value}
              </p>
              <p className="text-[9px] tracking-[0.15em] uppercase text-[#D8D1C8]/25 mt-2">
                {stat.label}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
