'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

type UnitStatus = 'available' | 'reserved' | 'sold'

interface UnitData {
  id: string
  name: string
  area: number
  bedrooms: number
  bathrooms: number
  status: UnitStatus
  typology: string
  priceRange: string
}

interface LabeledArea {
  label: string
  rect: { x: number; y: number; w: number; h: number }
  sublabel?: string
}

interface FloorConfig {
  id: string
  name: string
  typeLabel: string
  isResidential: boolean
  unitCount: number
  areas: LabeledArea[]
}

type Pt = [number, number]

interface UnitLayoutDef {
  polygon: Pt[]
  center: Pt
}

// ═══════════════════════════════════════════════════════════════════
// SVG COORDINATE CONSTANTS
// ═══════════════════════════════════════════════════════════════════

const VB_W = 800
const VB_H = 600

// Building outline
const BX = 40, BY = 20, BW = 720, BH = 560

// Atrium void
const AX = 290, AY = 230, AW = 220, AH = 160

// Elevator core
const ELX = 365, ELY = 75, ELW = 55, ELH = 110

// Stairwell
const STX = 420, STY = 75, STW = 55, STH = 110

// Corridor width
const CW = 40

// ═══════════════════════════════════════════════════════════════════
// STATUS COLORS
// ═══════════════════════════════════════════════════════════════════

function statusStyle(s: UnitStatus, hovered: boolean, selected: boolean) {
  const base = {
    available: { fill: '#4B5646', fillOp: hovered ? 0.85 : 0.6, stroke: '#4B5646', strokeOp: 1 },
    reserved: { fill: '#8B6B4B', fillOp: hovered ? 0.85 : 0.6, stroke: '#8B6B4B', strokeOp: 1 },
    sold: { fill: '#D8D1C8', fillOp: 0.3, stroke: '#D8D1C8', strokeOp: 0.2 },
  }[s]
  if (selected) {
    return { ...base, fillOp: 0.8, stroke: '#8B6B4B', strokeOp: 1 }
  }
  return base
}

const STATUS_LABELS: Record<UnitStatus, string> = {
  available: 'Disponible',
  reserved: 'Reservado',
  sold: 'Vendido',
}

// ═══════════════════════════════════════════════════════════════════
// UNIT POLYGON LAYOUTS
// ═══════════════════════════════════════════════════════════════════

// 4 apartments per floor: 2 per wing (west + east)
// West wing: 2 units (smaller, 1-2 alcobas) · East wing: 2 units (larger, 2-3 alcobas)
function layout4(): UnitLayoutDef[] {
  const midY = BY + BH / 2
  const lwW = AX - BX - CW // west wing width
  const rwX = AX + AW + CW // east wing start X
  const rwW = BX + BW - rwX // east wing width

  // West wing: top unit + bottom unit
  const westTopH = midY - BY - 10
  const westBotY = midY + 10
  const westBotH = BY + BH - westBotY

  // East wing: top unit + bottom unit
  const eastTopH = midY - BY - 10
  const eastBotY = midY + 10
  const eastBotH = BY + BH - eastBotY

  return [
    // West wing - top unit (Unit 1: APTO 02 / 1 alcoba)
    { polygon: [[BX, BY], [AX - CW, BY], [AX - CW, midY - 10], [BX, midY - 10]], center: [(BX + AX - CW) / 2, BY + westTopH / 2] },
    // West wing - bottom unit (Unit 2: APTO 05 / 1-2 alcobas)
    { polygon: [[BX, westBotY], [AX - CW, westBotY], [AX - CW, BY + BH], [BX, BY + BH]], center: [(BX + AX - CW) / 2, westBotY + westBotH / 2] },
    // East wing - top unit (Unit 3: 2 alcobas)
    { polygon: [[rwX, BY], [BX + BW, BY], [BX + BW, midY - 10], [rwX, midY - 10]], center: [(rwX + BX + BW) / 2, BY + eastTopH / 2] },
    // East wing - bottom unit (Unit 4: 3 alcobas vestier)
    { polygon: [[rwX, eastBotY], [BX + BW, eastBotY], [BX + BW, BY + BH], [rwX, BY + BH]], center: [(rwX + BX + BW) / 2, eastBotY + eastBotH / 2] },
  ]
}

function layout6(): UnitLayoutDef[] {
  return [
    { polygon: [[BX, BY], [AX, BY], [AX, AY], [BX, AY]], center: [165, 125] },
    { polygon: [[AX + AW, BY], [BX + BW, BY], [BX + BW, AY], [AX + AW, AY]], center: [635, 125] },
    { polygon: [[BX, AY], [AX - CW, AY], [AX - CW, AY + AH], [BX, AY + AH]], center: [145, 310] },
    { polygon: [[AX + AW + CW, AY], [BX + BW, AY], [BX + BW, AY + AH], [AX + AW + CW, AY + AH]], center: [655, 310] },
    { polygon: [[BX, AY + AH], [AX, AY + AH], [AX, BY + BH], [BX, BY + BH]], center: [165, 485] },
    { polygon: [[AX + AW, AY + AH], [BX + BW, AY + AH], [BX + BW, BY + BH], [AX + AW, BY + BH]], center: [635, 485] },
  ]
}

function layoutCommercial(): UnitLayoutDef[] {
  return [
    { polygon: [[BX, BY], [390, BY], [390, BY + BH], [BX, BY + BH]], center: [215, 300] },
    { polygon: [[410, BY], [BX + BW, BY], [BX + BW, BY + BH], [410, BY + BH]], center: [585, 300] },
  ]
}

