'use client'

import { useRef, useMemo, useCallback, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

/* ─── Types ─── */
type ViewMode = 'exploded' | 'corte' | 'fachada'

interface BuildingSceneProps {
  viewMode: ViewMode
  selectedLevel: number
  hoveredLevel: number | null
  onFloorClick: (groupIndex: number) => void
  onFloorHover: (groupIndex: number | null) => void
}

/* ─── PRAGA Color Palette ─── */
const NEGRO = '#111111'
const BRONCE = '#8B6B4B'
const GRIS_PIEDRA = '#D8D1C8'
const VERDE_MUSGO = '#4B5646'
const CONCRETE_DARK = '#1A1A1A'
const CONCRETE_MED = '#222222'
const PARKING_DARK = '#0F0F0F'
const GLASS_COLOR = '#4A6070'
const ATRIUM_COLOR = '#0D0D0D'
const SOCIAL_ACCENT = '#2A2218'

/* ─── Building Dimensions (scale: 1 unit ≈ 5m) ─── */
const BUILDING_W = 6.5    // 32.5m footprint
const BUILDING_D = 5.2    // 26.0m footprint
const WING_GAP = 1.1      // Central atrium width
const WING_W = (BUILDING_W - WING_GAP) / 2 // Each wing width
const ATRIUM_DEPTH = 3.8  // Atrium depth (slightly less than full depth)

const FLOOR_GAP = 0.06
const FLOOR_PLATE_THICKNESS = 0.08

/* ─── Floor Configuration Builder ─── */
interface FloorConfig {
  levelIndex: number
  groupIndex: number
  name: string
  type: 'parking' | 'access' | 'commercial' | 'social' | 'residential' | 'rooftop'
  width: number
  depth: number
  height: number
  baseY: number
  hasWindows: boolean
  hasGreenery: boolean
  hasBalcony: boolean
  floorNumber: number
}

function buildFloorConfigs(): FloorConfig[] {
  const floors: FloorConfig[] = []
  let y = 0

  const push = (
    groupIndex: number,
    name: string,
    type: FloorConfig['type'],
    width: number,
    depth: number,
    height: number,
    hasWindows: boolean,
    hasGreenery: boolean,
    hasBalcony: boolean,
  ) => {
    floors.push({
      levelIndex: floors.length,
      groupIndex,
      name,
      type,
      width,
      depth,
      height,
      baseY: y,
      hasWindows,
      hasGreenery,
      hasBalcony,
      floorNumber: floors.length,
    })
    y += height + FLOOR_GAP
  }

  // Sótanos 1-3 (underground parking)
  for (let i = 0; i < 3; i++) {
    push(7, `Sótano ${3 - i}`, 'parking', BUILDING_W, BUILDING_D, 0.5, false, false, false)
  }
  // Nivel Acceso (double-height lobby)
  push(6, '1° Piso / Acceso', 'access', BUILDING_W, BUILDING_D, 0.8, true, false, false)
  // Nivel Comercial
  push(5, 'Nivel Comercial', 'commercial', BUILDING_W, BUILDING_D, 0.6, true, false, false)
  // Zona Social
  push(4, 'Zona Social', 'social', BUILDING_W, BUILDING_D, 0.65, true, false, false)
  // Pisos 1-4 (Tipo A: 1 alcoba ~73.70m²)
  for (let i = 0; i < 4; i++) {
    const taper = 1 - (i + 1) * 0.008
    push(3, `Piso ${i + 1}`, 'residential', BUILDING_W * taper, BUILDING_D * taper, 0.45, true, i % 2 === 1, true)
  }
  // Pisos 5-8 (Tipo B: 1-2 alcobas)
  for (let i = 0; i < 4; i++) {
    const taper = 1 - (i + 5) * 0.008
    push(2, `Piso ${i + 5}`, 'residential', BUILDING_W * taper, BUILDING_D * taper, 0.45, true, i % 2 === 0, true)
  }
  // Pisos 9-12 (Premium: 2 alcobas)
  for (let i = 0; i < 4; i++) {
    const taper = 1 - (i + 9) * 0.008
    push(1, `Piso ${i + 9}`, 'residential', BUILDING_W * taper, BUILDING_D * taper, 0.45, true, i === 1 || i === 3, true)
  }
  // Cubierta / Rooftop
  push(0, 'Cubierta', 'rooftop', BUILDING_W * 0.88, BUILDING_D * 0.85, 0.3, false, true, false)

  return floors
}

const FLOOR_CONFIGS = buildFloorConfigs()
const TOTAL_BUILDING_HEIGHT = FLOOR_CONFIGS.reduce((sum, f) => sum + f.height + FLOOR_GAP, 0)

/* ─── Shared Materials (created once, reused) ─── */
const concreteMedMat = new THREE.MeshStandardMaterial({
  color: CONCRETE_MED,
  roughness: 0.8,
  metalness: 0.08,
})

const parkingMat = new THREE.MeshStandardMaterial({
  color: PARKING_DARK,
  roughness: 0.9,
  metalness: 0.02,
})

const atriumMat = new THREE.MeshStandardMaterial({
  color: ATRIUM_COLOR,
  roughness: 1,
  metalness: 0,
  side: THREE.BackSide,
})

const greenMat = new THREE.MeshStandardMaterial({
  color: VERDE_MUSGO,
  roughness: 0.7,
  metalness: 0.0,
})

const bronceMat = new THREE.MeshStandardMaterial({
  color: BRONCE,
  roughness: 0.3,
  metalness: 0.7,
  emissive: BRONCE,
  emissiveIntensity: 0.3,
})

const edgeMat = new THREE.LineBasicMaterial({
  color: '#333333',
  transparent: true,
  opacity: 0.3,
})

const trunkMat = new THREE.MeshStandardMaterial({ color: '#3A2F20', roughness: 0.9 })
const loungeMat = new THREE.MeshStandardMaterial({ color: SOCIAL_ACCENT, roughness: 0.6, metalness: 0.3 })

const glassSharedMat = new THREE.MeshPhysicalMaterial({
  color: GLASS_COLOR,
  roughness: 0.15,
  metalness: 0.1,
  transmission: 0.6,
  thickness: 0.05,
  transparent: true,
  opacity: 0.5,
  side: THREE.DoubleSide,
})

const balconyMat = new THREE.MeshStandardMaterial({
  color: '#1E1A15',
  roughness: 0.7,
  metalness: 0.1,
})

const coreMat = new THREE.MeshStandardMaterial({
  color: '#191919',
  roughness: 0.85,
  metalness: 0.05,
})

/* ─── Window Grid Component ─── */
function WindowGrid({
  width,
  height,
  position,
  rotation,
  cols,
}: {
  width: number
  height: number
  position: [number, number, number]
  rotation: [number, number, number]
  cols?: number
}) {
  const windowCols = cols ?? Math.max(3, Math.round(width * 3))
  const rows = Math.max(1, Math.round(height * 3))
  const windowW = (width * 0.85) / windowCols
  const windowH = (height * 0.6) / rows
  const spacingX = (width * 0.85) / windowCols
  const spacingY = (height * 0.6) / rows

  const meshes = useMemo(() => {
    const items: { pos: [number, number, number]; key: string }[] = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < windowCols; c++) {
        const x = -width * 0.4 + c * spacingX + spacingX / 2
        const y = -height * 0.2 + r * spacingY + spacingY / 2
        items.push({ pos: [x, y, 0], key: `${r}-${c}` })
      }
    }
    return items
  }, [width, height, spacingX, spacingY, windowCols, rows])

  return (
    <group position={position} rotation={rotation}>
      {meshes.map(({ pos, key }) => (
        <mesh key={key} position={pos} material={glassSharedMat}>
          <boxGeometry args={[windowW * 0.82, windowH * 0.82, 0.02]} />
        </mesh>
      ))}
    </group>
  )
}

