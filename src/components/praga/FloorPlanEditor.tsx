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
  RotateCw,
  RotateCcw,
  Copy,
  Check,
  Image as ImageIcon,
} from 'lucide-react'
import ConfirmDialog from './ConfirmDialog'

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

const TYPOLOGY_OPTIONS = ['78.51 m²', '60 m²', '104 m²', '34.28 m²', '35.6 m²', '35.8 m²', '33.75 m²', '33.05 m²']
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
  const [rotating, setRotating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Duplicate floor config modal state
  const [showDuplicate, setShowDuplicate] = useState(false)
  const [dupOptions, setDupOptions] = useState({
    copyImage: true,
    copyApartments: true,
    targetFloorIds: [] as string[],
  })
  const [duplicating, setDuplicating] = useState(false)

  // Add floor modal state (replaces prompt())
  const [showAddFloor, setShowAddFloor] = useState(false)
  const [newFloorData, setNewFloorData] = useState({ name: '', isResidential: false })

  // Renders editor modal state
  const [showRenders, setShowRenders] = useState(false)
  const [typologyRenders, setTypologyRenders] = useState<Record<string, string[]>>({})
  const [selectedTypology, setSelectedTypology] = useState<string>('78.51 m²')
  const [renderFileInput, setRenderFileInput] = useState<HTMLInputElement | null>(null)
  const [uploadingRender, setUploadingRender] = useState(false)
  const TYPOLOGY_OPTIONS_LIST = ['78.51 m²', '60 m²', '104 m²', '34.28 m²', '35.6 m²', '35.8 m²', '33.75 m²', '33.05 m²']

  // Confirm dialog state (replaces confirm())
  const [confirmState, setConfirmState] = useState<{
    open: boolean
    title: string
    message: string
    confirmLabel?: string
    variant?: 'danger' | 'warning' | 'info'
    onConfirm: () => void
  }>({ open: false, title: '', message: '', onConfirm: () => {} })

  const askConfirm = useCallback((
    title: string,
    message: string,
    onConfirm: () => void,
    options?: { confirmLabel?: string; variant?: 'danger' | 'warning' | 'info' }
  ) => {
    setConfirmState({
      open: true,
      title,
      message,
      onConfirm,
      confirmLabel: options?.confirmLabel,
      variant: options?.variant || 'warning',
    })
  }, [])

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
      // Resize image client-side to avoid Vercel 4.5MB body limit (HTTP 413)
      const { resizeImageForUpload } = await import('@/lib/image-resize')
      const resizedFile = await resizeImageForUpload(file)

      const formData = new FormData()
      formData.append('file', resizedFile)
      formData.append('category', 'floor-plans')
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json().catch(() => ({}))

      if (!res.ok || !data.url) {
        throw new Error(data.error || `HTTP ${res.status}`)
      }

      const newConfig = { ...config }
      newConfig.floors = newConfig.floors.map((f, i) =>
        i === selectedFloorIndex ? { ...f, image: data.url } : f
      )
      setConfig(newConfig)
      void saveConfig(newConfig)
      setToast(`Imagen subida: ${resizedFile.name}`)
    } catch (err) {
      console.error('[floor-editor] upload error:', err)
      setToast(`Error: ${err instanceof Error ? err.message : 'falló la subida'}`)
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [config, currentFloor, selectedFloorIndex, saveConfig])

  // ═══ IMAGE ROTATION ═══
  // Rotates the current floor's image 90° (clockwise or counter-clockwise).
  // Downloads the current image, rotates it client-side via Canvas, uploads
  // the rotated version, and updates the floor config with the new URL.
  const handleRotateImage = useCallback(async (direction: 90 | -90) => {
    if (!currentFloor?.image) {
      setToast('No hay imagen para rotar')
      return
    }

    setRotating(true)
    try {
      // Download the current image as a File
      const response = await fetch(currentFloor.image)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const blob = await response.blob()
      const filename = currentFloor.image.split('/').pop() || 'image.jpg'
      const file = new File([blob], filename, { type: blob.type })

      // Rotate client-side
      const { rotateImage } = await import('@/lib/image-resize')
      const rotatedFile = await rotateImage(file, direction)

      // Upload the rotated image
      const formData = new FormData()
      formData.append('file', rotatedFile)
      formData.append('category', 'floor-plans')
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
      const uploadData = await uploadRes.json().catch(() => ({}))

      if (!uploadRes.ok || !uploadData.url) {
        throw new Error(uploadData.error || `HTTP ${uploadRes.status}`)
      }

      // Update the floor with the new image URL
      const newConfig = { ...config }
      newConfig.floors = newConfig.floors.map((f, i) =>
        i === selectedFloorIndex ? { ...f, image: uploadData.url } : f
      )
      setConfig(newConfig)
      void saveConfig(newConfig)
      setToast(`Imagen rotada ${direction > 0 ? '→' : '←'} 90°`)
    } catch (err) {
      console.error('[floor-editor] rotate error:', err)
      setToast(`Error al rotar: ${err instanceof Error ? err.message : 'falló'}`)
    }
    setRotating(false)
  }, [config, currentFloor, selectedFloorIndex, saveConfig])

  // ═══ DUPLICATE FLOOR CONFIG ═══
  // Copies the current floor's image and/or apartments to other floors.
  // Opens a modal where the user selects what to copy and target floors.
  const handleDuplicateConfig = useCallback(async () => {
    if (!currentFloor) return
    if (dupOptions.targetFloorIds.length === 0) {
      setToast('Selecciona al menos un piso destino')
      return
    }
    if (!dupOptions.copyImage && !dupOptions.copyApartments) {
      setToast('Selecciona qué copiar (imagen o apartamentos)')
      return
    }

    setDuplicating(true)
    try {
      const newConfig = { ...config }
      const sourceFloor = currentFloor
      let updatedCount = 0

      newConfig.floors = newConfig.floors.map((f) => {
        if (!dupOptions.targetFloorIds.includes(f.id)) return f
        if (f.id === sourceFloor.id) return f // don't copy to self

        const updates: Partial<FloorConfig> = { ...f }
        if (dupOptions.copyImage) {
          updates.image = sourceFloor.image
        }
        if (dupOptions.copyApartments) {
          // Clone apartments with new IDs and adjust names with target floor number
          const targetFloorNum = parseInt(f.id.replace('piso-', ''))
          updates.apartments = sourceFloor.apartments.map((apt, idx) => {
            const newApt: ApartmentZone = {
              ...apt,
              id: generateId(),
              // Rename: "Apto 101" → "Apto 201" if copying from Piso 1 to Piso 2
              name: apt.name.replace(
                /Apto\s+(\d+)0(\d+)/i,
                (_, floorPart, unitPart) => `Apto ${targetFloorNum}${unitPart}`
              ) || apt.name,
            }
            return newApt
          })
        }
        updatedCount++
        return updates as FloorConfig
      })

      setConfig(newConfig)
      void saveConfig(newConfig)
      setShowDuplicate(false)
      setDupOptions({ copyImage: true, copyApartments: true, targetFloorIds: [] })
      setToast(`Configuración duplicada a ${updatedCount} piso(s)`)
    } catch (err) {
      console.error('[floor-editor] duplicate error:', err)
      setToast('Error al duplicar configuración')
    }
    setDuplicating(false)
  }, [config, currentFloor, dupOptions, saveConfig])

  // ═══ FLOOR MANAGEMENT ═══
  const addFloor = useCallback(() => {
    // Open modal instead of prompt()
    setNewFloorData({ name: '', isResidential: false })
    setShowAddFloor(true)
  }, [])

  // ═══ RENDER MANAGEMENT ═══
  // Loads typology renders from site_config when the renders modal opens
  const openRendersModal = useCallback(async () => {
    try {
      const res = await fetch('/api/site-config')
      if (res.ok) {
        const data = await res.json()
        const renders = (data.typology_renders || {}) as Record<string, string[]>
        setTypologyRenders(renders)
      }
    } catch (err) {
      console.error('[floor-editor] load renders error:', err)
      setToast('Error al cargar renders')
    }
    setShowRenders(true)
  }, [])

  // Upload a new render for the selected typology
  const handleRenderUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingRender(true)
    try {
      const { resizeImageForUpload } = await import('@/lib/image-resize')
      const resizedFile = await resizeImageForUpload(file)
      const formData = new FormData()
      formData.append('file', resizedFile)
      formData.append('category', 'renders')
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.url) throw new Error(data.error || `HTTP ${res.status}`)

      // Add to typologyRenders state
      const updated = { ...typologyRenders }
      if (!updated[selectedTypology]) updated[selectedTypology] = []
      updated[selectedTypology] = [...updated[selectedTypology], data.url]
      setTypologyRenders(updated)
      setToast(`Render agregado a ${selectedTypology}`)
    } catch (err) {
      console.error('[floor-editor] render upload error:', err)
      setToast(`Error: ${err instanceof Error ? err.message : 'falló la subida'}`)
    }
    setUploadingRender(false)
    if (e.target) e.target.value = ''
  }, [typologyRenders, selectedTypology])

  // Remove a render from a typology
  const removeRender = useCallback((typology: string, index: number) => {
    const updated = { ...typologyRenders }
    if (updated[typology]) {
      updated[typology] = updated[typology].filter((_, i) => i !== index)
      if (updated[typology].length === 0) delete updated[typology]
      setTypologyRenders(updated)
    }
  }, [typologyRenders])

  // Save renders to site_config
  const saveRenders = useCallback(async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/site-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _section: 'typology_renders', _data: typologyRenders }),
      })
      if (res.ok) {
        setToast('Renders guardados ✓')
        setShowRenders(false)
      } else {
        setToast('Error al guardar renders')
      }
    } catch (err) {
      console.error('[floor-editor] save renders error:', err)
      setToast('Error de conexión')
    }
    setSaving(false)
  }, [typologyRenders])

  const createFloor = useCallback(() => {
    const name = newFloorData.name.trim()
    if (!name) {
      setToast('El nombre es obligatorio')
      return
    }
    const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const newFloor: FloorConfig = {
      id: id || generateId(),
      name,
      typeLabel: newFloorData.isResidential ? 'Residencial' : 'Áreas Comunes',
      isResidential: newFloorData.isResidential,
      image: '',
      apartments: [],
    }
    const newConfig = { ...config, floors: [...config.floors, newFloor] }
    setConfig(newConfig)
    setSelectedFloorIndex(newConfig.floors.length - 1)
    void saveConfig(newConfig)
    setShowAddFloor(false)
    setToast(`Nivel creado: ${name}`)
  }, [config, newFloorData, saveConfig])

  const deleteFloor = useCallback((index: number) => {
    const floorName = config.floors[index]?.name || 'este nivel'
    askConfirm(
      'Eliminar nivel',
      `¿Eliminar "${floorName}"? Esta acción no se puede deshacer. Se eliminarán también ${config.floors[index]?.apartments.length || 0} apartamento(s) asociado(s).`,
      () => {
        const newConfig = { ...config, floors: config.floors.filter((_, i) => i !== index) }
        setConfig(newConfig)
        if (selectedFloorIndex >= newConfig.floors.length) {
          setSelectedFloorIndex(Math.max(0, newConfig.floors.length - 1))
        }
        setSelectedAptId(null)
        void saveConfig(newConfig)
        setToast(`Nivel eliminado: ${floorName}`)
      },
      { confirmLabel: 'Eliminar', variant: 'danger' }
    )
  }, [config, selectedFloorIndex, saveConfig, askConfirm])

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
            typology: '33.75 m²',
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
    // Auto-save with debounce is handled by the useEffect below
  }, [selectedAptId, currentFloor, config, selectedFloorIndex])

  // Track whether config has changed from what was last saved.
  // This prevents the auto-save effect from firing on every render due to
  // reference changes (config is a new object on every setConfig call).
  const lastSavedConfigRef = useRef<string>('')
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (loading || config.floors.length === 0) return

    // Serialize config to compare; only save if it actually changed
    const configJson = JSON.stringify(config)
    if (configJson === lastSavedConfigRef.current) return
    // Don't save the very first time (initial load sets config)
    if (lastSavedConfigRef.current === '' ) {
      lastSavedConfigRef.current = configJson
      return
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      void saveConfig(config)
      lastSavedConfigRef.current = JSON.stringify(config)
    }, 1500)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [config, loading, saveConfig])

  const deleteApartment = useCallback(() => {
    if (!selectedAptId) return
    const aptName = currentFloor?.apartments.find(a => a.id === selectedAptId)?.name || 'este apartamento'
    askConfirm(
      'Eliminar apartamento',
      `¿Eliminar "${aptName}"? Esta acción no se puede deshacer.`,
      () => {
        const newConfig = { ...config }
        newConfig.floors = newConfig.floors.map((f, i) => {
          if (i !== selectedFloorIndex) return f
          return { ...f, apartments: f.apartments.filter(a => a.id !== selectedAptId) }
        })
        setConfig(newConfig)
        setSelectedAptId(null)
        void saveConfig(newConfig)
        setToast(`Apartamento eliminado: ${aptName}`)
      },
      { confirmLabel: 'Eliminar', variant: 'danger' }
    )
  }, [selectedAptId, config, selectedFloorIndex, saveConfig, askConfirm, currentFloor])

  // ═══ CANCEL DRAWING ═══
  const cancelDrawing = useCallback(() => {
    setDrawingPoints([])
    setMode('select')
  }, [])

  // ═══ KEYBOARD SHORTCUTS ═══
  // ESC: cancel drawing | Delete/Backspace: delete selected apt | Arrow Up/Down: navigate apts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea/select
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return

      if (e.key === 'Escape') {
        if (mode === 'draw') {
          cancelDrawing()
          setToast('Dibujo cancelado')
        } else if (selectedAptId) {
          setSelectedAptId(null)
        }
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedAptId && mode === 'select') {
        e.preventDefault()
        deleteApartment()
      } else if (e.key === 'd' || e.key === 'D') {
        if (mode === 'select') {
          setMode('draw')
          setSelectedAptId(null)
        }
      } else if (e.key === 's' || e.key === 'S') {
        if (mode === 'draw') {
          setMode('select')
          setDrawingPoints([])
        }
      } else if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && currentFloor && mode === 'select') {
        e.preventDefault()
        const apts = currentFloor.apartments
        if (apts.length === 0) return
        const currentIdx = apts.findIndex(a => a.id === selectedAptId)
        let nextIdx: number
        if (currentIdx === -1) {
          nextIdx = 0
        } else if (e.key === 'ArrowDown') {
          nextIdx = (currentIdx + 1) % apts.length
        } else {
          nextIdx = (currentIdx - 1 + apts.length) % apts.length
        }
        setSelectedAptId(apts[nextIdx].id)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [mode, selectedAptId, currentFloor, cancelDrawing, deleteApartment])

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
                  unoptimized
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
          <p>2. Activa el modo <strong className="text-[#F5F1EA]">Dibujar</strong> (tecla <kbd className="bg-[#0A0A0A] px-1 border border-[#D8D1C8]/10">D</kbd>) y haz clic sobre la imagen para definir los vértices</p>
          <p>3. Haz doble clic o haz clic cerca del primer punto para cerrar el polígono</p>
          <p>4. En modo <strong className="text-[#F5F1EA]">Seleccionar</strong> (tecla <kbd className="bg-[#0A0A0A] px-1 border border-[#D8D1C8]/10">S</kbd>), haz clic en un polígono para editar sus datos</p>
          <p>5. Arrastra los vértices para ajustar la forma del polígono</p>
          <p>6. Usa <kbd className="bg-[#0A0A0A] px-1 border border-[#D8D1C8]/10">↑↓</kbd> para navegar entre apartamentos del piso actual</p>
          <p>7. <kbd className="bg-[#0A0A0A] px-1 border border-[#D8D1C8]/10">ESC</kbd> cancela el dibujo · <kbd className="bg-[#0A0A0A] px-1 border border-[#D8D1C8]/10">Del</kbd> elimina el apartamento seleccionado</p>
          <p>8. Los cambios se guardan automáticamente 1.5s después de editar</p>
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
                  title="Subir nueva imagen"
                >
                  <Upload className="w-3 h-3" /> {uploading ? 'Subiendo...' : 'Subir Imagen'}
                </button>
                {/* Rotate buttons — only show when there's an image */}
                {currentFloor?.image && (
                  <>
                    <button
                      onClick={() => void handleRotateImage(-90)}
                      disabled={rotating || uploading}
                      className="flex items-center gap-1.5 text-[10px] tracking-wider uppercase border border-[#D8D1C8]/15 text-[#D8D1C8]/40 px-2.5 py-1.5 hover:text-[#8B6B4B] hover:border-[#8B6B4B]/30 transition-colors disabled:opacity-50"
                      title="Rotar 90° a la izquierda"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => void handleRotateImage(90)}
                      disabled={rotating || uploading}
                      className="flex items-center gap-1.5 text-[10px] tracking-wider uppercase border border-[#D8D1C8]/15 text-[#D8D1C8]/40 px-2.5 py-1.5 hover:text-[#8B6B4B] hover:border-[#8B6B4B]/30 transition-colors disabled:opacity-50"
                      title="Rotar 90° a la derecha"
                    >
                      <RotateCw className="w-3 h-3" />
                    </button>
                    {rotating && (
                      <span className="text-[9px] text-[#8B6B4B]/60 tracking-wider uppercase">
                        Rotando...
                      </span>
                    )}
                  </>
                )}
                {/* Duplicate config button — only show for residential floors */}
                {currentFloor?.isResidential && (
                  <button
                    onClick={() => setShowDuplicate(true)}
                    disabled={duplicating || uploading}
                    className="flex items-center gap-1.5 text-[10px] tracking-wider uppercase border border-[#8B6B4B]/30 text-[#8B6B4B] px-3 py-1.5 hover:bg-[#8B6B4B]/10 transition-colors disabled:opacity-50"
                    title="Duplicar imagen y/o apartamentos a otros pisos"
                  >
                    <Copy className="w-3 h-3" /> Duplicar
                  </button>
                )}
                {/* Renders editor button — always available */}
                <button
                  onClick={() => void openRendersModal()}
                  disabled={uploading}
                  className="flex items-center gap-1.5 text-[10px] tracking-wider uppercase border border-[#D8D1C8]/15 text-[#D8D1C8]/40 px-3 py-1.5 hover:text-[#8B6B4B] hover:border-[#8B6B4B]/30 transition-colors disabled:opacity-50"
                  title="Gestionar renders por tipología"
                >
                  <ImageIcon className="w-3 h-3" /> Renders
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
                    unoptimized
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
          <div className="bg-[#111111] border border-[#D8D1C8]/5 p-4 min-h-[400px] max-h-[700px] overflow-y-auto custom-scrollbar">
            {/* Apartment list (always visible when floor has apts) */}
            {currentFloor && currentFloor.apartments.length > 0 && (
              <div className="mb-4 pb-4 border-b border-[#D8D1C8]/10">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[9px] tracking-[0.15em] uppercase text-[#8B6B4B]">
                    Apartamentos ({currentFloor.apartments.length})
                  </p>
                  <span className="text-[8px] text-[#D8D1C8]/20">↑↓ navegar</span>
                </div>
                <div className="space-y-0.5 max-h-32 overflow-y-auto custom-scrollbar">
                  {currentFloor.apartments.map((apt, idx) => {
                    const isSelected = apt.id === selectedAptId
                    const colors = STATUS_COLORS[apt.status] || STATUS_COLORS.available
                    return (
                      <button
                        key={apt.id}
                        onClick={() => { setSelectedAptId(apt.id); setMode('select') }}
                        className={`w-full text-left flex items-center gap-2 py-1.5 px-2 border-l-2 transition-all ${
                          isSelected
                            ? 'border-l-[#8B6B4B] bg-[#8B6B4B]/10'
                            : 'border-l-transparent hover:border-l-[#8B6B4B]/30 hover:bg-[#1A1A1A]'
                        }`}
                      >
                        <div
                          className="w-2 h-2 flex-shrink-0"
                          style={{ backgroundColor: colors.fill, opacity: 0.7 }}
                        />
                        <span className={`text-[10px] flex-1 truncate ${isSelected ? 'text-[#8B6B4B]' : 'text-[#D8D1C8]/50'}`}>
                          {apt.name}
                        </span>
                        <span className="text-[8px] text-[#D8D1C8]/30 flex-shrink-0">
                          {apt.area > 0 ? `${apt.area}m²` : '—'}
                        </span>
                        <span className="text-[8px] text-[#D8D1C8]/20 flex-shrink-0">
                          {idx + 1}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {selectedApt ? (
              <div className="space-y-4">
                {/* Status badge + actions */}
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
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        // Duplicate apartment with offset polygon
                        if (!currentFloor) return
                        const offset = selectedApt.polygon.map(([x, y]) => [x + 2, y + 2] as number[])
                        const newApt: ApartmentZone = {
                          ...selectedApt,
                          id: generateId(),
                          name: `${selectedApt.name} (copia)`,
                          polygon: offset,
                        }
                        const newConfig = { ...config }
                        newConfig.floors = newConfig.floors.map((f, i) =>
                          i === selectedFloorIndex
                            ? { ...f, apartments: [...f.apartments, newApt] }
                            : f
                        )
                        setConfig(newConfig)
                        setSelectedAptId(newApt.id)
                        void saveConfig(newConfig)
                        setToast('Apartamento duplicado')
                      }}
                      className="text-[#D8D1C8]/20 hover:text-[#8B6B4B] transition-colors"
                      title="Duplicar apartamento"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={deleteApartment}
                      className="text-[#D8D1C8]/20 hover:text-red-400 transition-colors"
                      title="Eliminar apartamento (Delete)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
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
                      : 'Haz clic en un polígono o usa ↑↓'}
                  </p>
                  <div className="mt-4 pt-4 border-t border-[#D8D1C8]/10 text-[8px] text-[#D8D1C8]/20 space-y-1">
                    <p><kbd className="bg-[#0A0A0A] px-1 py-0.5 border border-[#D8D1C8]/10">D</kbd> dibujar · <kbd className="bg-[#0A0A0A] px-1 py-0.5 border border-[#D8D1C8]/10">S</kbd> seleccionar</p>
                    <p><kbd className="bg-[#0A0A0A] px-1 py-0.5 border border-[#D8D1C8]/10">ESC</kbd> cancelar · <kbd className="bg-[#0A0A0A] px-1 py-0.5 border border-[#D8D1C8]/10">Del</kbd> eliminar</p>
                    <p><kbd className="bg-[#0A0A0A] px-1 py-0.5 border border-[#D8D1C8]/10">↑↓</kbd> navegar apartamentos</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Duplicate config modal */}
      {showDuplicate && currentFloor && (
        <div
          className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center p-4"
          onClick={() => !duplicating && setShowDuplicate(false)}
        >
          <div
            className="bg-[#111111] border border-[#8B6B4B]/30 max-w-md w-full max-h-[90vh] overflow-y-auto custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#D8D1C8]/10">
              <div className="flex items-center gap-3">
                <Copy className="w-5 h-5 text-[#8B6B4B]" />
                <div>
                  <h3 className="font-[family-name:var(--font-cormorant)] text-xl text-[#F5F1EA]">
                    Duplicar Configuración
                  </h3>
                  <p className="text-[9px] text-[#D8D1C8]/40 tracking-wider uppercase mt-0.5">
                    Origen: {currentFloor.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => !duplicating && setShowDuplicate(false)}
                disabled={duplicating}
                className="text-[#D8D1C8]/40 hover:text-[#D8D1C8] transition-colors disabled:opacity-30"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-5">
              {/* What to copy */}
              <div>
                <p className="text-[9px] tracking-[0.15em] uppercase text-[#8B6B4B] mb-3">¿Qué copiar?</p>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 border flex items-center justify-center transition-colors ${dupOptions.copyImage ? 'bg-[#8B6B4B] border-[#8B6B4B]' : 'border-[#D8D1C8]/20 group-hover:border-[#8B6B4B]/50'}`}>
                      {dupOptions.copyImage && <Check className="w-3 h-3 text-[#F5F1EA]" />}
                    </div>
                    <input
                      type="checkbox"
                      checked={dupOptions.copyImage}
                      onChange={(e) => setDupOptions({ ...dupOptions, copyImage: e.target.checked })}
                      className="sr-only"
                    />
                    <div>
                      <p className="text-[11px] text-[#F5F1EA]">Imagen de la planta</p>
                      <p className="text-[9px] text-[#D8D1C8]/30">Copia la imagen de fondo del piso</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 border flex items-center justify-center transition-colors ${dupOptions.copyApartments ? 'bg-[#8B6B4B] border-[#8B6B4B]' : 'border-[#D8D1C8]/20 group-hover:border-[#8B6B4B]/50'}`}>
                      {dupOptions.copyApartments && <Check className="w-3 h-3 text-[#F5F1EA]" />}
                    </div>
                    <input
                      type="checkbox"
                      checked={dupOptions.copyApartments}
                      onChange={(e) => setDupOptions({ ...dupOptions, copyApartments: e.target.checked })}
                      className="sr-only"
                    />
                    <div>
                      <p className="text-[11px] text-[#F5F1EA]">Apartamentos (polígonos + datos)</p>
                      <p className="text-[9px] text-[#D8D1C8]/30">
                        {currentFloor.apartments.length} apartamentos con polígonos, áreas, tipologías, precios
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Target floors */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[9px] tracking-[0.15em] uppercase text-[#8B6B4B]">Pisos destino</p>
                  <button
                    onClick={() => {
                      const allResidential = config.floors.filter(f => f.isResidential && f.id !== currentFloor.id)
                      const allIds = allResidential.map(f => f.id)
                      setDupOptions({
                        ...dupOptions,
                        targetFloorIds: dupOptions.targetFloorIds.length === allIds.length ? [] : allIds,
                      })
                    }}
                    className="text-[9px] tracking-wider uppercase text-[#D8D1C8]/40 hover:text-[#8B6B4B] transition-colors"
                  >
                    {(() => {
                      const allResidential = config.floors.filter(f => f.isResidential && f.id !== currentFloor.id)
                      return dupOptions.targetFloorIds.length === allResidential.length ? 'Quitar todos' : 'Seleccionar todos'
                    })()}
                  </button>
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                  {config.floors
                    .filter(f => f.isResidential && f.id !== currentFloor.id)
                    .map((f) => {
                      const isSelected = dupOptions.targetFloorIds.includes(f.id)
                      return (
                        <label
                          key={f.id}
                          className="flex items-center gap-3 cursor-pointer py-2 px-2 hover:bg-[#1A1A1A] transition-colors"
                        >
                          <div className={`w-4 h-4 border flex items-center justify-center transition-colors ${isSelected ? 'bg-[#8B6B4B] border-[#8B6B4B]' : 'border-[#D8D1C8]/20'}`}>
                            {isSelected && <Check className="w-2.5 h-2.5 text-[#F5F1EA]" />}
                          </div>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setDupOptions({ ...dupOptions, targetFloorIds: [...dupOptions.targetFloorIds, f.id] })
                              } else {
                                setDupOptions({ ...dupOptions, targetFloorIds: dupOptions.targetFloorIds.filter(id => id !== f.id) })
                              }
                            }}
                            className="sr-only"
                          />
                          <span className={`text-[11px] ${isSelected ? 'text-[#8B6B4B]' : 'text-[#D8D1C8]/60'}`}>
                            {f.name}
                          </span>
                          <span className="text-[9px] text-[#D8D1C8]/30 ml-auto">
                            {f.apartments.length} aptos · {f.image ? '📷' : 'sin img'}
                          </span>
                        </label>
                      )
                    })}
                </div>
              </div>

              {/* Warning */}
              {dupOptions.targetFloorIds.length > 0 && (
                <div className="bg-[#8B6B4B]/10 border border-[#8B6B4B]/20 p-3">
                  <p className="text-[10px] text-[#D8D1C8]/60 leading-relaxed">
                    ⚠️ <strong className="text-[#F5F1EA]">Atención:</strong> Esto reemplazará{' '}
                    {dupOptions.copyImage && 'la imagen'}
                    {dupOptions.copyImage && dupOptions.copyApartments && ' y '}
                    {dupOptions.copyApartments && 'los apartamentos'} existentes en los{' '}
                    {dupOptions.targetFloorIds.length} piso(s) seleccionado(s).
                    {dupOptions.copyApartments && ' Los apartamentos se clonarán con nuevos IDs y nombres ajustados al piso destino (ej: "Apto 101" → "Apto 201").'}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-5 border-t border-[#D8D1C8]/10">
              <button
                onClick={() => setShowDuplicate(false)}
                disabled={duplicating}
                className="text-[10px] tracking-wider uppercase border border-[#D8D1C8]/15 text-[#D8D1C8]/40 px-4 py-2.5 hover:text-[#D8D1C8] transition-colors disabled:opacity-30"
              >
                Cancelar
              </button>
              <button
                onClick={() => void handleDuplicateConfig()}
                disabled={duplicating || dupOptions.targetFloorIds.length === 0 || (!dupOptions.copyImage && !dupOptions.copyApartments)}
                className="flex items-center gap-1.5 text-[10px] tracking-wider uppercase bg-[#8B6B4B] text-[#F5F1EA] px-5 py-2.5 hover:bg-[#7A5C3E] transition-colors disabled:opacity-50"
              >
                {duplicating ? (
                  <>
                    <div className="w-3 h-3 border border-[#F5F1EA] border-t-transparent rounded-full animate-spin" />
                    Duplicando...
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Duplicar a {dupOptions.targetFloorIds.length} piso(s)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add floor modal (replaces prompt) */}
      {showAddFloor && (
        <div
          className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center p-4"
          onClick={() => setShowAddFloor(false)}
        >
          <div
            className="bg-[#111111] border border-[#8B6B4B]/30 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-[#D8D1C8]/10">
              <div className="flex items-center gap-3">
                <Plus className="w-5 h-5 text-[#8B6B4B]" />
                <h3 className="font-[family-name:var(--font-cormorant)] text-xl text-[#F5F1EA]">
                  Nuevo Nivel
                </h3>
              </div>
              <button
                onClick={() => setShowAddFloor(false)}
                className="text-[#D8D1C8]/40 hover:text-[#D8D1C8] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-[9px] tracking-[0.15em] uppercase text-[#D8D1C8]/40 block mb-1.5">Nombre del nivel</label>
                <input
                  type="text"
                  value={newFloorData.name}
                  onChange={(e) => setNewFloorData({ ...newFloorData, name: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && createFloor()}
                  autoFocus
                  placeholder="Ej: Piso 12, Azotea, Mezzanine..."
                  className="w-full bg-transparent border border-[#D8D1C8]/15 px-3 py-2.5 text-[12px] text-[#F5F1EA] focus:border-[#8B6B4B] focus:outline-none transition-colors"
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-5 h-5 border flex items-center justify-center transition-colors ${newFloorData.isResidential ? 'bg-[#8B6B4B] border-[#8B6B4B]' : 'border-[#D8D1C8]/20 group-hover:border-[#8B6B4B]/50'}`}>
                  {newFloorData.isResidential && <Check className="w-3 h-3 text-[#F5F1EA]" />}
                </div>
                <input
                  type="checkbox"
                  checked={newFloorData.isResidential}
                  onChange={(e) => setNewFloorData({ ...newFloorData, isResidential: e.target.checked })}
                  className="sr-only"
                />
                <div>
                  <p className="text-[11px] text-[#F5F1EA]">Es residencial</p>
                  <p className="text-[9px] text-[#D8D1C8]/30">Marcar si tendrá apartamentos con polígonos</p>
                </div>
              </label>
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-[#D8D1C8]/10">
              <button
                onClick={() => setShowAddFloor(false)}
                className="text-[10px] tracking-wider uppercase border border-[#D8D1C8]/15 text-[#D8D1C8]/40 px-4 py-2.5 hover:text-[#D8D1C8] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={createFloor}
                disabled={!newFloorData.name.trim()}
                className="flex items-center gap-1.5 text-[10px] tracking-wider uppercase bg-[#8B6B4B] text-[#F5F1EA] px-5 py-2.5 hover:bg-[#7A5C3E] transition-colors disabled:opacity-50"
              >
                <Plus className="w-3 h-3" /> Crear Nivel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm dialog (replaces confirm()) */}
      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel}
        variant={confirmState.variant}
        onConfirm={() => {
          confirmState.onConfirm()
          setConfirmState({ ...confirmState, open: false })
        }}
        onCancel={() => setConfirmState({ ...confirmState, open: false })}
      />

      {/* Renders editor modal */}
      {showRenders && (
        <div
          className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center p-4"
          onClick={() => !saving && setShowRenders(false)}
        >
          <div
            className="bg-[#111111] border border-[#8B6B4B]/30 max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#D8D1C8]/10 sticky top-0 bg-[#111111] z-10">
              <div className="flex items-center gap-3">
                <ImageIcon className="w-5 h-5 text-[#8B6B4B]" />
                <div>
                  <h3 className="font-[family-name:var(--font-cormorant)] text-xl text-[#F5F1EA]">
                    Renders por Tipología
                  </h3>
                  <p className="text-[9px] text-[#D8D1C8]/40 tracking-wider uppercase mt-0.5">
                    Gestiona los renders que se muestran al hacer clic en un apartamento
                  </p>
                </div>
              </div>
              <button
                onClick={() => !saving && setShowRenders(false)}
                disabled={saving}
                className="text-[#D8D1C8]/40 hover:text-[#D8D1C8] transition-colors disabled:opacity-30"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {/* Typology selector tabs */}
              <div className="flex gap-1 flex-wrap">
                {TYPOLOGY_OPTIONS_LIST.map((typ) => {
                  const count = typologyRenders[typ]?.length || 0
                  return (
                    <button
                      key={typ}
                      onClick={() => setSelectedTypology(typ)}
                      className={`px-4 py-2 text-[10px] tracking-[0.1em] uppercase whitespace-nowrap transition-all ${
                        selectedTypology === typ
                          ? 'bg-[#8B6B4B] text-[#F5F1EA]'
                          : 'bg-[#0A0A0A] text-[#D8D1C8]/40 border border-[#D8D1C8]/10 hover:text-[#D8D1C8]/60 hover:border-[#8B6B4B]/30'
                      }`}
                    >
                      {typ} ({count})
                    </button>
                  )
                })}
              </div>

              {/* Upload button */}
              <div className="flex items-center gap-3">
                <input
                  ref={(el) => setRenderFileInput(el)}
                  type="file"
                  accept="image/*"
                  onChange={(e) => void handleRenderUpload(e)}
                  className="hidden"
                />
                <button
                  onClick={() => renderFileInput?.click()}
                  disabled={uploadingRender}
                  className="flex items-center gap-1.5 text-[10px] tracking-wider uppercase bg-[#8B6B4B] text-[#F5F1EA] px-4 py-2 hover:bg-[#7A5C3E] transition-colors disabled:opacity-50"
                >
                  {uploadingRender ? (
                    <div className="w-3 h-3 border border-[#F5F1EA] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload className="w-3 h-3" />
                  )}
                  {uploadingRender ? 'Subiendo...' : `Subir render a ${selectedTypology}`}
                </button>
                <span className="text-[9px] text-[#D8D1C8]/30">
                  Las imágenes se redimensionan automáticamente
                </span>
              </div>

              {/* Current renders grid */}
              <div>
                {typologyRenders[selectedTypology]?.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {typologyRenders[selectedTypology].map((url, i) => (
                      <div key={url + i} className="group relative bg-[#0A0A0A] border border-[#D8D1C8]/5 overflow-hidden">
                        <div className="aspect-[4/3] relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt={`Render ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-2 flex items-center justify-between">
                          <span className="text-[9px] text-[#D8D1C8]/30">Render {i + 1}</span>
                          <button
                            onClick={() => removeRender(selectedTypology, i)}
                            className="text-[#D8D1C8]/20 hover:text-red-400 transition-colors"
                            title="Eliminar render"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#0A0A0A] border border-[#D8D1C8]/5 p-8 text-center">
                    <ImageIcon className="w-8 h-8 text-[#D8D1C8]/15 mx-auto mb-3" />
                    <p className="text-[11px] text-[#D8D1C8]/30">
                      No hay renders para {selectedTypology}
                    </p>
                    <p className="text-[10px] text-[#D8D1C8]/15 mt-1">
                      Sube imágenes usando el botón de arriba
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-5 border-t border-[#D8D1C8]/10 sticky bottom-0 bg-[#111111]">
              <button
                onClick={() => setShowRenders(false)}
                disabled={saving}
                className="text-[10px] tracking-wider uppercase border border-[#D8D1C8]/15 text-[#D8D1C8]/40 px-4 py-2.5 hover:text-[#D8D1C8] transition-colors disabled:opacity-30"
              >
                Cancelar
              </button>
              <button
                onClick={() => void saveRenders()}
                disabled={saving}
                className="flex items-center gap-1.5 text-[10px] tracking-wider uppercase bg-[#8B6B4B] text-[#F5F1EA] px-5 py-2.5 hover:bg-[#7A5C3E] transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <div className="w-3 h-3 border border-[#F5F1EA] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-3 h-3" />
                )}
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

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
