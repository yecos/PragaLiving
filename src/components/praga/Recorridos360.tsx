'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'

/* ──────────────────────────── TYPES ──────────────────────────── */

interface Hotspot {
  id: string
  yaw: number
  pitch: number
  label: string
  description: string
  linkTo?: string
}

interface Space {
  id: string
  name: string
  image: string
  hotspots: Hotspot[]
}

/* ──────────────────────────── DATA ──────────────────────────── */

const spaces: Space[] = [
  {
    id: 'lobby',
    name: 'Lobby',
    image: '/images/renders/lobby.png',
    hotspots: [
      { id: 'lobby-1', yaw: -30, pitch: 5, label: 'Recepción', description: 'Recepción con doble altura y acabados en mármol', linkTo: 'atrio' },
      { id: 'lobby-2', yaw: 45, pitch: -10, label: 'Atrio', description: 'Acceso al Atrio central con vegetación interior', linkTo: 'atrio' },
      { id: 'lobby-3', yaw: -80, pitch: 15, label: 'Ascensores', description: 'Núcleo de ascensores privados con acceso directo' },
      { id: 'lobby-4', yaw: 100, pitch: 0, label: 'Lounge', description: 'Área de espera con fireplace integrado' },
    ],
  },
  {
    id: 'atrio',
    name: 'Atrio',
    image: '/images/renders/atrio-main.png',
    hotspots: [
      { id: 'atrio-1', yaw: 0, pitch: 10, label: 'Jardín Interior', description: 'Jardín vertical con especies nativas' },
      { id: 'atrio-2', yaw: -60, pitch: -5, label: 'Lobby', description: 'Regresar al Lobby principal', linkTo: 'lobby' },
      { id: 'atrio-3', yaw: 70, pitch: 0, label: 'Coworking', description: 'Espacio de trabajo colaborativo', linkTo: 'coworking' },
      { id: 'atrio-4', yaw: 150, pitch: 8, label: 'Vitality Pool', description: 'Piscina de bienestar interior' },
    ],
  },
  {
    id: 'coworking',
    name: 'Coworking',
    image: '/images/renders/coworking.png',
    hotspots: [
      { id: 'cowork-1', yaw: -20, pitch: 5, label: 'Zona de Trabajo', description: 'Estaciones de trabajo con vista panorámica' },
      { id: 'cowork-2', yaw: 60, pitch: -8, label: 'Sala de Juntas', description: 'Salas privadas para reuniones ejecutivas' },
      { id: 'cowork-3', yaw: -100, pitch: 10, label: 'Atrio', description: 'Regresar al Atrio central', linkTo: 'atrio' },
      { id: 'cowork-4', yaw: 130, pitch: 0, label: 'Coffee Station', description: 'Cafetería gourmet para residentes' },
    ],
  },
  {
    id: 'gimnasio',
    name: 'Gimnasio',
    image: '/images/renders/gimnasio.png',
    hotspots: [
      { id: 'gym-1', yaw: 0, pitch: 5, label: 'Zona Cardio', description: 'Equipamiento Technogym de última generación' },
      { id: 'gym-2', yaw: -50, pitch: -5, label: 'Pesas Libres', description: 'Área completa de entrenamiento funcional' },
      { id: 'gym-3', yaw: 80, pitch: 10, label: 'Yoga Studio', description: 'Espacio dedicado a yoga y pilates' },
      { id: 'gym-4', yaw: -130, pitch: 0, label: 'Vestidores', description: 'Vestidores con sauna y vapor' },
    ],
  },
  {
    id: 'salon',
    name: 'Salón Social',
    image: '/images/renders/salon-social.png',
    hotspots: [
      { id: 'salon-1', yaw: 15, pitch: 0, label: 'Terraza', description: 'Terraza con vista al skyline de la ciudad' },
      { id: 'salon-2', yaw: -70, pitch: 5, label: 'Cocina Privada', description: 'Cocina de entretenimiento para eventos privados' },
      { id: 'salon-3', yaw: 90, pitch: -10, label: 'Barra', description: 'Barra integrada con iluminación ambiental' },
      { id: 'salon-4', yaw: -140, pitch: 8, label: 'Cine', description: 'Sala de cine privada para 12 personas' },
    ],
  },
  {
    id: 'studio',
    name: 'Studio',
    image: '/images/renders/studio-33.png',
    hotspots: [
      { id: 'studio-1', yaw: 0, pitch: 5, label: 'Zona Principal', description: 'Espacio abierto con iluminación natural' },
      { id: 'studio-2', yaw: -45, pitch: -8, label: 'Cocina Integrada', description: 'Cocina tipo americana con acabados premium' },
      { id: 'studio-3', yaw: 70, pitch: 10, label: 'Balcón', description: 'Balcón privado con vista urbana' },
    ],
  },
  {
    id: 'apto57',
    name: 'Apto 57 m²',
    image: '/images/renders/apto-57.png',
    hotspots: [
      { id: '57-1', yaw: 10, pitch: 0, label: 'Sala', description: 'Sala con piso porcelanato y ventanales de piso a techo' },
      { id: '57-2', yaw: -55, pitch: -5, label: 'Cocina', description: 'Cocina con isla y acabados en cuarzo' },
      { id: '57-3', yaw: 80, pitch: 8, label: 'Recámara', description: 'Recámara principal con walk-in closet' },
      { id: '57-4', yaw: -120, pitch: 5, label: 'Balcón', description: 'Balcón con vista oriente', linkTo: 'apto74' },
    ],
  },
  {
    id: 'apto74',
    name: 'Apto 74 m²',
    image: '/images/renders/apto-74.png',
    hotspots: [
      { id: '74-1', yaw: -15, pitch: 5, label: 'Sala-Comedor', description: 'Doble ambiente con iluminación natural cruzada' },
      { id: '74-2', yaw: 50, pitch: -8, label: 'Cocina', description: 'Cocina abierta con electrodomésticos Miele' },
      { id: '74-3', yaw: -80, pitch: 10, label: 'Recámara Principal', description: 'Suite con baño completo y vestidor' },
      { id: '74-4', yaw: 120, pitch: 0, label: 'Segunda Recámara', description: 'Recámara con vista al valle', linkTo: 'apto97' },
    ],
  },
  {
    id: 'apto97',
    name: 'Penthouse 97 m²',
    image: '/images/renders/apto-97.png',
    hotspots: [
      { id: '97-1', yaw: 0, pitch: 5, label: 'Gran Sala', description: 'Sala con doble altura y chimenea empotrada' },
      { id: '97-2', yaw: -40, pitch: -10, label: 'Terraza Privada', description: 'Terraza con jacuzzi y vista 360°' },
      { id: '97-3', yaw: 65, pitch: 8, label: 'Master Suite', description: 'Suite principal con baño de mármol' },
      { id: '97-4', yaw: -110, pitch: 0, label: 'Estudio', description: 'Espacio flexible para home office', linkTo: 'studio' },
    ],
  },
]