/* ─── Single Floor Component ─── */
function BuildingFloor({
  config,
  viewMode,
  isSelected,
  isHovered,
  explodedOffset,
  onSelect,
  onHover,
  clippingPlanes,
}: {
  config: FloorConfig
  viewMode: ViewMode
  isSelected: boolean
  isHovered: boolean
  explodedOffset: number
  onSelect: () => void
  onHover: (hovering: boolean) => void
  clippingPlanes: THREE.Plane[]
}) {
  const groupRef = useRef<THREE.Group>(null)

  const highlightMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: BRONCE,
        roughness: 0.3,
        metalness: 0.7,
        emissive: BRONCE,
        emissiveIntensity: isSelected ? 0.5 : isHovered ? 0.3 : 0,
        transparent: true,
        opacity: isSelected ? 0.4 : isHovered ? 0.25 : 0,
      }),
    [isSelected, isHovered],
  )

  const typeColorMap: Record<string, string> = {
    parking: '#0D0D0D',
    access: CONCRETE_DARK,
    commercial: '#1C1816',
    social: '#1A1A18',
    residential: CONCRETE_DARK,
    rooftop: '#181818',
  }

  const floorColor = isSelected ? '#2A2218' : isHovered ? '#1E1A15' : (typeColorMap[config.type] ?? CONCRETE_DARK)
  const floorRoughness = config.type === 'parking' ? 0.95 : 0.85
  const floorMetalness = config.type === 'parking' ? 0.02 : 0.05

  const currentFloorMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: floorColor,
        roughness: floorRoughness,
        metalness: floorMetalness,
        ...(clippingPlanes.length > 0 ? { clippingPlanes } : {}),
      }),
    [floorColor, floorRoughness, floorMetalness, clippingPlanes],
  )

  const targetY = useMemo(() => {
    if (viewMode === 'exploded') {
      return config.baseY + explodedOffset
    }
    return config.baseY
  }, [config.baseY, viewMode, explodedOffset])

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.08)
    }
  })

  const { width, depth, height } = config
  // Each wing width
  const wingW = (width - WING_GAP) / 2
  // Atrium depth (slightly smaller than full depth for walls)
  const aDepth = depth * 0.75

  const handlePointerOver = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation()
      onHover(true)
    },
    [onHover],
  )

  const handlePointerOut = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation()
      onHover(false)
    },
    [onHover],
  )

  const handleClick = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation()
      onSelect()
    },
    [onSelect],
  )

  const edgeGeo = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(width, height, depth)),
    [width, height, depth],
  )

  // Window columns per wing (6 apartments per wing → 6 window groups per wing face)
  const wingWindowCols = config.type === 'residential' ? 6 : config.type === 'social' || config.type === 'commercial' ? 4 : 3

  return (
    <group ref={groupRef} position={[0, config.baseY, 0]}>
      {/* ─── Left Wing ─── */}
      <mesh
        position={[-WING_GAP / 2 - wingW / 2, height / 2, 0]}
        material={currentFloorMat}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <boxGeometry args={[wingW, height, depth]} />
      </mesh>

      {/* ─── Right Wing ─── */}
      <mesh
        position={[WING_GAP / 2 + wingW / 2, height / 2, 0]}
        material={currentFloorMat}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <boxGeometry args={[wingW, height, depth]} />
      </mesh>

      {/* ─── Floor Plate (full width) ─── */}
      <mesh position={[0, 0.01, 0]} material={concreteMedMat}>
        <boxGeometry args={[width, FLOOR_PLATE_THICKNESS, depth]} />
      </mesh>

      {/* ─── Central Core (Elevator + Stairs) ─── */}
      <mesh position={[0, height / 2, -depth * 0.15]} material={coreMat}>
        <boxGeometry args={[WING_GAP * 0.8, height - FLOOR_PLATE_THICKNESS, depth * 0.35]} />
      </mesh>

      {/* ─── Atrium Void ─── */}
      <mesh position={[0, height / 2, depth * 0.1]} material={atriumMat}>
        <boxGeometry args={[WING_GAP * 0.9, height - FLOOR_PLATE_THICKNESS, aDepth]} />
      </mesh>

      {/* ─── Highlight overlay ─── */}
      {(isSelected || isHovered) && (
        <>
          <mesh position={[-WING_GAP / 2 - wingW / 2, height / 2, 0]} material={highlightMat}>
            <boxGeometry args={[wingW + 0.01, height + 0.01, depth + 0.01]} />
          </mesh>
          <mesh position={[WING_GAP / 2 + wingW / 2, height / 2, 0]} material={highlightMat}>
            <boxGeometry args={[wingW + 0.01, height + 0.01, depth + 0.01]} />
          </mesh>
        </>
      )}

      {/* ─── Windows on residential/social/commercial levels ─── */}
      {config.hasWindows && (
        <>
          {/* Front face windows - Left wing */}
          <WindowGrid
            width={wingW}
            height={height * 0.8}
            position={[-WING_GAP / 2 - wingW / 2, height / 2, depth / 2 + 0.01]}
            rotation={[0, 0, 0]}
            cols={wingWindowCols}
          />
          {/* Front face windows - Right wing */}
          <WindowGrid
            width={wingW}
            height={height * 0.8}
            position={[WING_GAP / 2 + wingW / 2, height / 2, depth / 2 + 0.01]}
            rotation={[0, 0, 0]}
            cols={wingWindowCols}
          />
          {/* Back face windows - Left wing */}
          <WindowGrid
            width={wingW}
            height={height * 0.8}
            position={[-WING_GAP / 2 - wingW / 2, height / 2, -depth / 2 - 0.01]}
            rotation={[0, Math.PI, 0]}
            cols={wingWindowCols}
          />
          {/* Back face windows - Right wing */}
          <WindowGrid
            width={wingW}
            height={height * 0.8}
            position={[WING_GAP / 2 + wingW / 2, height / 2, -depth / 2 - 0.01]}
            rotation={[0, Math.PI, 0]}
            cols={wingWindowCols}
          />
          {/* Side windows - Left wing left side */}
          <WindowGrid
            width={depth * 0.8}
            height={height * 0.7}
            position={[-WING_GAP / 2 - wingW - 0.01, height / 2, 0]}
            rotation={[0, -Math.PI / 2, 0]}
            cols={4}
          />
          {/* Side windows - Right wing right side */}
          <WindowGrid
            width={depth * 0.8}
            height={height * 0.7}
            position={[WING_GAP / 2 + wingW + 0.01, height / 2, 0]}
            rotation={[0, Math.PI / 2, 0]}
            cols={4}
          />
        </>
      )}

      {/* ─── Balconies on residential floors ─── */}
      {config.hasBalcony && (
        <>
          {/* Front balconies - left wing */}
          <mesh
            position={[-WING_GAP / 2 - wingW / 2, height * 0.12, depth / 2 + 0.12]}
            material={balconyMat}
          >
            <boxGeometry args={[wingW * 0.92, 0.035, 0.24]} />
          </mesh>
          {/* Front balconies - right wing */}
          <mesh
            position={[WING_GAP / 2 + wingW / 2, height * 0.12, depth / 2 + 0.12]}
            material={balconyMat}
          >
            <boxGeometry args={[wingW * 0.92, 0.035, 0.24]} />
          </mesh>
          {/* Back balconies - left wing */}
          <mesh
            position={[-WING_GAP / 2 - wingW / 2, height * 0.12, -depth / 2 - 0.12]}
            material={balconyMat}
          >
            <boxGeometry args={[wingW * 0.92, 0.035, 0.24]} />
          </mesh>
          {/* Back balconies - right wing */}
          <mesh
            position={[WING_GAP / 2 + wingW / 2, height * 0.12, -depth / 2 - 0.12]}
            material={balconyMat}
          >
            <boxGeometry args={[wingW * 0.92, 0.035, 0.24]} />
          </mesh>
          {/* Balcony railing lines */}
          <mesh
            position={[-WING_GAP / 2 - wingW / 2, height * 0.22, depth / 2 + 0.2]}
            material={bronceMat}
          >
            <boxGeometry args={[wingW * 0.88, 0.015, 0.01]} />
          </mesh>
          <mesh
            position={[WING_GAP / 2 + wingW / 2, height * 0.22, depth / 2 + 0.2]}
            material={bronceMat}
          >
            <boxGeometry args={[wingW * 0.88, 0.015, 0.01]} />
          </mesh>
        </>
      )}

      {/* ─── Greenery on balconies ─── */}
      {config.hasGreenery && (
        <>
          {/* Plants on front balconies */}
          {[-0.25, 0.15].map((xOff, idx) => (
            <group key={`gl-${idx}`} position={[-WING_GAP / 2 - wingW * 0.3 + xOff, height * 0.12 + 0.06, depth / 2 + 0.18]}>
              <mesh material={trunkMat}>
                <cylinderGeometry args={[0.015, 0.02, 0.08, 5]} />
              </mesh>
              <mesh position={[0, 0.07, 0]} material={greenMat}>
                <sphereGeometry args={[0.06, 7, 5]} />
              </mesh>
            </group>
          ))}
          {[0.1, -0.2].map((xOff, idx) => (
            <group key={`gr-${idx}`} position={[WING_GAP / 2 + wingW * 0.3 + xOff, height * 0.12 + 0.06, depth / 2 + 0.18]}>
              <mesh material={trunkMat}>
                <cylinderGeometry args={[0.015, 0.02, 0.08, 5]} />
              </mesh>
              <mesh position={[0, 0.07, 0]} material={greenMat}>
                <sphereGeometry args={[0.06, 7, 5]} />
              </mesh>
            </group>
          ))}
          {/* Back balcony plants */}
          <mesh position={[-WING_GAP / 2 - wingW * 0.4, height * 0.12 + 0.04, -depth / 2 - 0.18]} material={greenMat}>
            <boxGeometry args={[0.12, 0.08, 0.1]} />
          </mesh>
          <mesh position={[WING_GAP / 2 + wingW * 0.35, height * 0.12 + 0.04, -depth / 2 - 0.18]} material={greenMat}>
            <boxGeometry args={[0.1, 0.07, 0.09]} />
          </mesh>
        </>
      )}

      {/* ─── Edge lines ─── */}
      <lineSegments geometry={edgeGeo} material={edgeMat} />

      {/* ─── Bronce accent strips on special levels ─── */}
      {(config.type === 'access' || config.type === 'commercial' || config.type === 'social') && (
        <>
          {/* Front accent */}
          <mesh position={[0, 0.05, depth / 2 + 0.005]} material={bronceMat}>
            <boxGeometry args={[width, 0.025, 0.01]} />
          </mesh>
          {/* Back accent */}
          <mesh position={[0, 0.05, -depth / 2 - 0.005]} material={bronceMat}>
            <boxGeometry args={[width, 0.025, 0.01]} />
          </mesh>
          {/* Mid-height accent band */}
          <mesh position={[0, height * 0.5, depth / 2 + 0.005]} material={bronceMat}>
            <boxGeometry args={[width, 0.015, 0.008]} />
          </mesh>
        </>
      )}

      {/* ─── Parking level horizontal line patterns ─── */}
      {config.type === 'parking' && (
        <>
          <mesh position={[0, height * 0.3, depth / 2 + 0.005]} material={edgeMat}>
            <boxGeometry args={[width, 0.008, 0.005]} />
          </mesh>
          <mesh position={[0, height * 0.6, depth / 2 + 0.005]} material={edgeMat}>
            <boxGeometry args={[width, 0.008, 0.005]} />
          </mesh>
        </>
      )}

      {/* ─── Access level: lobby entrance indication ─── */}
      {config.type === 'access' && (
        <mesh position={[0, height * 0.4, depth / 2 + 0.08]} material={glassSharedMat}>
          <boxGeometry args={[WING_GAP * 0.7, height * 0.5, 0.02]} />
        </mesh>
      )}

      {/* ─── Social level: pool indication ─── */}
      {config.type === 'social' && (
        <mesh position={[WING_GAP / 2 + wingW * 0.15, height * 0.15, depth * 0.15]} material={glassSharedMat}>
          <boxGeometry args={[wingW * 0.5, 0.04, depth * 0.25]} />
        </mesh>
      )}
    </group>
  )
}

