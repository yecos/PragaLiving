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
const VERDE_BIOPHILIC = '#3D5E3A'
const CONCRETE_DARK = '#1A1A1A'
const CONCRETE_MED = '#222222'
const PARKING_DARK = '#0F0F0F'
const GLASS_COLOR = '#4A6070'
const ATRIUM_COLOR = '#0D0D0D'
const SOCIAL_ACCENT = '#2A2218'
// Asymmetric facade materials
const BRICK_WARM = '#2E2418'     // Exposed brick side - warm concrete/brick tone
const METAL_DARK = '#141820'     // Dark metal/glass side - cool metallic tone

/* ─── Building Dimensions (scale: 1 unit ≈ 5m) ─── */
const BUILDING_W = 9.1    // ~45.5m footprint (long rectangular slab)
const BUILDING_D = 3.5    // ~17.5m footprint (narrow depth)
const ATRIUM_W = 1.5      // Central atrium width
const ATRIUM_D = 2.5      // Atrium depth (runs through center)

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
  residentialFloor: number // 0 for non-residential, 1-11 for residential floors
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
    residentialFloor: number = 0,
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
      residentialFloor,
    })
    y += height + FLOOR_GAP
  }

  // Sótanos 1-4 (underground parking: Sótanos 1-3 + visitor parking)
  for (let i = 0; i < 4; i++) {
    push(7, `Sótano ${4 - i}`, 'parking', BUILDING_W, BUILDING_D, 0.5, false, false, false)
  }
  // Nivel Acceso (double-height lobby)
  push(6, '1° Piso / Acceso', 'access', BUILDING_W, BUILDING_D, 0.8, true, false, false)
  // Nivel Comercial (Locales 9701/9801)
  push(5, 'Nivel Comercial', 'commercial', BUILDING_W, BUILDING_D, 0.6, true, false, false)
  // Zona Social (Gym, Pool, Sauna)
  push(4, 'Zona Social', 'social', BUILDING_W, BUILDING_D, 0.65, true, false, false)
  // Pisos 1-4 (Tipo A corner + Tipo B interior)
  for (let i = 0; i < 4; i++) {
    const taper = 1 - (i + 1) * 0.005
    push(3, `Piso ${i + 1}`, 'residential', BUILDING_W * taper, BUILDING_D * taper, 0.6, true, i % 2 === 1, true, i + 1)
  }
  // Pisos 5-8
  for (let i = 0; i < 4; i++) {
    const taper = 1 - (i + 5) * 0.005
    push(2, `Piso ${i + 5}`, 'residential', BUILDING_W * taper, BUILDING_D * taper, 0.6, true, i % 2 === 0, true, i + 5)
  }
  // Pisos 9-11 (Premium)
  for (let i = 0; i < 3; i++) {
    const taper = 1 - (i + 9) * 0.005
    push(1, `Piso ${i + 9}`, 'residential', BUILDING_W * taper, BUILDING_D * taper, 0.6, true, i === 1, true, i + 9)
  }
  // Cubierta / Rooftop (Terraza panorámica + Jardín elevado)
  push(0, 'Cubierta', 'rooftop', BUILDING_W * 0.92, BUILDING_D * 0.88, 0.3, false, true, false)

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

