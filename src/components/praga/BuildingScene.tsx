'use client'

import { useRef, useMemo, useCallback, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

/* ─── Types ─── */
type ViewMode = 'exploded' | 'corte' | 'fachada'

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
  floorNumber: number
}

interface BuildingSceneProps {
  viewMode: ViewMode
  selectedLevel: number
  hoveredLevel: number | null
  onFloorClick: (groupIndex: number) => void
  onFloorHover: (groupIndex: number | null) => void
}

/* ─── Constants ─── */
const BRONCE = '#8B6B4B'
const CONCRETE_DARK = '#1A1A1A'
const CONCRETE_MED = '#222222'
const GLASS_COLOR = '#4A6070'
const ATRIUM_COLOR = '#0D0D0D'
const GREEN_COLOR = '#4B5646'
const FLOOR_GAP = 0.08
const FLOOR_PLATE_THICKNESS = 0.1

/* ─── Floor Configuration Builder ─── */
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
      floorNumber: floors.length,
    })
    y += height + FLOOR_GAP
  }

  // Sótanos 1-3 (bottom)
  for (let i = 0; i < 3; i++) {
    push(7, `Sótano ${3 - i}`, 'parking', 6.0, 4.5, 0.55, false, false)
  }
  // Nivel Acceso
  push(6, 'Nivel Acceso', 'access', 5.5, 4.0, 0.8, true, false)
  // Nivel Comercial
  push(5, 'Nivel Comercial', 'commercial', 5.2, 3.8, 0.6, true, false)
  // Zona Social
  push(4, 'Zona Social', 'social', 5.0, 3.6, 0.65, true, false)
  // Pisos 1-4
  for (let i = 0; i < 4; i++) {
    const taper = 1 - (i + 1) * 0.015
    push(3, `Piso ${i + 1}`, 'residential', 4.6 * taper, 3.2 * taper, 0.5, true, i % 2 === 1)
  }
  // Pisos 5-8
  for (let i = 0; i < 4; i++) {
    const taper = 1 - (i + 5) * 0.015
    push(2, `Piso ${i + 5}`, 'residential', 4.6 * taper, 3.2 * taper, 0.5, true, i % 2 === 0)
  }
  // Pisos 9-12
  for (let i = 0; i < 4; i++) {
    const taper = 1 - (i + 9) * 0.015
    push(1, `Piso ${i + 9}`, 'residential', 4.6 * taper, 3.2 * taper, 0.5, true, i === 1 || i === 3)
  }
  // Cubierta
  push(0, 'Cubierta', 'rooftop', 3.8, 2.6, 0.3, false, true)

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

const atriumMat = new THREE.MeshStandardMaterial({
  color: ATRIUM_COLOR,
  roughness: 1,
  metalness: 0,
  side: THREE.BackSide,
})

