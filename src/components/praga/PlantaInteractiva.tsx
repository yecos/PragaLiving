'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence, useMotionValue, useDragControls, PanInfo } from 'framer-motion'

// ═══════════════════════════════════════════════════════════════════
// TYPES — matching floor-plans.json schema
// ═══════════════════════════════════════════════════════════════════

type UnitStatus = 'available' | 'reserved' | 'sold'

interface ApartmentZone {
  id: string
  polygon: number[][]
  name: string
  area: number
  bedrooms: number
  bathrooms: number
  typology: string
  priceRange: string
  status: string
  view: string
}

interface FloorConfig {
  id: string
  name: string
  typeLabel: string
  isResidential: boolean
  image: string
  apartments: ApartmentZone[]
}

interface FloorPlanConfig {
  floors: FloorConfig[]
}

// UnitData for the detail panel (derived from ApartmentZone)
interface UnitData {
  id: string
  name: string
  area: number
  bedrooms: number
  bathrooms: number
  status: UnitStatus
  typology: string
  priceRange: string
  view: string
}

// ═══════════════════════════════════════════════════════════════════
// STATUS COLORS — PRAGA palette
// ═══════════════════════════════════════════════════════════════════

const STATUS_COLORS: Record<UnitStatus, { fill: string; stroke: string }> = {
  available: { fill: '#4B5646', stroke: '#4B5646' },  // Verde Musgo
  reserved: { fill: '#8B6B4B', stroke: '#8B6B4B' },   // Bronce
  sold: { fill: '#D8D1C8', stroke: '#D8D1C8' },        // Gris Piedra
}

const STATUS_LABELS: Record<UnitStatus, string> = {
  available: 'Disponible',
  reserved: 'Reservado',
  sold: 'Vendido',
}

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

function polygonToPointsStr(polygon: number[][]): string {
  return polygon.map(([x, y]) => `${x},${y}`).join(' ')
}

function getPolygonCenter(polygon: number[][]): [number, number] {
  if (polygon.length === 0) return [50, 50]
  const sumX = polygon.reduce((s, p) => s + p[0], 0)
  const sumY = polygon.reduce((s, p) => s + p[1], 0)
  return [sumX / polygon.length, sumY / polygon.length]
}

function apartmentToUnit(apt: ApartmentZone): UnitData {
  return {
    id: apt.id,
    name: apt.name,
    area: apt.area,
    bedrooms: apt.bedrooms,
    bathrooms: apt.bathrooms,
    status: (apt.status as UnitStatus) || 'available',
    typology: apt.typology,
    priceRange: apt.priceRange,
    view: apt.view,
  }
}

// ═══════════════════════════════════════════════════════════════════
// FLOOR SELECTOR
// ═══════════════════════════════════════════════════════════════════