const biophilicGreenMat = new THREE.MeshStandardMaterial({
  color: VERDE_BIOPHILIC,
  roughness: 0.65,
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

// Asymmetric facade materials
const brickFacadeMat = new THREE.MeshStandardMaterial({
  color: BRICK_WARM,
  roughness: 0.85,
  metalness: 0.04,
})

const metalFacadeMat = new THREE.MeshStandardMaterial({
  color: METAL_DARK,
  roughness: 0.4,
  metalness: 0.35,
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
  const windowCols = cols ?? Math.max(3, Math.round(width * 2.5))
  const rows = Math.max(1, Math.round(height * 2.5))
  const windowW = (width * 0.85) / windowCols
  const windowH = (height * 0.55) / rows
  const spacingX = (width * 0.85) / windowCols
  const spacingY = (height * 0.55) / rows

  const meshes = useMemo(() => {
    const items: { pos: [number, number, number]; key: string }[] = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < windowCols; c++) {
        const x = -width * 0.4 + c * spacingX + spacingX / 2
        const y = -height * 0.15 + r * spacingY + spacingY / 2
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

/* ─── Chevron Balcony Component ─── */
function ChevronBalcony({
  width,
  height,
  depth,
  isOddFloor,
  side,
}: {
  width: number
  height: number
  depth: number
  isOddFloor: boolean
  side: 'front' | 'back'
}) {
  const balconyDepth = 0.28
  const balconyThickness = 0.04
  const railingHeight = 0.12

  // Chevron logic: on odd floors, front balconies protrude more on left side
  // On even floors, front balconies protrude more on right side
  // This creates a zigzag sawtooth pattern

  const segmentCount = 12 // 12 apartments per floor = 12 balcony segments
  const segWidth = (width * 0.9) / segmentCount
  const zSign = side === 'front' ? 1 : -1
  const zBase = side === 'front' ? depth / 2 : -depth / 2

  return (
    <group position={[0, height * 0.15, 0]}>
      {Array.from({ length: segmentCount }, (_, i) => {
        const x = -width * 0.45 + segWidth * (i + 0.5)
        // Chevron zigzag: alternate depth based on floor parity and segment position
        const isLeftSegment = i < segmentCount / 2
        let protrusion: number
        if (isOddFloor) {
          // Odd floor: left side protrudes more on front, right side on back
          protrusion = side === 'front'
            ? (isLeftSegment ? balconyDepth * 1.4 : balconyDepth * 0.7)
            : (isLeftSegment ? balconyDepth * 0.7 : balconyDepth * 1.4)
        } else {
          // Even floor: right side protrudes more on front, left side on back
          protrusion = side === 'front'
            ? (isLeftSegment ? balconyDepth * 0.7 : balconyDepth * 1.4)
            : (isLeftSegment ? balconyDepth * 1.4 : balconyDepth * 0.7)
        }

        return (
          <group key={`balc-${side}-${i}`}>
            {/* Balcony slab */}
            <mesh
              position={[x, 0, zBase * (1 + protrusion / depth) + zSign * protrusion / 2]}
              material={balconyMat}
            >
              <boxGeometry args={[segWidth * 0.88, balconyThickness, protrusion]} />
            </mesh>
            {/* Railing top bar */}
            <mesh
              position={[x, railingHeight, zBase * (1 + protrusion / depth) + zSign * protrusion / 2 + zSign * protrusion * 0.4]}
              material={bronceMat}
            >
              <boxGeometry args={[segWidth * 0.85, 0.012, 0.008]} />
            </mesh>
            {/* Railing vertical posts */}
            <mesh
              position={[x - segWidth * 0.38, railingHeight * 0.5, zBase * (1 + protrusion / depth) + zSign * protrusion * 0.9]}
              material={bronceMat}
            >
              <boxGeometry args={[0.008, railingHeight, 0.008]} />
            </mesh>
            <mesh
              position={[x + segWidth * 0.38, railingHeight * 0.5, zBase * (1 + protrusion / depth) + zSign * protrusion * 0.9]}
              material={bronceMat}
            >
              <boxGeometry args={[0.008, railingHeight, 0.008]} />
            </mesh>
          </group>
        )
      })}
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
  const isOddFloor = config.residentialFloor % 2 === 1

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

  // Window columns: 12 apartments per floor → 12 window groups on long sides
  const longWindowCols = config.type === 'residential' ? 12 : config.type === 'social' || config.type === 'commercial' ? 6 : 4
  const shortWindowCols = config.type === 'residential' ? 4 : config.type === 'social' || config.type === 'commercial' ? 3 : 2

  return (
    <group ref={groupRef} position={[0, config.baseY, 0]}>
      {/* ─── Main Building Slab (single rectangular volume with atrium void) ─── */}
      <mesh
        position={[0, height / 2, 0]}
        material={currentFloorMat}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <boxGeometry args={[width, height, depth]} />
      </mesh>

      {/* ─── Asymmetric Facade Panels ─── */}
      {/* Left long side: Exposed brick (warm tone) */}
      <mesh
        position={[-width / 2 - 0.005, height / 2, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        material={brickFacadeMat}
      >
        <planeGeometry args={[depth, height]} />
      </mesh>
      {/* Right long side: Dark metal/glass (cool metallic tone) */}
      <mesh
        position={[width / 2 + 0.005, height / 2, 0]}
        rotation={[0, Math.PI / 2, 0]}
        material={metalFacadeMat}
      >
        <planeGeometry args={[depth, height]} />
      </mesh>

      {/* ─── Floor Plate (full width) ─── */}
      <mesh position={[0, 0.01, 0]} material={concreteMedMat}>
        <boxGeometry args={[width, FLOOR_PLATE_THICKNESS, depth]} />
      </mesh>

      {/* ─── Central Core (2 Elevators + Stairwell) ─── */}
      <mesh position={[0, height / 2, 0]} material={coreMat}>
        <boxGeometry args={[ATRIUM_W * 0.9, height - FLOOR_PLATE_THICKNESS, depth * 0.25]} />
      </mesh>

      {/* ─── Atrium Void (central courtyard/patio) ─── */}
      <mesh position={[0, height / 2, depth * 0.05]} material={atriumMat}>
        <boxGeometry args={[ATRIUM_W * 0.85, height - FLOOR_PLATE_THICKNESS, ATRIUM_D]} />
      </mesh>

      {/* ─── Atrium walkway/railing on residential floors ─── */}
      {config.hasBalcony && (
        <>
          {/* Curved walkway along atrium */}
          <mesh position={[0, height * 0.12, depth * 0.05]} material={bronceMat}>
            <boxGeometry args={[ATRIUM_W * 0.75, 0.02, ATRIUM_D * 0.15]} />
          </mesh>
          {/* Atrium vegetation strips */}
          <mesh position={[-ATRIUM_W * 0.3, height * 0.08, depth * 0.05 + ATRIUM_D * 0.2]} material={biophilicGreenMat}>
            <boxGeometry args={[0.12, 0.06, ATRIUM_D * 0.4]} />
          </mesh>
          <mesh position={[ATRIUM_W * 0.3, height * 0.08, depth * 0.05 - ATRIUM_D * 0.2]} material={biophilicGreenMat}>
            <boxGeometry args={[0.12, 0.06, ATRIUM_D * 0.4]} />
          </mesh>
        </>
      )}

      {/* ─── Highlight overlay ─── */}
      {(isSelected || isHovered) && (
        <mesh position={[0, height / 2, 0]} material={highlightMat}>
          <boxGeometry args={[width + 0.01, height + 0.01, depth + 0.01]} />
        </mesh>
      )}

      {/* ─── Windows on residential/social/commercial levels ─── */}
      {config.hasWindows && (
        <>
          {/* Front face windows (long side) */}
          <WindowGrid
            width={width}
            height={height * 0.75}
            position={[0, height / 2, depth / 2 + 0.01]}
            rotation={[0, 0, 0]}
            cols={longWindowCols}
          />
          {/* Back face windows (long side) */}
          <WindowGrid
            width={width}
            height={height * 0.75}
            position={[0, height / 2, -depth / 2 - 0.01]}
            rotation={[0, Math.PI, 0]}
            cols={longWindowCols}
          />
          {/* Left short side windows (brick side) */}
          <WindowGrid
            width={depth * 0.85}
            height={height * 0.65}
            position={[-width / 2 - 0.01, height / 2, 0]}
            rotation={[0, -Math.PI / 2, 0]}
            cols={shortWindowCols}
          />
          {/* Right short side windows (metal side) */}
          <WindowGrid
            width={depth * 0.85}
            height={height * 0.65}
            position={[width / 2 + 0.01, height / 2, 0]}
            rotation={[0, Math.PI / 2, 0]}
            cols={shortWindowCols}
          />
        </>
      )}

      {/* ─── Chevron/Zigzag Balconies on residential floors ─── */}
      {config.hasBalcony && (
        <>
          <ChevronBalcony
            width={width}
            height={height}
            depth={depth}
            isOddFloor={isOddFloor}
            side="front"
          />
          <ChevronBalcony
            width={width}
            height={height}
            depth={depth}
            isOddFloor={isOddFloor}
            side="back"
          />
        </>
      )}

      {/* ─── Greenery on balconies and vertical landscaping ─── */}
      {config.hasGreenery && (
        <>
          {/* Vertical landscaping strips on front facade */}
          {[-width * 0.35, -width * 0.1, width * 0.15, width * 0.4].map((xOff, idx) => (
            <group key={`vgf-${idx}`} position={[xOff, height * 0.4, depth / 2 + 0.15]}>
              <mesh material={biophilicGreenMat}>
                <boxGeometry args={[0.08, height * 0.5, 0.06]} />
              </mesh>
              {/* Individual plants */}
              {[0, 0.15, 0.3].map((yOff, pi) => (
                <mesh key={pi} position={[0, -height * 0.15 + yOff, 0.05]} material={greenMat}>
                  <sphereGeometry args={[0.045, 6, 5]} />
                </mesh>
              ))}
            </group>
          ))}
          {/* Vertical landscaping strips on back facade */}
          {[-width * 0.3, width * 0.05, width * 0.35].map((xOff, idx) => (
            <group key={`vgb-${idx}`} position={[xOff, height * 0.4, -depth / 2 - 0.15]}>
              <mesh material={biophilicGreenMat}>
                <boxGeometry args={[0.08, height * 0.45, 0.06]} />
              </mesh>
              {[0, 0.18].map((yOff, pi) => (
                <mesh key={pi} position={[0, -height * 0.12 + yOff, -0.05]} material={greenMat}>
                  <sphereGeometry args={[0.05, 6, 5]} />
                </mesh>
              ))}
            </group>
          ))}
          {/* Balcony planters */}
          {Array.from({ length: 6 }, (_, i) => {
            const x = -width * 0.38 + i * (width * 0.76 / 5)
            return (
              <group key={`bp-${i}`} position={[x, height * 0.15 + 0.05, depth / 2 + 0.22]}>
                <mesh material={trunkMat}>
                  <cylinderGeometry args={[0.012, 0.016, 0.06, 5]} />
                </mesh>
                <mesh position={[0, 0.05, 0]} material={greenMat}>
                  <sphereGeometry args={[0.04, 6, 5]} />
                </mesh>
              </group>
            )
          })}
          {/* Additional greenery on atrium side */}
          <mesh position={[-ATRIUM_W * 0.15, height * 0.15, depth * 0.05 + ATRIUM_D * 0.35]} material={greenMat}>
            <boxGeometry args={[0.2, 0.1, 0.15]} />
          </mesh>
          <mesh position={[ATRIUM_W * 0.15, height * 0.15, depth * 0.05 - ATRIUM_D * 0.35]} material={greenMat}>
            <boxGeometry args={[0.2, 0.1, 0.15]} />
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
        <mesh position={[0, height * 0.4, depth / 2 + 0.1]} material={glassSharedMat}>
          <boxGeometry args={[ATRIUM_W * 1.2, height * 0.55, 0.02]} />
        </mesh>
      )}

      {/* ─── Social level: pool indication ─── */}
      {config.type === 'social' && (
        <>
          <mesh position={[width * 0.15, height * 0.15, depth * 0.1]} material={glassSharedMat}>
            <boxGeometry args={[width * 0.3, 0.04, depth * 0.35]} />
          </mesh>
          {/* Sauna/steam room */}
          <mesh position={[-width * 0.3, height * 0.2, 0]} material={coreMat}>
            <boxGeometry args={[width * 0.12, height * 0.3, depth * 0.2]} />
          </mesh>
        </>
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
      {/* Garden bed - terraza panorámica */}
      <mesh position={[0, 0.06, 0]} material={gardenMat}>
        <boxGeometry args={[BUILDING_W * 0.75, 0.12, BUILDING_D * 0.65]} />
      </mesh>
      {/* Jardín elevado - elevated garden planters */}
      <mesh position={[-BUILDING_W * 0.25, 0.1, BUILDING_D * 0.1]} material={biophilicGreenMat}>
        <boxGeometry args={[BUILDING_W * 0.15, 0.15, BUILDING_D * 0.25]} />
      </mesh>
      <mesh position={[BUILDING_W * 0.2, 0.1, -BUILDING_D * 0.1]} material={biophilicGreenMat}>
        <boxGeometry args={[BUILDING_W * 0.12, 0.12, BUILDING_D * 0.2]} />
      </mesh>
      {/* Trees - more extensive for jardín elevado */}
      {[
        [-2.5, 0.4, -0.8],
        [1.8, 0.32, 0.7],
        [-0.8, 0.28, 1.0],
        [2.8, 0.45, -0.5],
        [0.0, 0.3, -1.2],
        [-1.5, 0.35, 0.4],
        [3.2, 0.38, 0.2],
        [-3.0, 0.3, -0.3],
        [0.8, 0.25, 0.9],
        [-0.3, 0.42, -0.6],
      ].map((pos, i) => (
        <group key={i} position={pos as [number, number, number]}>
          <mesh position={[0, 0.18, 0]} material={trunkMat}>
            <cylinderGeometry args={[0.015, 0.022, 0.35, 6]} />
          </mesh>
          <mesh position={[0, 0.42, 0]} material={gardenMat}>
            <sphereGeometry args={[0.08 + i * 0.008, 7, 6]} />
          </mesh>
        </group>
      ))}
      {/* Lounge area */}
      <mesh position={[0.8, 0.04, -0.6]} material={loungeMat}>
        <boxGeometry args={[1.2, 0.03, 0.5]} />
      </mesh>
      {/* Lounge seating */}
      <mesh position={[0.4, 0.06, -0.6]} material={bronceMat}>
        <boxGeometry args={[0.3, 0.06, 0.3]} />
      </mesh>
      <mesh position={[1.0, 0.06, -0.6]} material={bronceMat}>
        <boxGeometry args={[0.3, 0.06, 0.3]} />
      </mesh>
      {/* Terrace railing - front and back */}
      <mesh position={[0, 0.15, BUILDING_D * 0.28]} material={bronceMat}>
        <boxGeometry args={[BUILDING_W * 0.88, 0.015, 0.01]} />
      </mesh>
      <mesh position={[0, 0.15, -BUILDING_D * 0.28]} material={bronceMat}>
        <boxGeometry args={[BUILDING_W * 0.88, 0.015, 0.01]} />
      </mesh>
      {/* Side railings */}
      <mesh position={[-BUILDING_W * 0.42, 0.15, 0]} rotation={[0, Math.PI / 2, 0]} material={bronceMat}>
        <boxGeometry args={[BUILDING_D * 0.5, 0.015, 0.01]} />
      </mesh>
      <mesh position={[BUILDING_W * 0.42, 0.15, 0]} rotation={[0, Math.PI / 2, 0]} material={bronceMat}>
        <boxGeometry args={[BUILDING_D * 0.5, 0.015, 0.01]} />
      </mesh>
    </group>
  )
}

/* ─── Ground Plane ─── */
function GroundPlane() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
      <planeGeometry args={[50, 50]} />
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
  const targetPos = useRef(new THREE.Vector3(12, 8, 12))
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0))

  useEffect(() => {
    switch (viewMode) {
      case 'exploded':
        targetPos.current.set(12, 8, 12)
        targetLookAt.current.set(0, 0, 0)
        break
      case 'corte':
        targetPos.current.set(0, 5, 15)
        targetLookAt.current.set(0, 0, 0)
        break
      case 'fachada':
        targetPos.current.set(10, 6, 10)
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
      minDistance={5}
      maxDistance={40}
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
        position={[12, 18, 10]}
        intensity={1.2}
        castShadow
      />
      <directionalLight position={[-6, 10, -6]} intensity={0.3} />
      <pointLight position={[0, 3, 0]} intensity={0.5} color={BRONCE} distance={25} />
      <pointLight position={[0, -2, 0]} intensity={0.2} color="#334455" distance={18} />
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
          <planeGeometry args={[0.02, 30]} />
          <meshBasicMaterial color={BRONCE} transparent opacity={0.15} side={THREE.DoubleSide} />
        </mesh>
      )}

      <CameraController viewMode={viewMode} selectedLevel={selectedLevel} />

      <fog attach="fog" args={['#0A0A0A', 22, 50]} />
    </>
  )
}

/* ─── Main Export ─── */
export default function BuildingScene(props: BuildingSceneProps) {
  return (
    <Canvas
      camera={{ position: [12, 8, 12], fov: 36, near: 0.1, far: 120 }}
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