/* ─── Rooftop Garden ─── */
function RooftopGarden({ clippingPlanes }: { clippingPlanes: THREE.Plane[] }) {
  const gardenMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: VERDE_MUSGO,
        roughness: 0.7,
        metalness: 0.0,
        ...(clippingPlanes.length > 0 ? { clippingPlanes } : {}),
      }),
    [clippingPlanes],
  )

  return (
    <group position={[0, 0, 0]}>
      {/* Garden bed */}
      <mesh position={[0, 0.06, 0]} material={gardenMat}>
        <boxGeometry args={[BUILDING_W * 0.7, 0.12, BUILDING_D * 0.6]} />
      </mesh>
      {/* Trees */}
      {[
        [-1.2, 0.35, -0.6],
        [0.8, 0.28, 0.5],
        [-0.3, 0.22, 0.8],
        [1.3, 0.4, -0.4],
        [0.0, 0.25, -0.9],
        [-0.7, 0.3, 0.3],
      ].map((pos, i) => (
        <group key={i} position={pos as [number, number, number]}>
          <mesh position={[0, 0.15, 0]} material={trunkMat}>
            <cylinderGeometry args={[0.018, 0.025, 0.3, 6]} />
          </mesh>
          <mesh position={[0, 0.38, 0]} material={gardenMat}>
            <sphereGeometry args={[0.1 + i * 0.01, 8, 6]} />
          </mesh>
        </group>
      ))}
      {/* Lounge area */}
      <mesh position={[0.3, 0.04, -0.5]} material={loungeMat}>
        <boxGeometry args={[0.9, 0.03, 0.45]} />
      </mesh>
      {/* Lounge seating */}
      <mesh position={[0.15, 0.06, -0.5]} material={bronceMat}>
        <boxGeometry args={[0.25, 0.06, 0.25]} />
      </mesh>
      <mesh position={[0.55, 0.06, -0.5]} material={bronceMat}>
        <boxGeometry args={[0.25, 0.06, 0.25]} />
      </mesh>
      {/* Terrace railing */}
      <mesh position={[0, 0.15, BUILDING_D * 0.28]} material={bronceMat}>
        <boxGeometry args={[BUILDING_W * 0.85, 0.015, 0.01]} />
      </mesh>
      <mesh position={[0, 0.15, -BUILDING_D * 0.28]} material={bronceMat}>
        <boxGeometry args={[BUILDING_W * 0.85, 0.015, 0.01]} />
      </mesh>
    </group>
  )
}