function getUnitLayouts(count: number): UnitLayoutDef[] {
  if (count === 4) return layout4()
  if (count === 6) return layout6()
  if (count === 2) return layoutCommercial()
  return []
}

// ═══════════════════════════════════════════════════════════════════
// FLOOR DATA
// ═══════════════════════════════════════════════════════════════════

const FLOORS: FloorConfig[] = [
  {
    id: 's3', name: 'Sótano 3', typeLabel: 'Parqueaderos · Cuarto Técnico · UTIL 01-05',
    isResidential: false, unitCount: 0,
    areas: [
      { label: 'Parqueaderos', rect: { x: 60, y: 50, w: 340, h: 500 }, sublabel: '9401-9417' },
      { label: 'UTIL', rect: { x: 420, y: 50, w: 140, h: 150 }, sublabel: '01-03' },
      { label: 'Cuarto Técnico', rect: { x: 580, y: 50, w: 160, h: 150 }, sublabel: 'Equipos' },
      { label: 'Parqueaderos', rect: { x: 420, y: 230, w: 320, h: 320 }, sublabel: '9418-9423' },
    ],
  },
  {
    id: 's2', name: 'Sótano 2', typeLabel: 'Parqueaderos Residentes',
    isResidential: false, unitCount: 0,
    areas: [
      { label: 'Parqueaderos', rect: { x: 60, y: 50, w: 340, h: 500 }, sublabel: '9501-9517' },
      { label: 'UTIL', rect: { x: 420, y: 50, w: 140, h: 150 }, sublabel: '04-05' },
      { label: 'Parqueaderos', rect: { x: 420, y: 230, w: 320, h: 320 }, sublabel: '9518-9523' },
    ],
  },
  {
    id: 's1', name: 'Sótano 1', typeLabel: 'Parqueaderos Visitantes',
    isResidential: false, unitCount: 0,
    areas: [
      { label: 'Parqueaderos', rect: { x: 60, y: 50, w: 340, h: 500 }, sublabel: 'Residentes' },
      { label: 'Visitantes', rect: { x: 420, y: 50, w: 320, h: 230 }, sublabel: 'V-02 a V-14' },
      { label: 'Bodegas', rect: { x: 420, y: 320, w: 320, h: 230 }, sublabel: 'Bod. 01-12' },
    ],
  },
  {
    id: 'acceso', name: '1° Piso / Acceso', typeLabel: 'Lobby · Recepción · Local 1 · Bodega',
    isResidential: false, unitCount: 0,
    areas: [
      { label: 'Lobby', rect: { x: 290, y: 50, w: 220, h: 280 }, sublabel: 'Doble altura' },
      { label: 'Local 1', rect: { x: 60, y: 50, w: 200, h: 180 }, sublabel: '43.17 m²' },
      { label: 'Recepción', rect: { x: 540, y: 50, w: 200, h: 180 } },
      { label: 'Bodega', rect: { x: 60, y: 270, w: 200, h: 120 } },
      { label: 'Baños', rect: { x: 540, y: 270, w: 200, h: 120 } },
      { label: 'Áreas Verdes', rect: { x: 60, y: 430, w: 670, h: 120 }, sublabel: 'Fachada' },
    ],
  },
  {
    id: 'comercial', name: 'Nivel Comercial', typeLabel: 'Locales 9701/9801 · 558.91 m²',
    isResidential: false, unitCount: 0,
    areas: [
      { label: 'Local 9701', rect: { x: 60, y: 50, w: 310, h: 500 }, sublabel: '279.45 m²' },
      { label: 'Local 9801', rect: { x: 420, y: 50, w: 310, h: 500 }, sublabel: '279.46 m²' },
    ],
  },
  {
    id: 'social', name: 'Zona Social', typeLabel: 'Ludoteca · Gimnasio · Vitality Pool · Salón · Sauna · Turco',
    isResidential: false, unitCount: 0,
    areas: [
      { label: 'Ludoteca', rect: { x: 60, y: 50, w: 200, h: 230 } },
      { label: 'Gimnasio', rect: { x: 290, y: 50, w: 220, h: 230 }, sublabel: '150 m²' },
      { label: 'Vitality Pool', rect: { x: 540, y: 50, w: 200, h: 230 } },
      { label: 'Salón Social', rect: { x: 60, y: 320, w: 200, h: 230 } },
      { label: 'Sauna / Turco', rect: { x: 290, y: 320, w: 220, h: 230 } },
      { label: 'Vestier / Baños', rect: { x: 540, y: 320, w: 200, h: 230 } },
    ],
  },
  ...Array.from({ length: 12 }, (_, i) => ({
    id: `piso-${i + 1}`,
    name: `Piso ${i + 1}`,
    typeLabel: i < 4 ? 'Residencial · 2 Tipo A (1 alcoba) + 2 Tipo A (2 alcobas)' : i < 8 ? 'Residencial · 2 Tipo B (1-2 alcobas) + 2 Tipo B (2 alcobas)' : 'Residencial Premium · 2 Tipo B+ (2 alcobas) + 2 Premium (3 alcobas vestier)',
    isResidential: true as const,
    unitCount: 4,
    areas: [] as LabeledArea[],
  })),
  {
    id: 'cubierta', name: 'Cubierta', typeLabel: 'Terraza Panorámica · Jardín Elevado · Zona Lounge',
    isResidential: false, unitCount: 0,
    areas: [
      { label: 'Terraza Panorámica', rect: { x: 60, y: 50, w: 310, h: 230 }, sublabel: 'Vistas 360°' },
      { label: 'Jardín Elevado', rect: { x: 420, y: 50, w: 310, h: 230 } },
      { label: 'Zona Lounge', rect: { x: 60, y: 320, w: 200, h: 230 } },
      { label: 'Descanso', rect: { x: 290, y: 320, w: 220, h: 230 } },
      { label: 'Sky Garden', rect: { x: 540, y: 320, w: 200, h: 230 } },
    ],
  },
]