function FloorSelector({
  floors,
  selectedFloor,
  onSelect,
}: {
  floors: FloorConfig[]
  selectedFloor: number
  onSelect: (i: number) => void
}) {
  const progress = selectedFloor / Math.max(floors.length - 1, 1)

  return (
    <div className="bg-[#111111] p-3 md:p-4 relative h-full">
      <p className="text-[9px] tracking-[0.3em] uppercase text-[#8B6B4B] mb-3 text-center font-[family-name:var(--font-inter)]">
        Niveles
      </p>

      {/* Building height indicator */}
      <div className="absolute left-1.5 top-12 bottom-4 w-[2px] bg-[#1A1A1A]">
        <motion.div
          className="absolute left-0 w-[2px] bg-[#8B6B4B]"
          animate={{ top: `${(1 - progress) * 100}%`, height: '8px' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      </div>

      <div className="flex flex-col gap-0.5 overflow-y-auto max-h-[580px] custom-scrollbar pl-3">
        {floors.map((f, i) => (
          <button
            key={f.id}
            onClick={() => onSelect(i)}
            className={`text-left py-2 px-2.5 transition-all duration-300 border-l-2 group ${
              selectedFloor === i
                ? 'border-l-[#8B6B4B] bg-[#8B6B4B]/10'
                : 'border-l-transparent hover:border-l-[#8B6B4B]/30 hover:bg-[#1A1A1A]'
            }`}
          >
            <p className={`text-[10px] tracking-[0.1em] font-[family-name:var(--font-inter)] transition-colors ${
              selectedFloor === i ? 'text-[#8B6B4B]' : 'text-[#D8D1C8]/40 group-hover:text-[#D8D1C8]/60'
            }`}>
              {f.name}
            </p>
            <p className="text-[8px] text-[#D8D1C8]/20 mt-0.5 truncate font-[family-name:var(--font-inter)]">
              {f.typeLabel}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// GLASSMORPHIC DETAIL PANEL — slides from right (desktop) or bottom (mobile)
// ═══════════════════════════════════════════════════════════════════

function GlassDetailPanel({
  unit,
  floor,
  isOpen,
  onClose,
}: {
  unit: UnitData | null
  floor: FloorConfig
  isOpen: boolean
  onClose: () => void
}) {
  const dragY = useMotionValue(0)
  const dragControls = useDragControls()
  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      // If dragged down more than 100px or velocity is high, close the panel
      if (info.offset.y > 100 || info.velocity.y > 500) {
        onClose()
      }
    },
    [onClose]
  )

  // Status styling
  const statusColor = unit
    ? {
        available: 'bg-[#4B5646] text-[#F5F1EA]',
        reserved: 'bg-[#8B6B4B] text-[#F5F1EA]',
        sold: 'bg-[#D8D1C8]/20 text-[#D8D1C8]/50',
      }[unit.status]
    : ''

  const panelContent = unit ? (
    <div className="p-5 md:p-6 overflow-y-auto max-h-full custom-scrollbar">
      {/* Close button */}
      <div className="flex items-center justify-between mb-4">
        <span className={`text-[9px] tracking-[0.15em] uppercase px-2.5 py-1 font-[family-name:var(--font-inter)] ${statusColor}`}>
          {STATUS_LABELS[unit.status]}
        </span>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F5F1EA]/10 transition-colors"
          aria-label="Cerrar panel"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L13 13M1 13L13 1" stroke="#D8D1C8" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Unit name */}
      <h4 className="font-[family-name:var(--font-cormorant)] text-xl text-[#F5F1EA] mb-1">
        {unit.name}
      </h4>
      <p className="text-[10px] text-[#D8D1C8]/40 tracking-[0.1em] uppercase font-[family-name:var(--font-inter)] mb-4">
        {unit.typology}
      </p>

      {/* Area */}
      <p className="font-[family-name:var(--font-cormorant)] text-3xl text-[#8B6B4B] mb-6">
        {unit.area} <span className="text-lg">m²</span>
      </p>

      {/* Details */}
      <div className="space-y-3 mb-6">
        {[
          ['Habitaciones', unit.bedrooms],
          ['Baños', unit.bathrooms],
          ['Piso', floor.name],
          ['Tipología', unit.typology],
          ['Vista', unit.view],
        ].map(([label, value]) => (
          <div key={label as string} className="flex justify-between border-b border-[#D8D1C8]/10 pb-2">
            <span className="text-[10px] text-[#D8D1C8]/40 uppercase tracking-wider font-[family-name:var(--font-inter)]">
              {label}
            </span>
            <span className="text-sm text-[#F5F1EA] font-[family-name:var(--font-inter)]">{value}</span>
          </div>
        ))}
      </div>

      {/* Price range */}
      <div className="mb-6 p-3 border border-[#8B6B4B]/20 bg-[#8B6B4B]/5">
        <p className="text-[9px] text-[#D8D1C8]/40 uppercase tracking-wider font-[family-name:var(--font-inter)] mb-1">
          Rango de precio
        </p>
        <p className="font-[family-name:var(--font-cormorant)] text-lg text-[#8B6B4B]">
          {unit.priceRange}
        </p>
        <p className="text-[8px] text-[#D8D1C8]/25 font-[family-name:var(--font-inter)] mt-1">COP · Aprox.</p>
      </div>

      {/* Action buttons */}
      <div className="space-y-2.5">
        <a
          href="#contacto"
          className="block text-center text-[10px] tracking-[0.2em] uppercase bg-[#8B6B4B] text-[#F5F1EA] py-3 hover:bg-[#7A5C3E] transition-colors font-[family-name:var(--font-inter)]"
        >
          Contactar Asesor
        </a>
        <button className="block w-full text-center text-[10px] tracking-[0.2em] uppercase border border-[#8B6B4B]/30 text-[#8B6B4B] py-3 hover:bg-[#8B6B4B]/10 transition-colors font-[family-name:var(--font-inter)]">
          Ver Recorrido 360°
        </button>
        <button
          onClick={async () => {
            try {
              const res = await fetch(`/api/apartments?floor=${encodeURIComponent(floor.name.replace('Piso ', ''))}`)
              const data = await res.json()
              const dbApt = data.apartments?.find((a: { name: string; area: number }) => a.name === unit.name || Math.abs(a.area - unit.area) < 1)
              if (dbApt) {
                window.open(`/api/ficha?id=${dbApt.id}`, '_blank')
              } else if (data.apartments?.length > 0) {
                window.open(`/api/ficha?id=${data.apartments[0].id}`, '_blank')
              }
            } catch {
              // Silently fail
            }
          }}
          className="block w-full text-center text-[10px] tracking-[0.2em] uppercase border border-[#D8D1C8]/20 text-[#D8D1C8]/50 py-3 hover:border-[#D8D1C8]/40 transition-colors font-[family-name:var(--font-inter)]"
        >
          Descargar Ficha
        </button>
      </div>
    </div>
  ) : null

  return (
    <>
      {/* ═══════ DESKTOP PANEL — slides from right ═══════ */}
      <AnimatePresence>
        {isOpen && unit && (
          <motion.div
            key={`desktop-panel-${unit.id}`}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="hidden md:block absolute top-0 right-0 h-full w-[340px] z-30
              bg-[#111111]/75 backdrop-blur-2xl border-l border-[#8B6B4B]/20
              shadow-[-20px_0_60px_rgba(0,0,0,0.5)]"
          >
            {/* Decorative top accent line */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#8B6B4B]/40 to-transparent" />

            {panelContent}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════ MOBILE PANEL — slides up from bottom ═══════ */}
      <AnimatePresence>
        {isOpen && unit && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              key={`mobile-backdrop-${unit.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 z-40 bg-[#111111]/60 backdrop-blur-sm"
              onClick={onClose}
            />

            {/* Bottom sheet */}
            <motion.div
              key={`mobile-panel-${unit.id}`}
              dragControls={dragControls}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={0.1}
              style={{ y: dragY }}
              onDragEnd={handleDragEnd}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="md:hidden fixed bottom-0 left-0 right-0 z-50
                bg-[#111111]/85 backdrop-blur-2xl border-t border-[#8B6B4B]/20
                rounded-t-2xl shadow-[0_-10px_60px_rgba(0,0,0,0.5)]
                max-h-[80vh] flex flex-col"
            >
              {/* Drag handle */}
              <div
                className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing"
                onPointerDown={(e) => dragControls.start(e)}
              >
                <div className="w-10 h-1 rounded-full bg-[#D8D1C8]/30" />
              </div>

              {/* Decorative accent line */}
              <div className="mx-5 h-[1px] bg-gradient-to-r from-transparent via-[#8B6B4B]/30 to-transparent" />

              {/* Scrollable content */}
              <div className="overflow-y-auto flex-1 custom-scrollbar">
                {panelContent}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════
// LEGEND
// ═══════════════════════════════════════════════════════════════════

function Legend({ floor }: { floor: FloorConfig }) {
  return (
    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
      <div>
        <h3 className="font-[family-name:var(--font-cormorant)] text-xl text-[#F5F1EA]">
          {floor.name}
        </h3>
        <p className="text-[10px] text-[#D8D1C8]/40 tracking-[0.1em] uppercase font-[family-name:var(--font-inter)]">
          {floor.typeLabel}
        </p>
      </div>
      {floor.isResidential && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-[#4B5646] opacity-60" />
            <span className="text-[9px] text-[#D8D1C8]/50 font-[family-name:var(--font-inter)]">Disponible</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-[#8B6B4B] opacity-60" />
            <span className="text-[9px] text-[#D8D1C8]/50 font-[family-name:var(--font-inter)]">Reservado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-[#D8D1C8] opacity-30" />
            <span className="text-[9px] text-[#D8D1C8]/50 font-[family-name:var(--font-inter)]">Vendido</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// FLOOR PLAN DISPLAY — Image + SVG Overlay with PRAGA colors
// ═══════════════════════════════════════════════════════════════════

function FloorPlanDisplay({
  floor,
  units,
  selectedUnit,
  onUnitClick,
}: {
  floor: FloorConfig
  units: UnitData[]
  selectedUnit: number | null
  onUnitClick: (i: number) => void
}) {
  return (
    <div className="relative w-full" style={{ aspectRatio: '16 / 11' }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={floor.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="absolute inset-0"
        >
          {/* Real architectural floor plan image */}
          <Image
            src={floor.image}
            alt={`Planta arquitectónica — ${floor.name}`}
            fill
            className="object-contain"
            sizes="(max-width: 1024px) 100vw, 58vw"
            priority
          />

          {/* SVG overlay with interactive hotspots */}
          {floor.isResidential && floor.apartments.length > 0 && (
            <svg
              viewBox="0 0 100 60"
              preserveAspectRatio="none"
              className="absolute inset-0 w-full h-full"
              style={{ cursor: 'default' }}
            >
              {/* Glow filter definition */}
              <defs>
                <filter id="glow-bronce" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="1" result="blur" />
                  <feFlood floodColor="#8B6B4B" floodOpacity="0.7" result="color" />
                  <feComposite in="color" in2="blur" operator="in" result="shadow" />
                  <feMerge>
                    <feMergeNode in="shadow" />
                    <feMergeNode in="shadow" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {floor.apartments.map((apt, i) => {
                const unit = units[i]
                if (!unit) return null

                const isSelected = selectedUnit === i
                const colors = STATUS_COLORS[unit.status]
                const fillOpacity = unit.status === 'sold'
                  ? (isSelected ? 0.3 : 0.15)
                  : (isSelected ? 0.65 : 0.35)
                const strokeOpacity = unit.status === 'sold'
                  ? (isSelected ? 0.8 : 0.2)
                  : (isSelected ? 1 : 0.7)
                const center = getPolygonCenter(apt.polygon)

                return (
                  <g key={apt.id}>
                    {/* Clickable polygon hotspot */}
                    <motion.polygon
                      points={polygonToPointsStr(apt.polygon)}
                      fill={isSelected ? '#8B6B4B' : colors.fill}
                      fillOpacity={fillOpacity}
                      stroke={isSelected ? '#8B6B4B' : colors.stroke}
                      strokeWidth={isSelected ? 0.8 : 0.4}
                      strokeOpacity={strokeOpacity}
                      filter={isSelected ? 'url(#glow-bronce)' : undefined}
                      onClick={() => onUnitClick(i)}
                      whileHover={{
                        fillOpacity: unit.status === 'sold' ? 0.25 : 0.55,
                        strokeOpacity: unit.status === 'sold' ? 0.4 : 0.9,
                      }}
                      className="cursor-pointer"
                      animate={isSelected ? {
                        strokeOpacity: [1, 0.5, 1],
                      } : {}}
                      transition={isSelected ? {
                        duration: 2, repeat: Infinity, ease: 'easeInOut',
                      } : { duration: 0.2 }}
                    />

                    {/* Unit label */}
                    <g pointerEvents="none" style={{ userSelect: 'none' }}>
                      <text
                        x={center[0]}
                        y={center[1] - 1.5}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#F5F1EA"
                        fontSize="2.2"
                        fontFamily="var(--font-inter)"
                        fontWeight="600"
                        opacity={unit.status === 'sold' ? 0.3 : 0.9}
                      >
                        {unit.name.replace('APTO-', '')}
                      </text>
                      <text
                        x={center[0]}
                        y={center[1] + 0.8}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#8B6B4B"
                        fontSize="2.8"
                        fontFamily="var(--font-cormorant)"
                        fontWeight="700"
                        opacity={unit.status === 'sold' ? 0.25 : 0.95}
                      >
                        {unit.area} m²
                      </text>
                      <text
                        x={center[0]}
                        y={center[1] + 3}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#D8D1C8"
                        fontSize="1.6"
                        fontFamily="var(--font-inter)"
                        opacity={unit.status === 'sold' ? 0.15 : 0.5}
                      >
                        {unit.typology}
                      </text>
                    </g>
                  </g>
                )
              })}
            </svg>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function PlantaInteractiva() {
  const [config, setConfig] = useState<FloorPlanConfig | null>(null)
  const [selectedFloor, setSelectedFloor] = useState(0)
  const [selectedUnit, setSelectedUnit] = useState<number | null>(null)

  // Fetch floor plan config from API
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/floor-plans')
        const data = await res.json()
        setConfig(data)
        // Find first residential floor
        const firstRes = data.floors?.findIndex((f: FloorConfig) => f.isResidential)
        if (firstRes >= 0) setSelectedFloor(firstRes)
      } catch {
        // Silently fail
      }
    }
    fetchConfig()
  }, [])

  const floors = config?.floors ?? []
  const floor = floors[selectedFloor] ?? null
  const units = useMemo(() => {
    if (!floor) return []
    return floor.apartments.map(apartmentToUnit)
  }, [floor])

  const handleFloorSelect = useCallback((i: number) => {
    setSelectedFloor(i)
    setSelectedUnit(null)
  }, [])

  const handleUnitClick = useCallback((i: number) => {
    setSelectedUnit(prev => (prev === i ? null : i))
  }, [])

  const handleClosePanel = useCallback(() => {
    setSelectedUnit(null)
  }, [])

  // Loading state
  if (!config) {
    return (
      <section id="planta" className="relative py-24 md:py-32 bg-[#F5F1EA]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-2 border-[#8B6B4B] border-t-transparent rounded-full animate-spin" />
        </div>
      </section>
    )
  }

  const selectedUnitData = selectedUnit !== null ? units[selectedUnit] ?? null : null
  const isPanelOpen = selectedUnit !== null

  return (
    <section id="planta" className="relative py-24 md:py-32 bg-[#F5F1EA]">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-[10px] tracking-[0.5em] uppercase text-[#8B6B4B] mb-4 font-[family-name:var(--font-inter)]"
          >
            Planta Interactiva
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2 }}
            className="font-[family-name:var(--font-cormorant)] text-3xl md:text-5xl text-[#111111] font-light"
          >
            Visualizar Distribución
          </motion.h2>
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: 60 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.5 }}
            className="h-[1px] bg-[#8B6B4B] mx-auto mt-6"
          />
        </div>

        {/* Main layout — two columns: floor selector + floor plan (with overlay panel) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
          {/* Floor selector — left sidebar */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <div className="h-full min-h-[200px] lg:min-h-[640px]">
              <FloorSelector
                floors={floors}
                selectedFloor={selectedFloor}
                onSelect={handleFloorSelect}
              />
            </div>
          </div>

          {/* Floor plan — center with overlay panel */}
          <div className="lg:col-span-10 order-1 lg:order-2">
            <div className="bg-[#111111] p-4 md:p-6 h-full min-h-[400px] lg:min-h-[640px] relative overflow-hidden">
              {floor && (
                <>
                  <Legend floor={floor} />

                  <FloorPlanDisplay
                    floor={floor}
                    units={units}
                    selectedUnit={selectedUnit}
                    onUnitClick={handleUnitClick}
                  />

                  {/* Floor info strip */}
                  <div className="flex items-center justify-between mt-4 px-1">
                    <div className="flex items-center gap-3">
                      <span className="text-[8px] text-[#D8D1C8]/30 font-[family-name:var(--font-inter)] tracking-wider">
                        PLANO ARQUITECTÓNICO
                      </span>
                      <span className="text-[8px] text-[#D8D1C8]/20">|</span>
                      <span className="text-[8px] text-[#D8D1C8]/30 font-[family-name:var(--font-inter)] tracking-wider">
                        PRAGA LIVING
                      </span>
                    </div>
                    <span className="text-[8px] text-[#D8D1C8]/30 font-[family-name:var(--font-inter)] tracking-wider">
                      {floor.isResidential ? `${floor.apartments.length} UNIDADES` : 'ÁREAS COMUNES'}
                    </span>
                  </div>

                  {/* Glassmorphic detail panel overlay */}
                  <GlassDetailPanel
                    unit={selectedUnitData}
                    floor={floor}
                    isOpen={isPanelOpen}
                    onClose={handleClosePanel}
                  />
                </>
              )}

              {/* Empty state hint when no unit is selected */}
              {!isPanelOpen && floor?.isResidential && (
                <div className="hidden md:flex absolute top-16 right-4 z-10 items-center gap-2 opacity-40 hover:opacity-70 transition-opacity">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 1L1 6L5 11" stroke="#8B6B4B" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M11 1L7 6L11 11" stroke="#8B6B4B" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-[8px] text-[#D8D1C8]/60 tracking-wider font-[family-name:var(--font-inter)] uppercase">
                    Selecciona una unidad
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Custom scrollbar style */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #8B6B4B33;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #8B6B4B66;
        }
      `}</style>
    </section>
  )
}