/* ─── Ground Plane ─── */
function GroundPlane() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
      <planeGeometry args={[40, 40]} />
      <meshStandardMaterial color="#0A0A0A" roughness={1} metalness={0} />
    </mesh>
  )
}

/* ─── Building Model ─── */
function BuildingModel({
  viewMode,
  selectedLevel,
  hoveredLevel,
  onFloorClick,
  onFloorHover,
  clippingPlanes,
}: {
  viewMode: ViewMode
  selectedLevel: number
  hoveredLevel: number | null
  onFloorClick: (groupIndex: number) => void
  onFloorHover: (groupIndex: number | null) => void
  clippingPlanes: THREE.Plane[]
}) {
  const groupRef = useRef<THREE.Group>(null)

  const explodedOffsets = useMemo(() => {
    if (viewMode !== 'exploded') return FLOOR_CONFIGS.map(() => 0)
    const offsets: number[] = []
    let accumulated = 0
    FLOOR_CONFIGS.forEach((_floor, i) => {
      offsets.push(accumulated)
      accumulated += 0.5 + i * 0.03
    })
    return offsets
  }, [viewMode])

  useFrame(() => {
    if (!groupRef.current) return
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0, 0.05)
  })

  return (
    <group ref={groupRef} position={[0, -TOTAL_BUILDING_HEIGHT / 2, 0]}>
      {FLOOR_CONFIGS.map((config) => (
        <BuildingFloor
          key={config.levelIndex}
          config={config}
          viewMode={viewMode}
          isSelected={selectedLevel === config.groupIndex}
          isHovered={hoveredLevel === config.groupIndex}
          explodedOffset={explodedOffsets[config.levelIndex]}
          onSelect={() => onFloorClick(config.groupIndex)}
          onHover={(h) => onFloorHover(h ? config.groupIndex : null)}
          clippingPlanes={clippingPlanes}
        />
      ))}

      {FLOOR_CONFIGS.filter((c) => c.type === 'rooftop').map((config) => (
        <group key={`garden-${config.levelIndex}`} position={[0, config.baseY + config.height, 0]}>
          <RooftopGarden clippingPlanes={clippingPlanes} />
        </group>
      ))}
    </group>
  )
}