// ═══════════════════════════════════════════════════════════════════
// UNIT DATA GENERATION
// ═══════════════════════════════════════════════════════════════════

const STATUS_MAP_4: UnitStatus[] = ['available', 'reserved', 'available', 'sold']

const TYPOLOGIES_4: Record<string, { typ: string; area: number; beds: number; baths: number; price: string }[]> = {
  '1-4': [
    { typ: 'Tipo A', area: 68.50, beds: 1, baths: 1, price: '$180M – $212M' },
    { typ: 'Tipo A', area: 71.20, beds: 1, baths: 1, price: '$183M – $215M' },
    { typ: 'Tipo A', area: 87.30, beds: 2, baths: 2, price: '$195M – $227M' },
    { typ: 'Tipo A', area: 89.60, beds: 2, baths: 2, price: '$199M – $231M' },
  ],
  '5-8': [
    { typ: 'Tipo B', area: 72.40, beds: 1, baths: 1, price: '$250M – $298M' },
    { typ: 'Tipo B', area: 74.80, beds: 1, baths: 1, price: '$255M – $303M' },
    { typ: 'Tipo B', area: 91.20, beds: 2, baths: 2, price: '$280M – $328M' },
    { typ: 'Tipo B', area: 93.50, beds: 2, baths: 2, price: '$286M – $334M' },
  ],
  '9-12': [
    { typ: 'Tipo B+', area: 88.50, beds: 2, baths: 2, price: '$350M – $414M' },
    { typ: 'Tipo B+', area: 90.80, beds: 2, baths: 2, price: '$356M – $420M' },
    { typ: 'Premium', area: 108.40, beds: 3, baths: 2, price: '$420M – $498M' },
    { typ: 'Premium', area: 111.20, beds: 3, baths: 2, price: '$430M – $508M' },
  ],
}

// Per-floor status overrides for realism (floor index → status overrides)
const FLOOR_STATUS_OVERRIDES: Record<number, Partial<Record<number, UnitStatus>>> = {
  9: { 0: 'sold', 3: 'reserved' },
  10: { 1: 'sold' },
  11: { 0: 'reserved', 3: 'sold' },
  12: { 2: 'reserved' },
  13: { 1: 'sold' },
  14: { 3: 'reserved' },
  15: { 0: 'sold' },
  16: { 2: 'sold' },
  17: { 1: 'reserved' },
  18: { 3: 'sold' },
}

function generateUnits(floor: FloorConfig, floorIdx: number): UnitData[] {
  if (!floor.isResidential || floor.unitCount === 0) return []
  const n = floor.unitCount

  // Determine which typology set to use based on floor
  let typKey = '1-4'
  const floorNum = parseInt(floor.name.replace('Piso ', ''))
  if (floorNum >= 5 && floorNum <= 8) typKey = '5-8'
  else if (floorNum >= 9) typKey = '9-12'

  const typs = TYPOLOGIES_4[typKey] ?? TYPOLOGIES_4['1-4']
  const baseStatus = STATUS_MAP_4
  const overrides = FLOOR_STATUS_OVERRIDES[floorIdx] ?? {}

  return Array.from({ length: n }, (_, i) => {
    const t = typs[i % typs.length]
    const st = overrides[i] ?? baseStatus[i % baseStatus.length]
    const aptNumber = floorNum * 100 + (i + 1)
    return {
      id: `APTO-${aptNumber}`,
      name: `Apto ${aptNumber}`,
      area: t.area,
      bedrooms: t.beds,
      bathrooms: t.baths,
      status: st,
      typology: t.typ,
      priceRange: t.price,
    }
  })
}

// ═══════════════════════════════════════════════════════════════════
// SVG HELPERS
// ═══════════════════════════════════════════════════════════════════

function ptsToPolyStr(pts: Pt[]): string {
  return pts.map(p => `${p[0]},${p[1]}`).join(' ')
}

function ptsToPath(pts: Pt[]): string {
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ') + ' Z'
}

// Generate window marks on exterior walls
function windowMarks(pts: Pt[]): { x1: number; y1: number; x2: number; y2: number }[] {
  const marks: { x1: number; y1: number; x2: number; y2: number }[] = []
  const SPACING = 55
  const MLEN = 14

  for (let i = 0; i < pts.length; i++) {
    const p1 = pts[i]
    const p2 = pts[(i + 1) % pts.length]
    const isExt =
      (p1[0] === BX && p2[0] === BX) || (p1[0] === BX + BW && p2[0] === BX + BW) ||
      (p1[1] === BY && p2[1] === BY) || (p1[1] === BY + BH && p2[1] === BY + BH) ||
      ((p1[0] === BX || p1[0] === BX + BW || p1[1] === BY || p1[1] === BY + BH) &&
        (p2[0] === BX || p2[0] === BX + BW || p2[1] === BY || p2[1] === BY + BH))

    if (!isExt) continue

    const dx = p2[0] - p1[0]
    const dy = p2[1] - p1[1]
    const len = Math.sqrt(dx * dx + dy * dy)
    if (len < 80) continue

    const nx = -dy / len
    const ny = dx / len
    const num = Math.max(1, Math.floor(len / SPACING))
    const start = (len - (num - 1) * SPACING) / 2

    for (let j = 0; j < num; j++) {
      const t = (start + j * SPACING) / len
      if (t < 0.08 || t > 0.92) continue
      const cx = p1[0] + dx * t
      const cy = p1[1] + dy * t
      marks.push({
        x1: cx - nx * MLEN / 2, y1: cy - ny * MLEN / 2,
        x2: cx + nx * MLEN / 2, y2: cy + ny * MLEN / 2,
      })
    }
  }
  return marks
}