/* ──────────────────────────── HELPERS ──────────────────────────── */

function clamp(val: number, min: number, max: number) {
  return Math.min(max, Math.max(min, val))
}

function normalizeYaw(yaw: number): number {
  let result = yaw
  while (result > 180) result -= 360
  while (result < -180) result += 360
  return result
}

function hotspotToScreen(yaw: number, pitch: number, viewYaw: number, viewPitch: number, fov: number) {
  const hFov = fov
  const vFov = fov * 0.5625

  const relYaw = normalizeYaw(yaw - viewYaw)
  const relPitch = pitch - viewPitch

  const x = 50 + (relYaw / hFov) * 50
  const y = 50 - (relPitch / vFov) * 50

  const visible = Math.abs(relYaw) < hFov * 0.55 && Math.abs(relPitch) < vFov * 0.55

  return { x, y, visible }
}

/* ──────────────────────────── COMPONENT ──────────────────────────── */

export default function Recorridos360() {
  const sectionRef = useRef<HTMLElement>(null)
  const viewerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' })

  /* ── Rendered state ── */
  const [activeSpace, setActiveSpace] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [hoveredHotspot, setHoveredHotspot] = useState<string | null>(null)
  const [loadedSpaces, setLoadedSpaces] = useState<Set<number>>(new Set())
  const [viewYaw, setViewYaw] = useState(0)
  const [viewPitch, setViewPitch] = useState(0)
  const [viewFov, setViewFov] = useState(75)
  const [isDraggingState, setIsDraggingState] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)
  const [gyroEnabled, setGyroEnabled] = useState(false)

  /* ── Refs for interaction tracking (not rendered) ── */
  const isDraggingRef = useRef(false)
  const lastX = useRef(0)
  const lastY = useRef(0)
  const velocityX = useRef(0)
  const velocityY = useRef(0)
  const animFrameId = useRef<number>(0)
  const lastDragTime = useRef(0)
  const lastTouchDist = useRef(0)
  const gyroInitial = useRef<{ alpha: number; beta: number; gamma: number } | null>(null)
  const viewFovRef = useRef(75)
  const viewYawRef = useRef(0)
  const viewPitchRef = useRef(0)

  // Sync refs with state
  useEffect(() => { viewFovRef.current = viewFov }, [viewFov])
  useEffect(() => { viewYawRef.current = viewYaw }, [viewYaw])
  useEffect(() => { viewPitchRef.current = viewPitch }, [viewPitch])

  /* ── Inertia animation loop ── */
  const startInertia = useCallback(() => {
    const friction = 0.92

    const tick = () => {
      if (Math.abs(velocityX.current) < 0.01 && Math.abs(velocityY.current) < 0.01) {
        return
      }

      velocityX.current *= friction
      velocityY.current *= friction

      const newYaw = normalizeYaw(viewYawRef.current + velocityX.current)
      const newPitch = clamp(viewPitchRef.current + velocityY.current, -45, 45)

      viewYawRef.current = newYaw
      viewPitchRef.current = newPitch
      setViewYaw(newYaw)
      setViewPitch(newPitch)

      animFrameId.current = requestAnimationFrame(tick)
    }

    cancelAnimationFrame(animFrameId.current)
    animFrameId.current = requestAnimationFrame(tick)
  }, [])

  /* ── Mouse handlers ── */
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    isDraggingRef.current = true
    setIsDraggingState(true)
    lastX.current = e.clientX
    lastY.current = e.clientY
    lastDragTime.current = Date.now()
    velocityX.current = 0
    velocityY.current = 0
    cancelAnimationFrame(animFrameId.current)
    setShowInstructions(false)
    e.preventDefault()
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingRef.current) return

    const dx = e.clientX - lastX.current
    const dy = e.clientY - lastY.current

    const sensitivity = viewFovRef.current / 1200
    velocityX.current = -dx * sensitivity * 0.4
    velocityY.current = dy * sensitivity * 0.4

    const newYaw = normalizeYaw(viewYawRef.current - dx * sensitivity)
    const newPitch = clamp(viewPitchRef.current + dy * sensitivity, -45, 45)

    viewYawRef.current = newYaw
    viewPitchRef.current = newPitch
    setViewYaw(newYaw)
    setViewPitch(newPitch)

    lastX.current = e.clientX
    lastY.current = e.clientY
    lastDragTime.current = Date.now()
  }, [])

  const handleMouseUp = useCallback(() => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    setIsDraggingState(false)

    if (Date.now() - lastDragTime.current < 100) {
      startInertia()
    }
  }, [startInertia])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 3 : -3
    const newFov = clamp(viewFovRef.current + delta, 30, 120)
    viewFovRef.current = newFov
    setViewFov(newFov)
  }, [])

  /* ── Touch handlers ── */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true
      setIsDraggingState(true)
      lastX.current = e.touches[0].clientX
      lastY.current = e.touches[0].clientY
      lastDragTime.current = Date.now()
      velocityX.current = 0
      velocityY.current = 0
      cancelAnimationFrame(animFrameId.current)
      setShowInstructions(false)
    } else if (e.touches.length === 2) {
      isDraggingRef.current = false
      setIsDraggingState(false)
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      lastTouchDist.current = Math.sqrt(dx * dx + dy * dy)
    }
    e.preventDefault()
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDraggingRef.current) {
      const dx = e.touches[0].clientX - lastX.current
      const dy = e.touches[0].clientY - lastY.current

      const sensitivity = viewFovRef.current / 900
      velocityX.current = -dx * sensitivity * 0.35
      velocityY.current = dy * sensitivity * 0.35

      const newYaw = normalizeYaw(viewYawRef.current - dx * sensitivity)
      const newPitch = clamp(viewPitchRef.current + dy * sensitivity, -45, 45)

      viewYawRef.current = newYaw
      viewPitchRef.current = newPitch
      setViewYaw(newYaw)
      setViewPitch(newPitch)

      lastX.current = e.touches[0].clientX
      lastY.current = e.touches[0].clientY
      lastDragTime.current = Date.now()
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.sqrt(dx * dx + dy * dy)
      const delta = (lastTouchDist.current - dist) * 0.15
      const newFov = clamp(viewFovRef.current + delta, 30, 120)
      viewFovRef.current = newFov
      setViewFov(newFov)
      lastTouchDist.current = dist
    }
    e.preventDefault()
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false
      setIsDraggingState(false)
      if (Date.now() - lastDragTime.current < 100) {
        startInertia()
      }
    }
  }, [startInertia])

  /* ── Gyroscope ── */
  const handleOrientation = useCallback((e: DeviceOrientationEvent) => {
    if (!gyroEnabled || e.gamma === null || e.beta === null) return

    if (!gyroInitial.current) {
      gyroInitial.current = { alpha: e.alpha || 0, beta: e.beta, gamma: e.gamma }
    }

    const gammaOffset = (e.gamma - gyroInitial.current.gamma) * 0.5
    const betaOffset = (e.beta - gyroInitial.current.beta) * 0.3

    const newYaw = normalizeYaw(gammaOffset)
    const newPitch = clamp(betaOffset, -45, 45)
    viewYawRef.current = newYaw
    viewPitchRef.current = newPitch
    setViewYaw(newYaw)
    setViewPitch(newPitch)
  }, [gyroEnabled])

  useEffect(() => {
    if (gyroEnabled) {
      window.addEventListener('deviceorientation', handleOrientation)
    }
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation)
    }
  }, [gyroEnabled, handleOrientation])

  const requestGyro = useCallback(async () => {
    if (typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === 'function') {
      try {
        const permission = await (DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission()
        if (permission === 'granted') {
          setGyroEnabled(true)
        }
      } catch {
        // Permission denied
      }
    } else {
      setGyroEnabled(true)
    }
  }, [])

  /* ── Fullscreen ── */
  const toggleFullscreen = useCallback(() => {
    if (!viewerRef.current) return
    if (!document.fullscreenElement) {
      viewerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }, [])

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  /* ── Keyboard (ESC to exit fullscreen) ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {})
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  /* ── Space navigation with transition ── */
  const navigateToSpace = useCallback((index: number) => {
    if (index === activeSpace || isTransitioning) return
    setIsTransitioning(true)

    setTimeout(() => {
      setActiveSpace(index)
      const resetYaw = 0
      const resetPitch = 0
      const resetFov = 75
      viewYawRef.current = resetYaw
      viewPitchRef.current = resetPitch
      viewFovRef.current = resetFov
      setViewYaw(resetYaw)
      setViewPitch(resetPitch)
      setViewFov(resetFov)
      velocityX.current = 0
      velocityY.current = 0
      gyroInitial.current = null
      setShowInstructions(true)

      setTimeout(() => {
        setIsTransitioning(false)
      }, 100)
    }, 600)
  }, [activeSpace, isTransitioning])

  const navigateByHotspot = useCallback((linkTo: string) => {
    const idx = spaces.findIndex((s) => s.id === linkTo)
    if (idx >= 0) navigateToSpace(idx)
  }, [navigateToSpace])

  /* ── Zoom controls ── */
  const zoomIn = useCallback(() => {
    const newFov = clamp(viewFovRef.current - 10, 30, 120)
    viewFovRef.current = newFov
    setViewFov(newFov)
  }, [])

  const zoomOut = useCallback(() => {
    const newFov = clamp(viewFovRef.current + 10, 30, 120)
    viewFovRef.current = newFov
    setViewFov(newFov)
  }, [])

  /* ── Reset view ── */
  const resetView = useCallback(() => {
    viewYawRef.current = 0
    viewPitchRef.current = 0
    viewFovRef.current = 75
    velocityX.current = 0
    velocityY.current = 0
    setViewYaw(0)
    setViewPitch(0)
    setViewFov(75)
    setShowInstructions(true)
  }, [])

  /* ── Derived image loading state ── */
  const imageLoaded = loadedSpaces.has(activeSpace)

  /* ── Image preloading ── */
  useEffect(() => {
    const idx = activeSpace
    const img = new Image()
    const markLoaded = () => {
      setLoadedSpaces((prev) => {
        if (prev.has(idx)) return prev
        const next = new Set(prev)
        next.add(idx)
        return next
      })
    }
    img.onload = markLoaded
    img.onerror = markLoaded
    img.src = spaces[idx].image

    // Fallback timeout
    const timeout = setTimeout(markLoaded, 3000)

    return () => {
      clearTimeout(timeout)
      img.onload = null
      img.onerror = null
    }
  }, [activeSpace])

  /* ── Calculate panoramic effect values from state ── */
  const currentSpace = spaces[activeSpace]
  const yawOffset = (viewYaw / 180) * 25
  const pitchOffset = (viewPitch / 45) * 8
  const scale = 1.15 + (75 - viewFov) / 150
  const compassRotation = -viewYaw

  return (
    <section id="recorridos" ref={sectionRef} className="relative py-24 md:py-32 bg-[#111111]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-[10px] tracking-[0.5em] uppercase text-[#8B6B4B] mb-4"
          >
            Recorridos 360°
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, delay: 0.2 }}
            className="font-[family-name:var(--font-cormorant)] text-3xl md:text-5xl text-[#F5F1EA] font-light"
          >
            Experimentar Espacios
          </motion.h2>
          <motion.div
            initial={{ width: 0 }}
            animate={isInView ? { width: 60 } : {}}
            transition={{ duration: 1, delay: 0.5 }}
            className="h-[1px] bg-[#8B6B4B] mx-auto mt-6"
          />
        </div>

        {/* Space selector - top pills */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex gap-2 overflow-x-auto pb-3 mb-6"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {spaces.map((space, i) => (
            <button
              key={space.id}
              onClick={() => navigateToSpace(i)}
              className={`whitespace-nowrap px-4 py-2 text-[9px] tracking-[0.15em] uppercase transition-all duration-300 border flex-shrink-0 ${
                activeSpace === i
                  ? 'border-[#8B6B4B] bg-[#8B6B4B]/10 text-[#8B6B4B]'
                  : 'border-[#D8D1C8]/10 text-[#D8D1C8]/40 hover:border-[#8B6B4B]/30 hover:text-[#D8D1C8]/60'
              }`}
            >
              {space.name}
            </button>
          ))}
        </motion.div>

        {/* 360° Viewer Container */}
        <div
          ref={viewerRef}
          className={`relative overflow-hidden bg-[#0A0A0A] ${
            isFullscreen ? 'fixed inset-0 z-50' : 'aspect-[16/9]'
          }`}
          style={{ cursor: isDraggingState ? 'grabbing' : 'grab' }}
        >
          {/* Transition overlay */}
          <AnimatePresence>
            {isTransitioning && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 bg-[#0A0A0A] z-30"
              />
            )}
          </AnimatePresence>

          {/* Loading state */}
          <AnimatePresence>
            {!imageLoaded && !isTransitioning && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 flex items-center justify-center bg-[#0A0A0A]"
              >
                <div className="text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="w-12 h-12 border border-[#8B6B4B]/30 rounded-full mx-auto mb-3 flex items-center justify-center"
                  >
                    <div className="w-7 h-7 border-t border-[#8B6B4B] rounded-full" />
                  </motion.div>
                  <p className="text-[9px] tracking-[0.3em] uppercase text-[#D8D1C8]/30">Cargando...</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Panoramic image with 3D perspective transform */}
          <div
            className="absolute inset-0 select-none"
            style={{
              perspective: `${viewFov * 10}px`,
              perspectiveOrigin: '50% 50%',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* The image container with 3D rotation */}
            <div
              className="absolute inset-0 will-change-transform"
              style={{
                transform: `rotateY(${viewYaw * 0.15}deg) rotateX(${-viewPitch * 0.15}deg) scale(${scale})`,
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Background image with offset for panning */}
              <div
                className="absolute inset-0 will-change-transform"
                style={{
                  backgroundImage: `url(${currentSpace.image})`,
                  backgroundSize: '130% 120%',
                  backgroundPosition: `${50 + yawOffset}% ${50 + pitchOffset}%`,
                  backgroundRepeat: 'no-repeat',
                  filter: `brightness(${0.75 + (75 - viewFov) / 300})`,
                }}
              />
              {/* Duplicate layer for parallax depth */}
              <div
                className="absolute inset-0 will-change-transform opacity-30"
                style={{
                  backgroundImage: `url(${currentSpace.image})`,
                  backgroundSize: '160% 140%',
                  backgroundPosition: `${50 + yawOffset * 0.6}% ${50 + pitchOffset * 0.6}%`,
                  backgroundRepeat: 'no-repeat',
                  filter: 'blur(8px) brightness(0.5)',
                }}
              />
            </div>
          </div>

          {/* Vignette overlay */}
          <div
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              background: 'radial-gradient(ellipse at center, transparent 40%, rgba(10,10,10,0.4) 70%, rgba(10,10,10,0.85) 100%)',
            }}
          />

          {/* Subtle scan line effect for immersion */}
          <div
            className="absolute inset-0 pointer-events-none z-10 opacity-[0.03]"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(245,241,234,0.1) 2px, rgba(245,241,234,0.1) 4px)',
            }}
          />

          {/* ── Hotspots ── */}
          <div className="absolute inset-0 z-15 pointer-events-none">
            {currentSpace.hotspots.map((hotspot) => {
              const pos = hotspotToScreen(hotspot.yaw, hotspot.pitch, viewYaw, viewPitch, viewFov)
              if (!pos.visible) return null

              return (
                <div
                  key={hotspot.id}
                  className="absolute pointer-events-auto"
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  {/* Pulsating ring */}
                  <motion.div
                    animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute inset-0 w-8 h-8 -ml-1 -mt-1 rounded-full border border-[#8B6B4B]/60"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                    className="absolute inset-0 w-8 h-8 -ml-1 -mt-1 rounded-full border border-[#8B6B4B]/40"
                  />

                  {/* Hotspot dot */}
                  <motion.button
                    whileHover={{ scale: 1.3 }}
                    whileTap={{ scale: 0.9 }}
                    onMouseEnter={() => setHoveredHotspot(hotspot.id)}
                    onMouseLeave={() => setHoveredHotspot(null)}
                    onClick={() => {
                      if (hotspot.linkTo) navigateByHotspot(hotspot.linkTo)
                    }}
                    className={`relative w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-200 ${
                      hotspot.linkTo
                        ? 'bg-[#8B6B4B] hover:bg-[#8B6B4B]/80 cursor-pointer'
                        : 'bg-[#8B6B4B]/70 hover:bg-[#8B6B4B]/90 cursor-pointer'
                    }`}
                  >
                    <div className="w-2 h-2 bg-[#F5F1EA] rounded-full" />
                    {hotspot.linkTo && (
                      <svg
                        className="absolute w-3 h-3 text-[#F5F1EA] -right-1 -top-1"
                        viewBox="0 0 12 12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path d="M4 2L8 6L4 10" />
                      </svg>
                    )}
                  </motion.button>

                  {/* Tooltip */}
                  <AnimatePresence>
                    {hoveredHotspot === hotspot.id && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 pointer-events-none"
                      >
                        <div className="bg-[#111111]/95 backdrop-blur-md border border-[#8B6B4B]/30 px-4 py-3 min-w-[200px] max-w-[260px]">
                          <p className="font-[family-name:var(--font-cormorant)] text-sm text-[#F5F1EA] mb-1">
                            {hotspot.label}
                          </p>
                          <p className="text-[9px] tracking-[0.05em] text-[#D8D1C8]/60 leading-relaxed">
                            {hotspot.description}
                          </p>
                          {hotspot.linkTo && (
                            <p className="text-[8px] tracking-[0.15em] uppercase text-[#8B6B4B] mt-2 flex items-center gap-1">
                              Explorar
                              <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M3 1L6 4L3 7" />
                              </svg>
                            </p>
                          )}
                        </div>
                        {/* Arrow */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-[#8B6B4B]/30" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>

          {/* ── Top-right controls ── */}
          <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
            {/* Fullscreen */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleFullscreen}
              className="p-2.5 bg-[#111111]/60 backdrop-blur-sm border border-[#D8D1C8]/10 hover:border-[#8B6B4B]/40 transition-colors"
              aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            >
              {isFullscreen ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D8D1C8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D8D1C8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />
                </svg>
              )}
            </motion.button>

            {/* Gyroscope toggle (only show on mobile) */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={requestGyro}
              className={`p-2.5 backdrop-blur-sm border transition-colors lg:hidden ${
                gyroEnabled
                  ? 'bg-[#8B6B4B]/20 border-[#8B6B4B]/40 text-[#8B6B4B]'
                  : 'bg-[#111111]/60 border-[#D8D1C8]/10 hover:border-[#8B6B4B]/40'
              }`}
              aria-label="Giroscopio"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={gyroEnabled ? '#8B6B4B' : '#D8D1C8'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
                <circle cx="12" cy="12" r="9" strokeDasharray="3 3" />
              </svg>
            </motion.button>
          </div>

          {/* ── Zoom controls (bottom-right) ── */}
          <div className="absolute bottom-16 right-4 z-20 flex flex-col gap-1">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={zoomIn}
              className="p-2.5 bg-[#111111]/60 backdrop-blur-sm border border-[#D8D1C8]/10 hover:border-[#8B6B4B]/40 transition-colors"
              aria-label="Acercar"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D8D1C8" strokeWidth="1.5">
                <path d="M12 5v14m-7-7h14" />
              </svg>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={zoomOut}
              className="p-2.5 bg-[#111111]/60 backdrop-blur-sm border border-[#D8D1C8]/10 hover:border-[#8B6B4B]/40 transition-colors"
              aria-label="Alejar"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D8D1C8" strokeWidth="1.5">
                <path d="M5 12h14" />
              </svg>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetView}
              className="p-2.5 bg-[#111111]/60 backdrop-blur-sm border border-[#D8D1C8]/10 hover:border-[#8B6B4B]/40 transition-colors mt-1"
              aria-label="Resetear vista"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D8D1C8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </motion.button>
          </div>

          {/* ── Bottom-left: Space info ── */}
          <div className="absolute bottom-4 left-4 z-20">
            <motion.div
              key={currentSpace.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <p className="font-[family-name:var(--font-cormorant)] text-xl md:text-2xl text-[#F5F1EA]">
                {currentSpace.name}
              </p>
              <p className="text-[8px] tracking-[0.25em] uppercase text-[#8B6B4B] mt-1 flex items-center gap-2">
                <span>Recorrido Virtual</span>
                <span className="w-1 h-1 rounded-full bg-[#8B6B4B]/50" />
                <span>360°</span>
              </p>
            </motion.div>
          </div>

          {/* ── Compass indicator (bottom-center) ── */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
            <div className="flex flex-col items-center">
              <div className="relative w-10 h-10">
                {/* Compass ring */}
                <div className="absolute inset-0 rounded-full border border-[#D8D1C8]/15" />
                {/* Compass needle */}
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  animate={{ rotate: compassRotation }}
                  transition={{ type: 'tween', duration: 0.3 }}
                >
                  <div className="w-[1px] h-4 bg-[#8B6B4B] relative">
                    <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[3px] border-r-[3px] border-b-[5px] border-l-transparent border-r-transparent border-b-[#8B6B4B]" />
                  </div>
                </motion.div>
                {/* Cardinal points */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 text-[6px] text-[#D8D1C8]/40 font-[family-name:var(--font-inter)]">N</div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 text-[6px] text-[#D8D1C8]/30 font-[family-name:var(--font-inter)]">S</div>
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 text-[6px] text-[#D8D1C8]/30 font-[family-name:var(--font-inter)]">O</div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 text-[6px] text-[#D8D1C8]/30 font-[family-name:var(--font-inter)]">E</div>
              </div>
            </div>
          </div>

          {/* ── Drag instruction overlay (initial) ── */}
          {showInstructions && imageLoaded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="text-center"
              >
                <motion.div
                  animate={{ x: [0, 15, 0, -15, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mx-auto mb-3 opacity-50">
                    <circle cx="24" cy="24" r="20" stroke="#8B6B4B" strokeWidth="1" strokeDasharray="4 4" />
                    <path d="M24 14v20M14 24h20" stroke="#D8D1C8" strokeWidth="0.75" opacity="0.6" />
                    <path d="M24 14l-3 4h6l-3-4zM24 34l-3-4h6l3 4zM14 24l4-3v6l-4-3zM34 24l-4-3v6l4-3z" fill="#8B6B4B" opacity="0.4" />
                  </svg>
                </motion.div>
                <p className="text-[9px] tracking-[0.35em] uppercase text-[#D8D1C8]/35">
                  Arrastra para explorar
                </p>
              </motion.div>
            </motion.div>
          )}

          {/* ── FOV indicator (top-left) ── */}
          <div className="absolute top-4 left-4 z-20">
            <div className="flex items-center gap-2">
              <span className="text-[8px] tracking-[0.2em] uppercase text-[#D8D1C8]/25 font-[family-name:var(--font-inter)]">
                {Math.round(viewFov)}°
              </span>
            </div>
          </div>

          {/* Visually hidden image for browser cache */}
          <img
            src={currentSpace.image}
            alt=""
            className="absolute opacity-0 pointer-events-none w-px h-px"
          />
        </div>

        {/* ── Thumbnail strip ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-6"
        >
          <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {spaces.map((space, i) => (
              <motion.button
                key={space.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigateToSpace(i)}
                className={`relative flex-shrink-0 w-28 md:w-36 aspect-[16/10] overflow-hidden transition-all duration-400 group ${
                  activeSpace === i
                    ? 'ring-1 ring-[#8B6B4B]/60'
                    : 'opacity-50 hover:opacity-80'
                }`}
              >
                <img
                  src={space.image}
                  alt={space.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/90 via-transparent to-transparent" />
                <div className="absolute bottom-1.5 left-2 right-2">
                  <p className={`text-[7px] md:text-[8px] tracking-[0.1em] uppercase truncate transition-colors duration-300 ${
                    activeSpace === i ? 'text-[#8B6B4B]' : 'text-[#D8D1C8]/50 group-hover:text-[#D8D1C8]/80'
                  }`}>
                    {space.name}
                  </p>
                </div>
                {activeSpace === i && (
                  <div className="absolute top-1.5 right-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#8B6B4B]" />
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* ── Navigation dots ── */}
        <div className="flex justify-center gap-2 mt-5">
          {spaces.map((_, i) => (
            <button
              key={i}
              onClick={() => navigateToSpace(i)}
              className={`h-1.5 rounded-full transition-all duration-400 ${
                activeSpace === i ? 'bg-[#8B6B4B] w-6' : 'bg-[#D8D1C8]/15 w-1.5 hover:bg-[#D8D1C8]/30'
              }`}
              aria-label={`Ir a ${spaces[i].name}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
