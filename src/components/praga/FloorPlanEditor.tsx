'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Image from 'next/image'
import {
  Plus,
  Trash2,
  MousePointer2,
  Pencil,
  Upload,
  Save,
  Eye,
  X,
  HelpCircle,
} from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════

const STATUS_COLORS: Record<string, { fill: string; opacity: number }> = {
  available: { fill: '#4B5646', opacity: 0.35 },
  reserved: { fill: '#8B6B4B', opacity: 0.35 },
  sold: { fill: '#D8D1C8', opacity: 0.15 },
}

const STATUS_LABELS: Record<string, string> = {
  available: 'Disponible',
  reserved: 'Reservado',
  sold: 'Vendido',
}

const TYPOLOGY_OPTIONS = ['Tipo A', 'Tipo A+', 'Tipo B', 'Tipo C']
const BEDROOM_OPTIONS = [1, 2, 3]
const BATHROOM_OPTIONS = [1, 2]
const STATUS_OPTIONS = ['available', 'reserved', 'sold']
const VIEW_OPTIONS = ['Carrera 50', 'Calle 133 Sur', 'Atrio', 'Panorámica', 'Interior']

const CLOSE_THRESHOLD = 3 // percentage units to auto-close polygon

const DEFAULT_FLOOR_TEMPLATES = [
  { id: 'sotano-3', name: 'Sótano 3', typeLabel: 'Parqueaderos', isResidential: false },
  { id: 'sotano-2', name: 'Sótano 2', typeLabel: 'Parqueaderos', isResidential: false },
  { id: 'sotano-1', name: 'Sótano 1', typeLabel: 'Parqueaderos', isResidential: false },
  { id: 'parqueaderos-visitantes', name: 'Parqueaderos Visitantes', typeLabel: 'Visitantes', isResidential: false },
  { id: 'acceso', name: '1° Piso / Acceso', typeLabel: 'Lobby · Recepción', isResidential: false },
  { id: 'comercial', name: 'Nivel Comercial', typeLabel: 'Locales', isResidential: false },
  { id: 'social', name: 'Zona Social', typeLabel: 'Amenidades', isResidential: false },
  { id: 'cubierta', name: 'Cubierta', typeLabel: 'Terraza', isResidential: false },
]

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
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

function distance(p1: number[], p2: number[]): number {
  return Math.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2)
}

function isPointInPolygon(point: number[], polygon: number[][]): boolean {
  const [x, y] = point
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1]
    const xj = polygon[j][0], yj = polygon[j][1]
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