// Generate door arcs on interior walls
function doorArcs(pts: Pt[]): { cx: number; cy: number; r: number; startAngle: number; endAngle: number }[] {
  const doors: { cx: number; cy: number; r: number; startAngle: number; endAngle: number }[] = []
  const R = 20

  for (let i = 0; i < pts.length; i++) {
    const p1 = pts[i]
    const p2 = pts[(i + 1) % pts.length]
    const isExt =
      (p1[0] === BX && p2[0] === BX) || (p1[0] === BX + BW && p2[0] === BX + BW) ||
      (p1[1] === BY && p2[1] === BY) || (p1[1] === BY + BH && p2[1] === BY + BH)
    if (isExt) continue

    const dx = p2[0] - p1[0]
    const dy = p2[1] - p1[1]
    const len = Math.sqrt(dx * dx + dy * dy)
    if (len < 60) continue

    const mx = (p1[0] + p2[0]) / 2
    const my = (p1[1] + p2[1]) / 2
    const angle = Math.atan2(dy, dx)

    doors.push({
      cx: mx, cy: my, r: R,
      startAngle: angle,
      endAngle: angle + Math.PI / 2,
    })
  }
  return doors
}

// ═══════════════════════════════════════════════════════════════════
// SVG PATTERN DEFS
// ═══════════════════════════════════════════════════════════════════

function SvgDefs() {
  return (
    <defs>
      {/* Glow filter for selected unit */}
      <filter id="glow-bronce" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="6" result="blur" />
        <feFlood floodColor="#8B6B4B" floodOpacity="0.7" result="color" />
        <feComposite in="color" in2="blur" operator="in" result="shadow" />
        <feMerge>
          <feMergeNode in="shadow" />
          <feMergeNode in="shadow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Atrium hatching pattern */}
      <pattern id="atrium-hatch" patternUnits="userSpaceOnUse" width="12" height="12" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="12" stroke="#D8D1C8" strokeWidth="0.5" opacity="0.3" />
      </pattern>

      {/* Parking grid pattern */}
      <pattern id="parking-grid" patternUnits="userSpaceOnUse" width="60" height="35">
        <rect width="60" height="35" fill="none" />
        <line x1="0" y1="17" x2="60" y2="17" stroke="#D8D1C8" strokeWidth="0.3" opacity="0.2" />
        <line x1="30" y1="0" x2="30" y2="35" stroke="#D8D1C8" strokeWidth="0.3" opacity="0.15" />
      </pattern>

      {/* Corridor pattern */}
      <pattern id="corridor-pattern" patternUnits="userSpaceOnUse" width="8" height="8">
        <circle cx="4" cy="4" r="0.5" fill="#D8D1C8" opacity="0.15" />
      </pattern>
    </defs>
  )
}

// ═══════════════════════════════════════════════════════════════════
// ARCHITECTURAL SVG ELEMENTS
// ═══════════════════════════════════════════════════════════════════

function ElevatorCore() {
  return (
    <g>
      <rect x={ELX} y={ELY} width={ELW} height={ELH}
        fill="#111111" stroke="#D8D1C8" strokeWidth="2" opacity="0.8" />
      {/* X pattern */}
      <line x1={ELX + 4} y1={ELY + 4} x2={ELX + ELW - 4} y2={ELY + ELH - 4}
        stroke="#D8D1C8" strokeWidth="0.8" opacity="0.4" />
      <line x1={ELX + ELW - 4} y1={ELY + 4} x2={ELX + 4} y2={ELY + ELH - 4}
        stroke="#D8D1C8" strokeWidth="0.8" opacity="0.4" />
      {/* Center line */}
      <line x1={ELX + ELW / 2} y1={ELY + 4} x2={ELX + ELW / 2} y2={ELY + ELH - 4}
        stroke="#D8D1C8" strokeWidth="0.5" opacity="0.3" />
      <text x={ELX + ELW / 2} y={ELY + ELH + 12}
        textAnchor="middle" fill="#D8D1C8" fontSize="7" fontFamily="var(--font-inter)" opacity="0.5">
        ELEV
      </text>
    </g>
  )
}