/* ─── Camera Controller ─── */
function CameraController({
  viewMode,
  selectedLevel,
}: {
  viewMode: ViewMode
  selectedLevel: number
}) {
  const { camera } = useThree()
  const controlsRef = useRef<any>(null)
  const targetPos = useRef(new THREE.Vector3(9, 7, 9))
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0))

  useEffect(() => {
    switch (viewMode) {
      case 'exploded':
        targetPos.current.set(9, 7, 9)
        targetLookAt.current.set(0, 0, 0)
        break
      case 'corte':
        targetPos.current.set(0, 4, 12)
        targetLookAt.current.set(0, 0, 0)
        break
      case 'fachada':
        targetPos.current.set(7, 5, 7)
        targetLookAt.current.set(0, 0, 0)
        break
    }
  }, [viewMode])

  useEffect(() => {
    if (selectedLevel < 0) return
    const groupFloors = FLOOR_CONFIGS.filter((f) => f.groupIndex === selectedLevel)
    if (groupFloors.length === 0) return
    const avgY = groupFloors.reduce((s, f) => s + f.baseY, 0) / groupFloors.length - TOTAL_BUILDING_HEIGHT / 2
    targetLookAt.current.set(0, avgY, 0)
  }, [selectedLevel])

  useFrame(() => {
    camera.position.lerp(targetPos.current, 0.02)
    if (controlsRef.current) {
      const ctrl = controlsRef.current as unknown as { target: THREE.Vector3; update: () => void }
      ctrl.target.lerp(targetLookAt.current, 0.02)
      ctrl.update()
    }
  })

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      minDistance={4}
      maxDistance={30}
      maxPolarAngle={Math.PI / 2.1}
      minPolarAngle={0.2}
      target={[0, 0, 0]}
    />
  )
}