const greenMat = new THREE.MeshStandardMaterial({
  color: GREEN_COLOR,
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
const loungeMat = new THREE.MeshStandardMaterial({ color: '#2A2218', roughness: 0.6, metalness: 0.3 })
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

/* ─── Window Grid Component ─── */
function WindowGrid({
  width,
  height,
  position,
  rotation,
}: {
  width: number
  height: number
  position: [number, number, number]
  rotation: [number, number, number]
}) {
  const cols = Math.max(3, Math.round(width * 2.5))
  const rows = 2
  const windowW = (width * 0.8) / cols
  const windowH = (height * 0.6) / rows
  const spacingX = (width * 0.8) / cols
  const spacingY = (height * 0.6) / rows

  const meshes = useMemo(() => {
    const items: { pos: [number, number, number]; key: string }[] = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = -width * 0.4 + c * spacingX + spacingX / 2
        const y = -height * 0.25 + r * spacingY + spacingY / 2
        items.push({ pos: [x, y, 0], key: `${r}-${c}` })
      }
    }
    return items
  }, [width, height, spacingX, spacingY, cols, rows])

  return (
    <group position={position} rotation={rotation}>
      {meshes.map(({ pos, key }) => (
        <mesh key={key} position={pos} material={glassSharedMat}>
          <boxGeometry args={[windowW * 0.85, windowH * 0.85, 0.02]} />
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

  const currentFloorMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: isSelected ? '#2A2218' : isHovered ? '#1E1A15' : config.type === 'parking' ? '#161616' : CONCRETE_DARK,
        roughness: 0.85,
        metalness: 0.05,
        ...(clippingPlanes.length > 0 ? { clippingPlanes } : {}),
      }),
    [isSelected, isHovered, config.type, clippingPlanes],
  )

  // Animated Y position for exploded view
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
  const atriumW = width * 0.2
  const halfW = (width - atriumW) / 2

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

  // Memoize edge geometry to avoid re-creation
  const edgeGeo = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(width, height, depth)),
    [width, height, depth],
  )

  return (
    <group ref={groupRef} position={[0, config.baseY, 0]}>
      {/* Left wing */}
      <mesh
        position={[-atriumW / 2 - halfW / 2, height / 2, 0]}
        material={currentFloorMat}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <boxGeometry args={[halfW, height, depth]} />
      </mesh>

      {/* Right wing */}
      <mesh
        position={[atriumW / 2 + halfW / 2, height / 2, 0]}
        material={currentFloorMat}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <boxGeometry args={[halfW, height, depth]} />
      </mesh>

      {/* Floor plate */}
      <mesh position={[0, 0.01, 0]} material={concreteMedMat}>
        <boxGeometry args={[width, FLOOR_PLATE_THICKNESS, depth]} />
      </mesh>

      {/* Atrium interior */}
      <mesh position={[0, height / 2, 0]} material={atriumMat}>
        <boxGeometry args={[atriumW, height - FLOOR_PLATE_THICKNESS, depth * 0.9]} />
      </mesh>

      {/* Highlight overlay when selected/hovered */}
      {(isSelected || isHovered) && (
        <>
          <mesh position={[-atriumW / 2 - halfW / 2, height / 2, 0]} material={highlightMat}>
            <boxGeometry args={[halfW + 0.01, height + 0.01, depth + 0.01]} />
          </mesh>
          <mesh position={[atriumW / 2 + halfW / 2, height / 2, 0]} material={highlightMat}>
            <boxGeometry args={[halfW + 0.01, height + 0.01, depth + 0.01]} />
          </mesh>
        </>
      )}

      {/* Windows */}
      {config.hasWindows && (
        <>
          <WindowGrid
            width={halfW}
            height={height * 0.8}
            position={[-atriumW / 2 - halfW / 2, height / 2, depth / 2 + 0.01]}
            rotation={[0, 0, 0]}
          />
          <WindowGrid
            width={halfW}
            height={height * 0.8}
            position={[atriumW / 2 + halfW / 2, height / 2, depth / 2 + 0.01]}
            rotation={[0, 0, 0]}
          />
          <WindowGrid
            width={halfW}
            height={height * 0.8}
            position={[-atriumW / 2 - halfW / 2, height / 2, -depth / 2 - 0.01]}
            rotation={[0, Math.PI, 0]}
          />
          <WindowGrid
            width={halfW}
            height={height * 0.8}
            position={[atriumW / 2 + halfW / 2, height / 2, -depth / 2 - 0.01]}
            rotation={[0, Math.PI, 0]}
          />
        </>
      )}

      {/* Balcony ledge on residential/social floors */}
      {(config.type === 'residential' || config.type === 'social') && (
        <mesh position={[0, height * 0.15, depth / 2 + 0.15]} material={concreteMedMat}>
          <boxGeometry args={[width * 0.95, 0.04, 0.3]} />
        </mesh>
      )}

      {/* Greenery on select floors */}
      {config.hasGreenery && (
        <>
          <mesh position={[-width * 0.3, height * 0.15 + 0.05, depth / 2 + 0.2]} material={greenMat}>
            <boxGeometry args={[0.25, 0.12, 0.2]} />
          </mesh>
          <mesh position={[width * 0.25, height * 0.15 + 0.05, depth / 2 + 0.2]} material={greenMat}>
            <boxGeometry args={[0.2, 0.1, 0.18]} />
          </mesh>
        </>
      )}

      {/* Edge lines */}
      <lineSegments geometry={edgeGeo} material={edgeMat} />

      {/* Bronce accent strip at base of access/commercial/social */}
      {(config.type === 'access' || config.type === 'commercial' || config.type === 'social') && (
        <mesh position={[0, 0.06, depth / 2 + 0.005]} material={bronceMat}>
          <boxGeometry args={[width, 0.03, 0.01]} />
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
        color: GREEN_COLOR,
        roughness: 0.7,
        metalness: 0.0,
        ...(clippingPlanes.length > 0 ? { clippingPlanes } : {}),
      }),
    [clippingPlanes],
  )

  return (
    <group position={[0, 0, 0]}>
      {/* Garden bed */}
      <mesh position={[0, 0.08, 0]} material={gardenMat}>
        <boxGeometry args={[3.0, 0.15, 2.0]} />
      </mesh>
      {/* Trees */}
      {[
        [-0.8, 0.3, -0.5],
        [0.6, 0.25, 0.3],
        [-0.2, 0.2, 0.6],
        [0.9, 0.35, -0.3],
      ].map((pos, i) => (
        <group key={i} position={pos as [number, number, number]}>
          <mesh position={[0, 0.15, 0]} material={trunkMat}>
            <cylinderGeometry args={[0.02, 0.03, 0.3, 6]} />
          </mesh>
          <mesh position={[0, 0.35, 0]} material={gardenMat}>
            <sphereGeometry args={[0.12, 8, 6]} />
          </mesh>
        </group>
      ))}
      {/* Lounge area */}
      <mesh position={[0, 0.05, -0.6]} material={loungeMat}>
        <boxGeometry args={[0.8, 0.04, 0.4]} />
      </mesh>
    </group>
  )
}