function Stairwell() {
  const steps = 8
  const stepH = (STH - 8) / steps
  return (
    <g>
      <rect x={STX} y={STY} width={STW} height={STH}
        fill="#111111" stroke="#D8D1C8" strokeWidth="2" opacity="0.8" />
      {/* Stair treads */}
      {Array.from({ length: steps }, (_, i) => (
        <line key={i}
          x1={STX + 4} y1={STY + 4 + stepH * (i + 1)}
          x2={STX + STW - 4} y2={STY + 4 + stepH * (i + 1)}
          stroke="#D8D1C8" strokeWidth="0.5" opacity="0.3" />
      ))}
      {/* Arrow */}
      <line x1={STX + STW / 2} y1={STY + STH - 8} x2={STX + STW / 2} y2={STY + 10}
        stroke="#D8D1C8" strokeWidth="0.8" opacity="0.4" />
      <polygon points={`${STX + STW / 2 - 3},${STY + 12} ${STX + STW / 2 + 3},${STY + 12} ${STX + STW / 2},${STY + 7}`}
        fill="#D8D1C8" opacity="0.4" />
      <text x={STX + STW / 2} y={STY + STH + 12}
        textAnchor="middle" fill="#D8D1C8" fontSize="7" fontFamily="var(--font-inter)" opacity="0.5">
        STR
      </text>
    </g>
  )
}

function AtriumVoid() {
  return (
    <g>
      <rect x={AX} y={AY} width={AW} height={AH}
        fill="url(#atrium-hatch)" stroke="#D8D1C8" strokeWidth="1.5"
        strokeDasharray="6 3" opacity="0.7" />
      {/* Diagonal cross lines */}
      <line x1={AX + 10} y1={AY + 10} x2={AX + AW - 10} y2={AY + AH - 10}
        stroke="#D8D1C8" strokeWidth="0.5" opacity="0.2" />
      <line x1={AX + AW - 10} y1={AY + 10} x2={AX + 10} y2={AY + AH - 10}
        stroke="#D8D1C8" strokeWidth="0.5" opacity="0.2" />
      {/* Label */}
      <text x={AX + AW / 2} y={AY + AH / 2 - 6}
        textAnchor="middle" fill="#D8D1C8" fontSize="10"
        fontFamily="var(--font-cormorant)" opacity="0.4" letterSpacing="0.15em">
        ATRIO
      </text>
      <text x={AX + AW / 2} y={AY + AH / 2 + 8}
        textAnchor="middle" fill="#D8D1C8" fontSize="7"
        fontFamily="var(--font-inter)" opacity="0.25" letterSpacing="0.1em">
        VACÍO CENTRAL
      </text>
    </g>
  )
}

function CorridorAreas({ unitCount }: { unitCount: number }) {
  return (
    <g>
      {/* Top corridor */}
      <rect x={AX} y={BY} width={AW} height={AY - BY}
        fill="url(#corridor-pattern)" stroke="none" />
      {/* Bottom corridor */}
      <rect x={AX} y={AY + AH} width={AW} height={BY + BH - AY - AH}
        fill="url(#corridor-pattern)" stroke="none" />
      {/* Left corridor */}
      {unitCount >= 6 && (
        <rect x={AX - CW} y={AY} width={CW} height={AH}
          fill="url(#corridor-pattern)" stroke="none" />
      )}
      {/* Right corridor */}
      {unitCount >= 6 && (
        <rect x={AX + AW} y={AY} width={CW} height={AH}
          fill="url(#corridor-pattern)" stroke="none" />
      )}
      {/* Corridor walls */}
      <line x1={AX} y1={BY} x2={AX} y2={BY + BH}
        stroke="#D8D1C8" strokeWidth="1" opacity="0.3" />
      <line x1={AX + AW} y1={BY} x2={AX + AW} y2={BY + BH}
        stroke="#D8D1C8" strokeWidth="1" opacity="0.3" />
      {/* Corridor labels */}
      <text x={AX + AW / 2} y={BY + (AY - BY) / 2 + 20}
        textAnchor="middle" fill="#D8D1C8" fontSize="7"
        fontFamily="var(--font-inter)" opacity="0.3" letterSpacing="0.15em">
        HALL
      </text>
      <text x={AX + AW / 2} y={AY + AH + (BY + BH - AY - AH) / 2}
        textAnchor="middle" fill="#D8D1C8" fontSize="7"
        fontFamily="var(--font-inter)" opacity="0.3" letterSpacing="0.15em">
        HALL
      </text>
    </g>
  )
}

function BuildingOutline() {
  return (
    <g>
      <rect x={BX} y={BY} width={BW} height={BH}
        fill="none" stroke="#F5F1EA" strokeWidth="6" />
      {/* Inner wall line for thickness */}
      <rect x={BX + 6} y={BY + 6} width={BW - 12} height={BH - 12}
        fill="none" stroke="#D8D1C8" strokeWidth="0.5" opacity="0.2" />
    </g>
  )
}

function NorthArrow() {
  return (
    <g transform={`translate(${BX + BW - 25}, ${BY + 25})`}>
      <circle r="10" fill="none" stroke="#D8D1C8" strokeWidth="0.5" opacity="0.4" />
      <line x1="0" y1="7" x2="0" y2="-7" stroke="#D8D1C8" strokeWidth="0.8" opacity="0.5" />
      <polygon points="-2.5,-5 2.5,-5 0,-9" fill="#D8D1C8" opacity="0.5" />
      <text y="-12" textAnchor="middle" fill="#D8D1C8" fontSize="6"
        fontFamily="var(--font-inter)" opacity="0.5" fontWeight="600">N</text>
    </g>
  )
}

// ═══════════════════════════════════════════════════════════════════
// RESIDENTIAL FLOOR SVG
// ═══════════════════════════════════════════════════════════════════