function generateId(): string {
  return `apto-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function FloorPlanEditor() {
  // State
  const [config, setConfig] = useState<FloorPlanConfig>({ floors: [] })
  const [selectedFloorIndex, setSelectedFloorIndex] = useState<number>(0)
  const [selectedAptId, setSelectedAptId] = useState<string | null>(null)
  const [mode, setMode] = useState<'select' | 'draw'>('select')
  const [drawingPoints, setDrawingPoints] = useState<number[][]>([])
  const [dragVertex, setDragVertex] = useState<{ aptId: string; vertexIndex: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Refs
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load config on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await fetch('/api/floor-plans')
        const data = await res.json()
        setConfig(data)
      } catch {
        setConfig({ floors: [] })
      }
      setLoading(false)
    }
    loadConfig()
  }, [])

  // Toast auto-hide
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  // Get current floor
  const currentFloor = config.floors[selectedFloorIndex] ?? null
  const selectedApt = currentFloor?.apartments.find(a => a.id === selectedAptId) ?? null

  // ═══ COORDINATE CONVERSION ═══
  const getImageCoords = useCallback((e: React.MouseEvent<SVGSVGElement>): number[] => {
    const svg = svgRef.current
    if (!svg) return [0, 0]
    const rect = svg.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    return [Math.round(Math.max(0, Math.min(100, x)) * 100) / 100, Math.round(Math.max(0, Math.min(100, y)) * 100) / 100]
  }, [])

  // ═══ SAVE CONFIG ═══
  const saveConfig = useCallback(async (newConfig: FloorPlanConfig) => {
    setSaving(true)
    try {
      const res = await fetch('/api/floor-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      })
      const data = await res.json()
      if (data.success) {
        setToast('Configuración guardada ✓')
      } else {
        setToast('Error al guardar')
      }
    } catch {
      setToast('Error de conexión')
    }
    setSaving(false)
  }, [])

  // ═══ IMAGE UPLOAD ═══
  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentFloor) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.url) {
        const newConfig = { ...config }
        newConfig.floors = newConfig.floors.map((f, i) =>
          i === selectedFloorIndex ? { ...f, image: data.url } : f
        )
        setConfig(newConfig)
        void saveConfig(newConfig)
        setToast('Imagen subida ✓')
      }
    } catch {
      setToast('Error al subir imagen')
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [config, currentFloor, selectedFloorIndex, saveConfig])

  // ═══ FLOOR MANAGEMENT ═══
  const addFloor = useCallback(() => {
    const name = prompt('Nombre del nuevo nivel:')
    if (!name) return
    const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const isRes = confirm('¿Es residencial? (Cancelar = No)')
    const newFloor: FloorConfig = {
      id: id || generateId(),
      name,
      typeLabel: isRes ? 'Residencial' : 'Áreas Comunes',
      isResidential: isRes,
      image: '',
      apartments: [],
    }
    const newConfig = { ...config, floors: [...config.floors, newFloor] }
    setConfig(newConfig)
    setSelectedFloorIndex(newConfig.floors.length - 1)
    void saveConfig(newConfig)
  }, [config, saveConfig])

  const deleteFloor = useCallback((index: number) => {
    if (!confirm('¿Eliminar este nivel?')) return
    const newConfig = { ...config, floors: config.floors.filter((_, i) => i !== index) }
    setConfig(newConfig)
    if (selectedFloorIndex >= newConfig.floors.length) {
      setSelectedFloorIndex(Math.max(0, newConfig.floors.length - 1))
    }
    setSelectedAptId(null)
    void saveConfig(newConfig)
  }, [config, selectedFloorIndex, saveConfig])

  // ═══ SVG INTERACTION ═══
  const handleSvgClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (dragVertex) return

    const coords = getImageCoords(e)

    if (mode === 'draw') {
      // Check if clicking near first point to close polygon
      if (drawingPoints.length >= 3) {
        const first = drawingPoints[0]
        if (distance(coords, first) < CLOSE_THRESHOLD) {
          // Close polygon
          const newApt: ApartmentZone = {
            id: generateId(),
            polygon: [...drawingPoints],
            name: `Apto ${(currentFloor?.apartments.length ?? 0) + 1}`,
            area: 0,
            bedrooms: 1,
            bathrooms: 1,
            typology: 'Tipo C',
            priceRange: '',
            status: 'available',
            view: 'Interior',
          }
          if (currentFloor) {
            const newConfig = { ...config }
            newConfig.floors = newConfig.floors.map((f, i) =>
              i === selectedFloorIndex
                ? { ...f, apartments: [...f.apartments, newApt] }
                : f
            )
            setConfig(newConfig)
            setSelectedAptId(newApt.id)
            setDrawingPoints([])
            setMode('select')
            void saveConfig(newConfig)
          }
          return
        }
      }
      // Add point
      setDrawingPoints(prev => [...prev, coords])
    } else {
      // Select mode - check if clicking on a polygon
      if (!currentFloor) return
      let found = false
      // Check in reverse order (top-most polygon first)
      for (let i = currentFloor.apartments.length - 1; i >= 0; i--) {
        const apt = currentFloor.apartments[i]
        if (isPointInPolygon(coords, apt.polygon)) {
          setSelectedAptId(apt.id)
          found = true
          break
        }
      }
      if (!found) {
        setSelectedAptId(null)
      }
    }
  }, [mode, drawingPoints, dragVertex, currentFloor, config, selectedFloorIndex, getImageCoords, saveConfig])

  const handleSvgDoubleClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (mode === 'draw' && drawingPoints.length >= 3) {
      // Close polygon on double-click
      const newApt: ApartmentZone = {
        id: generateId(),
        polygon: [...drawingPoints],
        name: `Apto ${(currentFloor?.apartments.length ?? 0) + 1}`,
        area: 0,
        bedrooms: 1,
        bathrooms: 1,
        typology: 'Tipo C',
        priceRange: '',
        status: 'available',
        view: 'Interior',
      }
      if (currentFloor) {
        const newConfig = { ...config }
        newConfig.floors = newConfig.floors.map((f, i) =>
          i === selectedFloorIndex
            ? { ...f, apartments: [...f.apartments, newApt] }
            : f
        )
        setConfig(newConfig)
        setSelectedAptId(newApt.id)
        setDrawingPoints([])
        setMode('select')
        void saveConfig(newConfig)
      }
    }
  }, [mode, drawingPoints, currentFloor, config, selectedFloorIndex, saveConfig])

  // ═══ VERTEX DRAGGING ═══
  const handleVertexMouseDown = useCallback((e: React.MouseEvent, aptId: string, vertexIndex: number) => {
    e.stopPropagation()
    e.preventDefault()
    setDragVertex({ aptId, vertexIndex })
    setSelectedAptId(aptId)
  }, [])

  const handleSvgMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragVertex || !currentFloor) return
    const coords = getImageCoords(e)
    const newConfig = { ...config }
    newConfig.floors = newConfig.floors.map((f, i) => {
      if (i !== selectedFloorIndex) return f
      return {
        ...f,
        apartments: f.apartments.map(apt => {
          if (apt.id !== dragVertex.aptId) return apt
          const newPolygon = apt.polygon.map((p, vi) =>
            vi === dragVertex.vertexIndex ? coords : p
          )
          return { ...apt, polygon: newPolygon }
        }),
      }
    })
    setConfig(newConfig)
  }, [dragVertex, currentFloor, config, selectedFloorIndex, getImageCoords])

  const handleSvgMouseUp = useCallback(() => {
    if (dragVertex) {
      setDragVertex(null)
      void saveConfig(config)
    }
  }, [dragVertex, config, saveConfig])

  // ═══ APARTMENT DATA UPDATE ═══
  const updateApartment = useCallback((field: string, value: string | number) => {
    if (!selectedAptId || !currentFloor) return
    const newConfig = { ...config }
    newConfig.floors = newConfig.floors.map((f, i) => {
      if (i !== selectedFloorIndex) return f
      return {
        ...f,
        apartments: f.apartments.map(apt =>
          apt.id === selectedAptId ? { ...apt, [field]: value } : apt
        ),
      }
    })
    setConfig(newConfig)
    // Auto-save with debounce via the config change effect below
  }, [selectedAptId, currentFloor, config, selectedFloorIndex])

  // Auto-save when config changes (debounced)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    // Don't save on initial load or when loading
    if (loading || !config.floors.length) return

    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Debounce: save 1 second after last change
    saveTimeoutRef.current = setTimeout(() => {
      void saveConfig(config)
    }, 1000)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [config, loading, saveConfig])

  const deleteApartment = useCallback(() => {
    if (!selectedAptId || !confirm('¿Eliminar este apartamento?')) return
    const newConfig = { ...config }
    newConfig.floors = newConfig.floors.map((f, i) => {
      if (i !== selectedFloorIndex) return f
      return { ...f, apartments: f.apartments.filter(a => a.id !== selectedAptId) }
    })
    setConfig(newConfig)
    setSelectedAptId(null)
    void saveConfig(newConfig)
  }, [selectedAptId, config, selectedFloorIndex, saveConfig])

  // ═══ CANCEL DRAWING ═══
  const cancelDrawing = useCallback(() => {
    setDrawingPoints([])
    setMode('select')
  }, [])

  // ═══ LOADING ═══
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-[#8B6B4B] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // ═══ PREVIEW MODE ═══
  if (showPreview) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-cormorant)] text-2xl text-[#F5F1EA]">
            Vista Previa
          </h2>
          <button
            onClick={() => setShowPreview(false)}
            className="text-[10px] tracking-wider uppercase border border-[#8B6B4B]/30 text-[#8B6B4B] px-3 py-1.5 hover:bg-[#8B6B4B]/10 transition-colors"
          >
            Volver al Editor
          </button>
        </div>

        {currentFloor && (
          <div className="bg-[#111111] p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-[family-name:var(--font-cormorant)] text-xl text-[#F5F1EA]">
                  {currentFloor.name}
                </h3>
                <p className="text-[10px] text-[#D8D1C8]/40 tracking-[0.1em] uppercase">
                  {currentFloor.typeLabel}
                </p>
              </div>
              {currentFloor.isResidential && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-[#4B5646] opacity-60" />
                    <span className="text-[9px] text-[#D8D1C8]/50">Disponible</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-[#8B6B4B] opacity-60" />
                    <span className="text-[9px] text-[#D8D1C8]/50">Reservado</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-[#D8D1C8] opacity-30" />
                    <span className="text-[9px] text-[#D8D1C8]/50">Vendido</span>
                  </div>
                </div>
              )}
            </div>

            <div className="relative w-full" style={{ aspectRatio: '16 / 11' }}>
              {currentFloor.image && (
                <Image
                  src={currentFloor.image}
                  alt={`Planta — ${currentFloor.name}`}
                  fill
                  className="object-contain"
                  sizes="100vw"
                />
              )}
              {currentFloor.isResidential && currentFloor.apartments.length > 0 && (
                <svg
                  viewBox="0 0 100 60"
                  preserveAspectRatio="none"
                  className="absolute inset-0 w-full h-full"
                >
                  {currentFloor.apartments.map((apt) => {
                    const colors = STATUS_COLORS[apt.status] || STATUS_COLORS.available
                    const center = getPolygonCenter(apt.polygon)
                    return (
                      <g key={apt.id}>
                        <polygon
                          points={polygonToPointsStr(apt.polygon)}
                          fill={colors.fill}
                          fillOpacity={colors.opacity}
                          stroke={colors.fill}
                          strokeWidth={0.4}
                          strokeOpacity={0.7}
                          className="cursor-pointer"
                        />
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
                            opacity={0.9}
                          >
                            {apt.name}
                          </text>
                          {apt.area > 0 && (
                            <text
                              x={center[0]}
                              y={center[1] + 1}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fill="#8B6B4B"
                              fontSize="2.5"
                              fontFamily="var(--font-cormorant)"
                              fontWeight="700"
                              opacity={0.95}
                            >
                              {apt.area} m²
                            </text>
                          )}
                          <text
                            x={center[0]}
                            y={center[1] + 3}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="#D8D1C8"
                            fontSize="1.6"
                            fontFamily="var(--font-inter)"
                            opacity={0.5}
                          >
                            {apt.typology}
                          </text>
                        </g>
                      </g>
                    )
                  })}
                </svg>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ═══ MAIN EDITOR ═══
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="font-[family-name:var(--font-cormorant)] text-2xl text-[#F5F1EA]">
            Plantas Interactivas
          </h2>
          <p className="text-[10px] text-[#D8D1C8]/30 tracking-[0.1em] uppercase mt-1">
            Editor visual de plantas y apartamentos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="flex items-center gap-1.5 text-[10px] tracking-wider uppercase border border-[#D8D1C8]/15 text-[#D8D1C8]/40 px-3 py-1.5 hover:text-[#8B6B4B] hover:border-[#8B6B4B]/30 transition-colors"
          >
            <HelpCircle className="w-3 h-3" /> Ayuda
          </button>
          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-1.5 text-[10px] tracking-wider uppercase border border-[#8B6B4B]/30 text-[#8B6B4B] px-3 py-1.5 hover:bg-[#8B6B4B]/10 transition-colors"
          >
            <Eye className="w-3 h-3" /> Vista Previa
          </button>
          <button
            onClick={() => void saveConfig(config)}
            disabled={saving}
            className="flex items-center gap-1.5 text-[10px] tracking-wider uppercase bg-[#8B6B4B] text-[#F5F1EA] px-3 py-1.5 hover:bg-[#7A5C3E] transition-colors disabled:opacity-50"
          >
            <Save className="w-3 h-3" /> {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>

      {/* Help panel */}
      {showHelp && (
        <div className="bg-[#111111] border border-[#8B6B4B]/20 p-4 text-[11px] text-[#D8D1C8]/50 space-y-2">
          <p className="text-[#8B6B4B] text-[10px] tracking-wider uppercase font-medium mb-2">Cómo usar el editor</p>
          <p>1. Selecciona un nivel en la columna izquierda, o sube una imagen de planta</p>
          <p>2. Activa el modo <strong className="text-[#F5F1EA]">Dibujar</strong> y haz clic sobre la imagen para definir los vértices del polígono</p>
          <p>3. Haz doble clic o haz clic cerca del primer punto para cerrar el polígono</p>
          <p>4. En modo <strong className="text-[#F5F1EA]">Seleccionar</strong>, haz clic en un polígono para editar sus datos</p>
          <p>5. Arrastra los vértices para ajustar la forma del polígono</p>
          <p>6. Completa los datos del apartamento en el panel derecho</p>
          <p>7. Haz clic en <strong className="text-[#F5F1EA]">Guardar</strong> para guardar todos los cambios</p>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-[#111111] border border-[#8B6B4B]/40 px-4 py-2 text-[11px] text-[#8B6B4B] shadow-xl">
          {toast}
        </div>
      )}

      {/* Three-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* ═══ LEFT COLUMN: Floor List ═══ */}
        <div className="lg:col-span-2">
          <div className="bg-[#111111] border border-[#D8D1C8]/5 p-3">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[9px] tracking-[0.3em] uppercase text-[#8B6B4B]">Niveles</p>
              <button
                onClick={addFloor}
                className="text-[#8B6B4B]/50 hover:text-[#8B6B4B] transition-colors"
                title="Agregar nivel"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-0.5 max-h-[600px] overflow-y-auto custom-scrollbar">
              {config.floors.map((floor, i) => (
                <div
                  key={floor.id}
                  className={`flex items-center justify-between group cursor-pointer py-2 px-2.5 border-l-2 transition-all ${
                    selectedFloorIndex === i
                      ? 'border-l-[#8B6B4B] bg-[#8B6B4B]/10'
                      : 'border-l-transparent hover:border-l-[#8B6B4B]/30 hover:bg-[#1A1A1A]'
                  }`}
                  onClick={() => {
                    setSelectedFloorIndex(i)
                    setSelectedAptId(null)
                    setDrawingPoints([])
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <p className={`text-[10px] tracking-[0.1em] truncate ${
                      selectedFloorIndex === i ? 'text-[#8B6B4B]' : 'text-[#D8D1C8]/40'
                    }`}>
                      {floor.name}
                    </p>
                    <p className="text-[8px] text-[#D8D1C8]/20 truncate">
                      {floor.apartments.length} aptos {floor.image ? '· 📷' : '· sin imagen'}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteFloor(i) }}
                    className="opacity-0 group-hover:opacity-100 text-[#D8D1C8]/20 hover:text-red-400 transition-all ml-1 flex-shrink-0"
                    title="Eliminar nivel"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ CENTER COLUMN: Visual Editor ═══ */}
        <div className="lg:col-span-7">
          <div className="bg-[#111111] border border-[#D8D1C8]/5 p-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setMode('select'); setDrawingPoints([]) }}
                  className={`flex items-center gap-1.5 text-[10px] tracking-wider uppercase px-3 py-1.5 border transition-colors ${
                    mode === 'select'
                      ? 'border-[#8B6B4B] text-[#8B6B4B] bg-[#8B6B4B]/10'
                      : 'border-[#D8D1C8]/15 text-[#D8D1C8]/30 hover:text-[#D8D1C8]/50'
                  }`}
                >
                  <MousePointer2 className="w-3 h-3" /> Seleccionar
                </button>
                <button
                  onClick={() => { setMode('draw'); setSelectedAptId(null) }}
                  className={`flex items-center gap-1.5 text-[10px] tracking-wider uppercase px-3 py-1.5 border transition-colors ${
                    mode === 'draw'
                      ? 'border-[#8B6B4B] text-[#8B6B4B] bg-[#8B6B4B]/10'
                      : 'border-[#D8D1C8]/15 text-[#D8D1C8]/30 hover:text-[#D8D1C8]/50'
                  }`}
                >
                  <Pencil className="w-3 h-3" /> Dibujar
                </button>

                {mode === 'draw' && drawingPoints.length > 0 && (
                  <button
                    onClick={cancelDrawing}
                    className="flex items-center gap-1 text-[10px] tracking-wider uppercase text-red-400/60 hover:text-red-400 transition-colors"
                  >
                    <X className="w-3 h-3" /> Cancelar
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[9px] text-[#D8D1C8]/20">
                  {mode === 'draw' ? `Dibujando: ${drawingPoints.length} puntos` : 'Modo selección'}
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => void handleImageUpload(e)}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-1.5 text-[10px] tracking-wider uppercase border border-[#D8D1C8]/15 text-[#D8D1C8]/40 px-3 py-1.5 hover:text-[#8B6B4B] hover:border-[#8B6B4B]/30 transition-colors disabled:opacity-50"
                >
                  <Upload className="w-3 h-3" /> {uploading ? 'Subiendo...' : 'Subir Imagen'}
                </button>
              </div>
            </div>

            {/* Drawing mode indicator */}
            {mode === 'draw' && (
              <div className="bg-[#8B6B4B]/10 border border-[#8B6B4B]/20 px-3 py-2 mb-3">
                <p className="text-[10px] text-[#8B6B4B]">
                  Haz clic sobre la imagen para agregar vértices.
                  {drawingPoints.length < 3
                    ? ` Necesitas al menos 3 puntos (${drawingPoints.length}/3).`
                    : ' Haz doble clic o haz clic cerca del primer punto para cerrar el polígono.'}
                </p>
              </div>
            )}

            {/* Floor plan canvas */}
            <div ref={containerRef} className="relative w-full bg-[#0A0A0A]" style={{ aspectRatio: '16 / 11' }}>
              {currentFloor?.image ? (
                <>
                  <Image
                    src={currentFloor.image}
                    alt={`Planta — ${currentFloor?.name ?? ''}`}
                    fill
                    className="object-contain"
                    sizes="(max-width: 1024px) 100vw, 58vw"
                    priority
                    draggable={false}
                  />

                  {/* SVG overlay */}
                  <svg
                    ref={svgRef}
                    viewBox="0 0 100 60"
                    preserveAspectRatio="none"
                    className="absolute inset-0 w-full h-full"
                    style={{ cursor: mode === 'draw' ? 'crosshair' : 'default' }}
                    onClick={handleSvgClick}
                    onDoubleClick={handleSvgDoubleClick}
                    onMouseMove={handleSvgMouseMove}
                    onMouseUp={handleSvgMouseUp}
                    onMouseLeave={handleSvgMouseUp}
                  >
                    {/* Existing apartment polygons */}
                    {currentFloor?.apartments.map((apt) => {
                      const colors = STATUS_COLORS[apt.status] || STATUS_COLORS.available
                      const isSelected = apt.id === selectedAptId
                      const center = getPolygonCenter(apt.polygon)

                      return (
                        <g key={apt.id}>
                          <polygon
                            points={polygonToPointsStr(apt.polygon)}
                            fill={isSelected ? '#8B6B4B' : colors.fill}
                            fillOpacity={isSelected ? 0.5 : colors.opacity}
                            stroke={isSelected ? '#8B6B4B' : colors.fill}
                            strokeWidth={isSelected ? 0.8 : 0.4}
                            strokeOpacity={isSelected ? 1 : 0.7}
                            className={mode === 'select' ? 'cursor-pointer' : ''}
                            onClick={(e) => {
                              if (mode === 'select') {
                                e.stopPropagation()
                                setSelectedAptId(apt.id)
                              }
                            }}
                          />

                          {/* Label */}
                          <g pointerEvents="none" style={{ userSelect: 'none' }}>
                            <text
                              x={center[0]}
                              y={center[1] - 1.5}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fill="#F5F1EA"
                              fontSize="2"
                              fontFamily="var(--font-inter)"
                              fontWeight="600"
                              opacity={0.9}
                            >
                              {apt.name}
                            </text>
                            {apt.area > 0 && (
                              <text
                                x={center[0]}
                                y={center[1] + 0.8}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill="#8B6B4B"
                                fontSize="2.3"
                                fontFamily="var(--font-cormorant)"
                                fontWeight="700"
                                opacity={0.95}
                              >
                                {apt.area} m²
                              </text>
                            )}
                            <text
                              x={center[0]}
                              y={center[1] + 2.8}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fill="#D8D1C8"
                              fontSize="1.4"
                              fontFamily="var(--font-inter)"
                              opacity={0.5}
                            >
                              {apt.typology}
                            </text>
                          </g>

                          {/* Draggable vertices (show in select mode when selected) */}
                          {isSelected && mode === 'select' && apt.polygon.map((pt, vi) => (
                            <circle
                              key={vi}
                              cx={pt[0]}
                              cy={pt[1]}
                              r={0.8}
                              fill="#8B6B4B"
                              stroke="#F5F1EA"
                              strokeWidth={0.3}
                              className="cursor-move"
                              onMouseDown={(e) => handleVertexMouseDown(e, apt.id, vi)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          ))}
                        </g>
                      )
                    })}

                    {/* Drawing in progress */}
                    {mode === 'draw' && drawingPoints.length > 0 && (
                      <g>
                        {/* Lines connecting drawn points */}
                        <polyline
                          points={drawingPoints.map(([x, y]) => `${x},${y}`).join(' ')}
                          fill="none"
                          stroke="#8B6B4B"
                          strokeWidth={0.5}
                          strokeDasharray="1,1"
                          opacity={0.8}
                        />
                        {/* Dashed line from last point to cursor area */}
                        {/* Vertices */}
                        {drawingPoints.map((pt, i) => (
                          <circle
                            key={i}
                            cx={pt[0]}
                            cy={pt[1]}
                            r={i === 0 ? 1 : 0.6}
                            fill={i === 0 ? '#8B6B4B' : '#F5F1EA'}
                            stroke={i === 0 ? '#F5F1EA' : '#8B6B4B'}
                            strokeWidth={0.3}
                            opacity={0.9}
                          />
                        ))}
                        {/* Close indicator on first point */}
                        {drawingPoints.length >= 3 && (
                          <circle
                            cx={drawingPoints[0][0]}
                            cy={drawingPoints[0][1]}
                            r={CLOSE_THRESHOLD}
                            fill="#8B6B4B"
                            fillOpacity={0.15}
                            stroke="#8B6B4B"
                            strokeWidth={0.3}
                            strokeDasharray="0.5,0.5"
                            opacity={0.6}
                          />
                        )}
                      </g>
                    )}
                  </svg>
                </>
              ) : (
                <div className="flex items-center justify-center h-full min-h-[400px]">
                  <div className="text-center">
                    <Upload className="w-8 h-8 text-[#D8D1C8]/10 mx-auto mb-3" />
                    <p className="text-[11px] text-[#D8D1C8]/30 mb-2">Sin imagen de planta</p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[10px] tracking-wider uppercase border border-[#8B6B4B]/30 text-[#8B6B4B] px-4 py-2 hover:bg-[#8B6B4B]/10 transition-colors"
                    >
                      Subir Imagen
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Floor info strip */}
            <div className="flex items-center justify-between mt-3 px-1">
              <span className="text-[8px] text-[#D8D1C8]/20 tracking-wider uppercase">
                {currentFloor?.name ?? 'Sin nivel seleccionado'}
              </span>
              <span className="text-[8px] text-[#D8D1C8]/20 tracking-wider uppercase">
                {currentFloor?.apartments.length ?? 0} apartamentos
              </span>
            </div>
          </div>
        </div>

        {/* ═══ RIGHT COLUMN: Apartment Data Form ═══ */}
        <div className="lg:col-span-3">
          <div className="bg-[#111111] border border-[#D8D1C8]/5 p-4 min-h-[400px]">
            {selectedApt ? (
              <div className="space-y-4">
                {/* Status badge */}
                <div className="flex items-center justify-between">
                  <span className={`text-[9px] tracking-wider uppercase px-2 py-0.5 ${
                    selectedApt.status === 'available'
                      ? 'bg-[#4B5646] text-[#F5F1EA]'
                      : selectedApt.status === 'reserved'
                        ? 'bg-[#8B6B4B] text-[#F5F1EA]'
                        : 'bg-[#D8D1C8]/20 text-[#D8D1C8]/50'
                  }`}>
                    {STATUS_LABELS[selectedApt.status]}
                  </span>
                  <button
                    onClick={deleteApartment}
                    className="text-[#D8D1C8]/20 hover:text-red-400 transition-colors"
                    title="Eliminar apartamento"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Name */}
                <div>
                  <label className="text-[9px] tracking-[0.15em] uppercase text-[#D8D1C8]/40 block mb-1.5">Nombre</label>
                  <input
                    type="text"
                    value={selectedApt.name}
                    onChange={(e) => updateApartment('name', e.target.value)}
                    className="w-full bg-transparent border border-[#D8D1C8]/15 px-3 py-2 text-[12px] text-[#F5F1EA] focus:border-[#8B6B4B] focus:outline-none transition-colors"
                  />
                </div>

                {/* Area */}
                <div>
                  <label className="text-[9px] tracking-[0.15em] uppercase text-[#D8D1C8]/40 block mb-1.5">Área (m²)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={selectedApt.area || ''}
                    onChange={(e) => updateApartment('area', parseFloat(e.target.value) || 0)}
                    className="w-full bg-transparent border border-[#D8D1C8]/15 px-3 py-2 text-[12px] text-[#F5F1EA] focus:border-[#8B6B4B] focus:outline-none transition-colors"
                  />
                </div>

                {/* Bedrooms & Bathrooms */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] tracking-[0.15em] uppercase text-[#D8D1C8]/40 block mb-1.5">Alcobas</label>
                    <select
                      value={selectedApt.bedrooms}
                      onChange={(e) => updateApartment('bedrooms', parseInt(e.target.value))}
                      className="w-full bg-transparent border border-[#D8D1C8]/15 px-3 py-2 text-[12px] text-[#F5F1EA] focus:border-[#8B6B4B] focus:outline-none appearance-none"
                    >
                      {BEDROOM_OPTIONS.map(n => (
                        <option key={n} value={n} className="bg-[#111111]">{n}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] tracking-[0.15em] uppercase text-[#D8D1C8]/40 block mb-1.5">Baños</label>
                    <select
                      value={selectedApt.bathrooms}
                      onChange={(e) => updateApartment('bathrooms', parseInt(e.target.value))}
                      className="w-full bg-transparent border border-[#D8D1C8]/15 px-3 py-2 text-[12px] text-[#F5F1EA] focus:border-[#8B6B4B] focus:outline-none appearance-none"
                    >
                      {BATHROOM_OPTIONS.map(n => (
                        <option key={n} value={n} className="bg-[#111111]">{n}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Typology */}
                <div>
                  <label className="text-[9px] tracking-[0.15em] uppercase text-[#D8D1C8]/40 block mb-1.5">Tipología</label>
                  <select
                    value={selectedApt.typology}
                    onChange={(e) => updateApartment('typology', e.target.value)}
                    className="w-full bg-transparent border border-[#D8D1C8]/15 px-3 py-2 text-[12px] text-[#F5F1EA] focus:border-[#8B6B4B] focus:outline-none appearance-none"
                  >
                    {TYPOLOGY_OPTIONS.map(t => (
                      <option key={t} value={t} className="bg-[#111111]">{t}</option>
                    ))}
                  </select>
                </div>

                {/* Price range */}
                <div>
                  <label className="text-[9px] tracking-[0.15em] uppercase text-[#D8D1C8]/40 block mb-1.5">Rango de precio</label>
                  <input
                    type="text"
                    value={selectedApt.priceRange}
                    onChange={(e) => updateApartment('priceRange', e.target.value)}
                    placeholder="$230M – $310M"
                    className="w-full bg-transparent border border-[#D8D1C8]/15 px-3 py-2 text-[12px] text-[#F5F1EA] focus:border-[#8B6B4B] focus:outline-none transition-colors"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="text-[9px] tracking-[0.15em] uppercase text-[#D8D1C8]/40 block mb-1.5">Estado</label>
                  <select
                    value={selectedApt.status}
                    onChange={(e) => updateApartment('status', e.target.value)}
                    className="w-full bg-transparent border border-[#D8D1C8]/15 px-3 py-2 text-[12px] text-[#F5F1EA] focus:border-[#8B6B4B] focus:outline-none appearance-none"
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s} className="bg-[#111111]">{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </div>

                {/* View */}
                <div>
                  <label className="text-[9px] tracking-[0.15em] uppercase text-[#D8D1C8]/40 block mb-1.5">Vista</label>
                  <select
                    value={selectedApt.view}
                    onChange={(e) => updateApartment('view', e.target.value)}
                    className="w-full bg-transparent border border-[#D8D1C8]/15 px-3 py-2 text-[12px] text-[#F5F1EA] focus:border-[#8B6B4B] focus:outline-none appearance-none"
                  >
                    {VIEW_OPTIONS.map(v => (
                      <option key={v} value={v} className="bg-[#111111]">{v}</option>
                    ))}
                  </select>
                </div>

                {/* Polygon info */}
                <div className="border-t border-[#D8D1C8]/10 pt-3">
                  <p className="text-[9px] tracking-[0.15em] uppercase text-[#D8D1C8]/30 mb-2">Polígono</p>
                  <p className="text-[10px] text-[#D8D1C8]/40">
                    {selectedApt.polygon.length} vértices
                  </p>
                  <div className="mt-2 max-h-24 overflow-y-auto custom-scrollbar">
                    {selectedApt.polygon.map((pt, i) => (
                      <div key={i} className="flex items-center gap-2 text-[9px] text-[#D8D1C8]/25">
                        <span className="w-4">V{i + 1}</span>
                        <span>({pt[0].toFixed(1)}, {pt[1].toFixed(1)})</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Save button */}
                <button
                  onClick={() => void saveConfig(config)}
                  disabled={saving}
                  className="w-full text-[10px] tracking-[0.2em] uppercase bg-[#8B6B4B] text-[#F5F1EA] py-2.5 hover:bg-[#7A5C3E] transition-colors disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="w-[1px] h-10 bg-[#8B6B4B]/20 mx-auto mb-4" />
                  <p className="text-[10px] text-[#D8D1C8]/30 tracking-[0.15em] uppercase mb-1">
                    Selecciona un apartamento
                  </p>
                  <p className="text-[9px] text-[#D8D1C8]/15">
                    {mode === 'draw'
                      ? 'Dibuja un polígono para crear uno'
                      : 'Haz clic en un polígono para editarlo'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom scrollbar style */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #111111; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #8B6B4B33; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #8B6B4B66; }
      `}</style>
    </div>
  )
}