/* ─── Scene (inside Canvas) ─── */
function Scene({
  viewMode,
  selectedLevel,
  hoveredLevel,
  onFloorClick,
  onFloorHover,
}: BuildingSceneProps) {
  const clippingPlanes = useMemo(() => {
    if (viewMode === 'corte') {
      return [new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0)]
    }
    return [] as THREE.Plane[]
  }, [viewMode])

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 15, 8]}
        intensity={1.2}
        castShadow
      />
      <directionalLight position={[-5, 8, -5]} intensity={0.3} />
      <pointLight position={[0, 3, 0]} intensity={0.5} color={BRONCE} distance={20} />
      <pointLight position={[0, -2, 0]} intensity={0.2} color="#334455" distance={15} />
      <hemisphereLight args={['#1A1A2E', '#0A0A0A', 0.3]} />

      <GroundPlane />

      <BuildingModel
        viewMode={viewMode}
        selectedLevel={selectedLevel}
        hoveredLevel={hoveredLevel}
        onFloorClick={onFloorClick}
        onFloorHover={onFloorHover}
        clippingPlanes={clippingPlanes}
      />

      {viewMode === 'corte' && (
        <mesh position={[-0.01, 0, 0]}>
          <planeGeometry args={[0.02, 24]} />
          <meshBasicMaterial color={BRONCE} transparent opacity={0.15} side={THREE.DoubleSide} />
        </mesh>
      )}

      <CameraController viewMode={viewMode} selectedLevel={selectedLevel} />

      <fog attach="fog" args={['#0A0A0A', 18, 40]} />
    </>
  )
}

/* ─── Main Export ─── */
export default function BuildingScene(props: BuildingSceneProps) {
  return (
    <Canvas
      camera={{ position: [9, 7, 9], fov: 38, near: 0.1, far: 100 }}
      shadows
      dpr={[1, 1.5]}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
        localClippingEnabled: true,
      }}
      style={{ background: '#0A0A0A' }}
    >
      <Scene {...props} />
    </Canvas>
  )
}