function ResidentialFloorSVG({
  floor,
  units,
  layouts,
  selectedUnit,
  hoveredUnit,
  onUnitClick,
  onUnitMouseMove,
  onUnitLeave,
}: {
  floor: FloorConfig
  units: UnitData[]
  layouts: UnitLayoutDef[]
  selectedUnit: number | null
  hoveredUnit: number | null
  onUnitClick: (i: number) => void
  onUnitMouseMove: (i: number, e: React.MouseEvent) => void
  onUnitLeave: () => void
}) {
  return (
    <g>
      <BuildingOutline />
      <CorridorAreas unitCount={floor.unitCount} />
      <AtriumVoid />
      <ElevatorCore />
      <Stairwell />
      <NorthArrow />

      {/* Unit polygons */}
      {layouts.map((layout, i) => {
        const unit = units[i]
        if (!unit) return null
        const style = statusStyle(unit.status, hoveredUnit === i, selectedUnit === i)
        const wins = windowMarks(layout.polygon)
        const doors = doorArcs(layout.polygon)

        return (
          <g key={i}>
            {/* Unit fill */}
            <motion.polygon
              points={ptsToPolyStr(layout.polygon)}
              fill={style.fill}
              fillOpacity={style.fillOp}
              stroke={style.stroke}
              strokeWidth={selectedUnit === i ? 3 : 1.5}
              strokeOpacity={style.strokeOp}
              filter={selectedUnit === i ? 'url(#glow-bronce)' : undefined}
              onClick={() => onUnitClick(i)}
              onMouseMove={(e) => onUnitMouseMove(i, e)}
              onMouseLeave={onUnitLeave}
              className="cursor-pointer"
              style={{ transition: 'fill-opacity 0.2s, stroke 0.2s' }}
              animate={selectedUnit === i ? {
                strokeOpacity: [1, 0.5, 1],
              } : {}}
              transition={selectedUnit === i ? {
                duration: 2, repeat: Infinity, ease: 'easeInOut',
              } : {}}
            />

            {/* Interior wall outlines */}
            <polygon
              points={ptsToPolyStr(layout.polygon)}
              fill="none"
              stroke="#F5F1EA"
              strokeWidth="3"
              opacity="0.4"
              pointerEvents="none"
            />

            {/* Window marks */}
            {wins.map((w, j) => (
              <g key={`w-${i}-${j}`} pointerEvents="none">
                <line x1={w.x1} y1={w.y1} x2={w.x2} y2={w.y2}
                  stroke="#F5F1EA" strokeWidth="1.5" opacity="0.6" />
                {/* Extra parallel lines for window symbol */}
                <line x1={w.x1 + (w.y2 - w.y1) * 0.05} y1={w.y1 + (w.x1 - w.x2) * 0.05}
                  x2={w.x2 + (w.y2 - w.y1) * 0.05} y2={w.y2 + (w.x1 - w.x2) * 0.05}
                  stroke="#F5F1EA" strokeWidth="0.5" opacity="0.3" />
                <line x1={w.x1 - (w.y2 - w.y1) * 0.05} y1={w.y1 - (w.x1 - w.x2) * 0.05}
                  x2={w.x2 - (w.y2 - w.y1) * 0.05} y2={w.y2 - (w.x1 - w.x2) * 0.05}
                  stroke="#F5F1EA" strokeWidth="0.5" opacity="0.3" />
              </g>
            ))}

            {/* Door arcs */}
            {doors.map((d, j) => (
              <g key={`d-${i}-${j}`} pointerEvents="none">
                {/* Door gap (cover the wall) */}
                <line
                  x1={d.cx - 15 * Math.cos(d.startAngle)}
                  y1={d.cy - 15 * Math.sin(d.startAngle)}
                  x2={d.cx + 15 * Math.cos(d.startAngle)}
                  y2={d.cy + 15 * Math.sin(d.startAngle)}
                  stroke="#111111" strokeWidth="5"
                />
                {/* Door arc */}
                <path
                  d={`M ${d.cx + d.r * Math.cos(d.startAngle)} ${d.cy + d.r * Math.sin(d.startAngle)} A ${d.r} ${d.r} 0 0 1 ${d.cx + d.r * Math.cos(d.endAngle)} ${d.cy + d.r * Math.sin(d.endAngle)}`}
                  fill="none" stroke="#F5F1EA" strokeWidth="0.8" opacity="0.5"
                />
                {/* Door leaf line */}
                <line
                  x1={d.cx} y1={d.cy}
                  x2={d.cx + d.r * Math.cos(d.endAngle)}
                  y2={d.cy + d.r * Math.sin(d.endAngle)}
                  stroke="#F5F1EA" strokeWidth="0.8" opacity="0.5"
                />
              </g>
            ))}

            {/* Unit label */}
            <g pointerEvents="none">
              <text
                x={layout.center[0]} y={layout.center[1] - 6}
                textAnchor="middle" fill="#F5F1EA" fontSize="9"
                fontFamily="var(--font-inter)" opacity="0.7" fontWeight="500"
              >
                {unit.name.split('-').pop()}
              </text>
              <text
                x={layout.center[0]} y={layout.center[1] + 8}
                textAnchor="middle" fill="#F5F1EA" fontSize="12"
                fontFamily="var(--font-cormorant)" opacity="0.9"
              >
                {unit.area} m²
              </text>
              <text
                x={layout.center[0]} y={layout.center[1] + 20}
                textAnchor="middle" fill="#D8D1C8" fontSize="7"
                fontFamily="var(--font-inter)" opacity="0.4"
              >
                {unit.typology}
              </text>
            </g>
          </g>
        )
      })}

      {/* Dimension lines - building width */}
      <g opacity="0.25" pointerEvents="none">
        <line x1={BX} y1={BY + BH + 20} x2={BX + BW} y2={BY + BH + 20}
          stroke="#D8D1C8" strokeWidth="0.5" />
        <line x1={BX} y1={BY + BH + 14} x2={BX} y2={BY + BH + 26}
          stroke="#D8D1C8" strokeWidth="0.5" />
        <line x1={BX + BW} y1={BY + BH + 14} x2={BX + BW} y2={BY + BH + 26}
          stroke="#D8D1C8" strokeWidth="0.5" />
        <text x={BX + BW / 2} y={BY + BH + 18}
          textAnchor="middle" fill="#D8D1C8" fontSize="6"
          fontFamily="var(--font-inter)">32.52 m</text>
      </g>
      <g opacity="0.25" pointerEvents="none">
        <line x1={BX - 20} y1={BY} x2={BX - 20} y2={BY + BH}
          stroke="#D8D1C8" strokeWidth="0.5" />
        <line x1={BX - 26} y1={BY} x2={BX - 14} y2={BY}
          stroke="#D8D1C8" strokeWidth="0.5" />
        <line x1={BX - 26} y1={BY + BH} x2={BX - 14} y2={BY + BH}
          stroke="#D8D1C8" strokeWidth="0.5" />
        <text x={BX - 24} y={BY + BH / 2}
          textAnchor="middle" fill="#D8D1C8" fontSize="6"
          fontFamily="var(--font-inter)"
          transform={`rotate(-90, ${BX - 24}, ${BY + BH / 2})`}>26.04 m</text>
      </g>
    </g>
  )
}