/* ─── Ground Plane ─── */
function GroundPlane() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
      <planeGeometry args={[30, 30]} />
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

  // Compute exploded offsets
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

  // Smooth rotation for cut view
  useFrame(() => {
    if (!groupRef.current) return
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0, 0.05)
  })

  return (
    <group ref={groupRef} position={[0, -TOTAL_BUILDING_HEIGHT / 2, 0]}>
      {FLOOR_CONFIGS.map((config, i) => (
        <BuildingFloor
          key={config.levelIndex}
          config={config}
          viewMode={viewMode}
          isSelected={selectedLevel === config.groupIndex}
          isHovered={hoveredLevel === config.groupIndex}
          explodedOffset={explodedOffsets[i]}
          onSelect={() => onFloorClick(config.groupIndex)}
          onHover={(h) => onFloorHover(h ? config.groupIndex : null)}
          clippingPlanes={clippingPlanes}
        />
      ))}

      {/* Rooftop garden on top floor */}
      {FLOOR_CONFIGS.filter((c) => c.type === 'rooftop').map((config) => (
        <group key={`garden-${config.levelIndex}`} position={[0, config.baseY + config.height, 0]}>
          <RooftopGarden clippingPlanes={clippingPlanes} />
        </group>
      ))}
    </group>
  )
}

/* ─── Camera Controller (uses useFrame for smooth animation) ─── */
function CameraController({
  viewMode,
  selectedLevel,
}: {
  viewMode: ViewMode
  selectedLevel: number
}) {
  const { camera } = useThree()
  const controlsRef = useRef<any>(null)
  const targetPos = useRef(new THREE.Vector3(8, 6, 8))
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0))

  // Update camera target when view mode changes
  useEffect(() => {
    switch (viewMode) {
      case 'exploded':
        targetPos.current.set(8, 6, 8)
        targetLookAt.current.set(0, 0, 0)
        break
      case 'corte':
        targetPos.current.set(0, 3, 10)
        targetLookAt.current.set(0, 0, 0)
        break
      case 'fachada':
        targetPos.current.set(6, 4, 6)
        targetLookAt.current.set(0, 0, 0)
        break
    }
  }, [viewMode])

  // Update camera target when floor is selected
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
      maxDistance={25}
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
  // Clipping planes for cut view
  const clippingPlanes = useMemo(() => {
    if (viewMode === 'corte') {
      return [new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0)]
    }
    return [] as THREE.Plane[]
  }, [viewMode])

  return (
    <>
      {/* Lighting */}
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

      {/* Ground */}
      <GroundPlane />

      {/* Building */}
      <BuildingModel
        viewMode={viewMode}
        selectedLevel={selectedLevel}
        hoveredLevel={hoveredLevel}
        onFloorClick={onFloorClick}
        onFloorHover={onFloorHover}
        clippingPlanes={clippingPlanes}
      />

      {/* Cut plane indicator */}
      {viewMode === 'corte' && (
        <mesh position={[-0.01, 0, 0]}>
          <planeGeometry args={[0.02, 20]} />
          <meshBasicMaterial color={BRONCE} transparent opacity={0.15} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Camera controller */}
      <CameraController viewMode={viewMode} selectedLevel={selectedLevel} />

      {/* Fog */}
      <fog attach="fog" args={['#0A0A0A', 15, 35]} />
    </>
  )
}

/* ─── Main Export ─── */
export default function BuildingScene(props: BuildingSceneProps) {
  return (
    <Canvas
      camera={{ position: [8, 6, 8], fov: 40, near: 0.1, far: 100 }}
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