// ═══════════════════════════════════════════════════════════════════
// NON-RESIDENTIAL FLOOR SVG
// ═══════════════════════════════════════════════════════════════════

function NonResidentialFloorSVG({ floor }: { floor: FloorConfig }) {
  return (
    <g>
      <rect x={BX} y={BY} width={BW} height={BH}
        fill="#0D0D0D" stroke="#F5F1EA" strokeWidth="6" />
      <rect x={BX + 6} y={BY + 6} width={BW - 12} height={BH - 12}
        fill="none" stroke="#D8D1C8" strokeWidth="0.5" opacity="0.2" />

      {/* Parking grid for sótanos */}
      {floor.id.startsWith('s') && (
        <rect x={BX + 8} y={BY + 8} width={BW - 16} height={BH - 16}
          fill="url(#parking-grid)" />
      )}

      {/* Labeled areas */}
      {floor.areas.map((area, i) => (
        <g key={i}>
          <rect
            x={area.rect.x} y={area.rect.y}
            width={area.rect.w} height={area.rect.h}
            fill="#D8D1C8" fillOpacity="0.06"
            stroke="#D8D1C8" strokeWidth="1" strokeOpacity="0.2"
            strokeDasharray={floor.id.startsWith('s') ? 'none' : '4 2'}
          />
          <text
            x={area.rect.x + area.rect.w / 2}
            y={area.rect.y + area.rect.h / 2 - (area.sublabel ? 6 : 0)}
            textAnchor="middle" fill="#F5F1EA" fontSize="13"
            fontFamily="var(--font-cormorant)" opacity="0.7"
          >
            {area.label}
          </text>
          {area.sublabel && (
            <text
              x={area.rect.x + area.rect.w / 2}
              y={area.rect.y + area.rect.h / 2 + 10}
              textAnchor="middle" fill="#D8D1C8" fontSize="8"
              fontFamily="var(--font-inter)" opacity="0.4"
            >
              {area.sublabel}
            </text>
          )}
        </g>
      ))}

      {/* Elevator/stair for non-residential too */}
      {!floor.id.startsWith('s') && !floor.id.startsWith('cubierta') && (
        <>
          <ElevatorCore />
          <Stairwell />
        </>
      )}

      <NorthArrow />
    </g>
  )
}

// ═══════════════════════════════════════════════════════════════════
// TOOLTIP
// ═══════════════════════════════════════════════════════════════════

function Tooltip({
  unit,
  x,
  y,
}: {
  unit: UnitData | null
  x: number
  y: number
}) {
  if (!unit) return null
  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{ left: x + 16, top: y - 12 }}
    >
      <div className="bg-[#111111] border border-[#8B6B4B]/40 px-3 py-2 shadow-xl">
        <p className="text-[10px] text-[#F5F1EA] font-[family-name:var(--font-inter)] tracking-wider">
          {unit.name.split('-').pop()}
        </p>
        <p className="font-[family-name:var(--font-cormorant)] text-sm text-[#8B6B4B]">
          {unit.area} m² · {unit.typology}
        </p>
      </div>
    </div>
  )
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
  const progress = selectedFloor / (floors.length - 1)

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
// UNIT DETAIL PANEL
// ═══════════════════════════════════════════════════════════════════

function UnitDetailPanel({
  unit,
  floor,
}: {
  unit: UnitData | null
  floor: FloorConfig
}) {
  if (!unit) {
    return (
      <div className="bg-[#111111] p-6 min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-[1px] h-12 bg-[#8B6B4B]/30 mx-auto mb-4" />
          <p className="text-[10px] text-[#D8D1C8]/30 tracking-[0.15em] uppercase font-[family-name:var(--font-inter)]">
            Selecciona una unidad
          </p>
        </div>
      </div>
    )
  }

  const statusColor = {
    available: 'bg-[#4B5646] text-[#F5F1EA]',
    reserved: 'bg-[#8B6B4B] text-[#F5F1EA]',
    sold: 'bg-[#D8D1C8]/20 text-[#D8D1C8]/50',
  }[unit.status]

  return (
    <motion.div
      key={unit.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-[#111111] p-6 min-h-[400px]"
    >
      {/* Status badge */}
      <div className="mb-5">
        <span className={`text-[9px] tracking-[0.15em] uppercase px-2.5 py-1 font-[family-name:var(--font-inter)] ${statusColor}`}>
          {STATUS_LABELS[unit.status]}
        </span>
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
              // Try to find matching apartment in DB by name/floor
              const res = await fetch(`/api/apartments?floor=${encodeURIComponent(floor.name.replace('Piso ', ''))}`)
              const data = await res.json()
              const dbApt = data.apartments?.find((a: { name: string; area: number }) => a.name === unit.name || Math.abs(a.area - unit.area) < 1)
              if (dbApt) {
                window.open(`/api/ficha?id=${dbApt.id}`, '_blank')
              } else if (data.apartments?.length > 0) {
                // Fallback: use first apartment on that floor
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
    </motion.div>
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
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function PlantaInteractiva() {
  const [selectedFloor, setSelectedFloor] = useState(9) // Piso 4 default
  const [selectedUnit, setSelectedUnit] = useState<number | null>(null)
  const [hoveredUnit, setHoveredUnit] = useState<number | null>(null)
  const [tooltip, setTooltip] = useState<{ unit: UnitData | null; x: number; y: number }>({ unit: null, x: 0, y: 0 })

  const floor = FLOORS[selectedFloor]
  const units = useMemo(() => generateUnits(floor, selectedFloor), [floor, selectedFloor])
  const layouts = useMemo(() => getUnitLayouts(floor.unitCount), [floor.unitCount])

  const handleFloorSelect = useCallback((i: number) => {
    setSelectedFloor(i)
    setSelectedUnit(null)
    setHoveredUnit(null)
  }, [])

  const handleUnitClick = useCallback((i: number) => {
    setSelectedUnit(prev => prev === i ? null : i)
  }, [])

  const handleUnitLeave = useCallback(() => {
    setHoveredUnit(null)
    setTooltip(prev => ({ ...prev, unit: null }))
  }, [])

  const handleUnitMouseMove = useCallback((i: number, e: React.MouseEvent) => {
    setHoveredUnit(i)
    setTooltip({ unit: units[i] ?? null, x: e.clientX, y: e.clientY })
  }, [units])

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

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
          {/* Floor selector - left sidebar */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <div className="h-full min-h-[200px] lg:min-h-[640px]">
              <FloorSelector
                floors={FLOORS}
                selectedFloor={selectedFloor}
                onSelect={handleFloorSelect}
              />
            </div>
          </div>

          {/* Floor plan SVG - center */}
          <div className="lg:col-span-7 order-1 lg:order-2">
            <div className="bg-[#111111] p-4 md:p-6 h-full min-h-[400px] lg:min-h-[640px] relative">
              <Legend floor={floor} />

              <div className="relative">
                <AnimatePresence mode="wait">
                  <motion.svg
                    key={floor.id}
                    viewBox={`0 0 ${VB_W} ${VB_H}`}
                    preserveAspectRatio="xMidYMid meet"
                    className="w-full h-auto"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    style={{ background: '#0A0A0A' }}
                  >
                    <SvgDefs />
                    {floor.isResidential && units.length > 0 ? (
                      <ResidentialFloorSVG
                        floor={floor}
                        units={units}
                        layouts={layouts}
                        selectedUnit={selectedUnit}
                        hoveredUnit={hoveredUnit}
                        onUnitClick={handleUnitClick}
                        onUnitMouseMove={handleUnitMouseMove}
                        onUnitLeave={handleUnitLeave}
                      />
                    ) : (
                      <NonResidentialFloorSVG floor={floor} />
                    )}
                  </motion.svg>
                </AnimatePresence>

              </div>

              {/* Floor info strip */}
              <div className="flex items-center justify-between mt-4 px-1">
                <div className="flex items-center gap-3">
                  <span className="text-[8px] text-[#D8D1C8]/30 font-[family-name:var(--font-inter)] tracking-wider">
                    ESCALA 1:200
                  </span>
                  <span className="text-[8px] text-[#D8D1C8]/20">|</span>
                  <span className="text-[8px] text-[#D8D1C8]/30 font-[family-name:var(--font-inter)] tracking-wider">
                    PRAGA LIVING
                  </span>
                </div>
                <span className="text-[8px] text-[#D8D1C8]/30 font-[family-name:var(--font-inter)] tracking-wider">
                  {floor.isResidential ? `${floor.unitCount} UNIDADES` : 'ÁREAS COMUNES'}
                </span>
              </div>
            </div>
          </div>

          {/* Unit detail panel - right sidebar */}
          <div className="lg:col-span-3 order-3">
            <UnitDetailPanel
              unit={selectedUnit !== null ? units[selectedUnit] ?? null : null}
              floor={floor}
            />
          </div>
        </div>
      </div>

      {/* Tooltip */}
      <Tooltip unit={tooltip.unit} x={tooltip.x} y={tooltip.y} />

      {/* Custom scrollbar style */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #111111;
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
