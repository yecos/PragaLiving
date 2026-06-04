'use client'

import { useRef, useMemo, useEffect, useState, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF, ContactShadows } from '@react-three/drei'
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

/* ─── Constants ─── */
const BRONCE = '#8B6B4B'
const MODEL_PATH = '/models/praga-building.glb'

/* ─── Building Level Y-ranges (normalized to model bounds) ─── */
const LEVEL_RANGES: { name: string; yMin: number; yMax: number; groupIndex: number }[] = [
  { name: 'Cubierta', yMin: 5.0, yMax: 6.0, groupIndex: 0 },
  { name: 'Pisos 9-12', yMin: 3.0, yMax: 5.0, groupIndex: 1 },
  { name: 'Pisos 5-8', yMin: 1.0, yMax: 3.0, groupIndex: 2 },
  { name: 'Pisos 1-4', yMin: -1.0, yMax: 1.0, groupIndex: 3 },
  { name: 'Zona Social', yMin: -2.0, yMax: -1.0, groupIndex: 4 },
  { name: 'Nivel Comercial', yMin: -3.0, yMax: -2.0, groupIndex: 5 },
  { name: 'Nivel Acceso', yMin: -4.0, yMax: -3.0, groupIndex: 6 },
  { name: 'Sótanos 1-3', yMin: -6.0, yMax: -4.0, groupIndex: 7 },
]

/* ─── Level Highlight Box ─── */
function LevelHighlight({ yMin, yMax, isHovered, isSelected }: { yMin: number; yMax: number; isHovered: boolean; isSelected: boolean }) {
  const height = yMax - yMin
  const y = (yMin + yMax) / 2

  return (
    <mesh position={[0, y, 0]}>
      <boxGeometry args={[7, height, 5]} />
      <meshBasicMaterial
        color={BRONCE}
        transparent
        opacity={isSelected ? 0.12 : isHovered ? 0.06 : 0}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}

/* ─── Real GLB Model Loader (calls useGLTF at top level — no conditional hooks) ─── */
function LoadedGLBModel({
  selectedLevel,
  hoveredLevel,
  onFloorClick,
  onFloorHover,
  clippingPlanes,
}: {
  selectedLevel: number
  hoveredLevel: number | null
  onFloorClick: (groupIndex: number) => void
  onFloorHover: (groupIndex: number | null) => void
  clippingPlanes: THREE.Plane[]
}) {
  const groupRef = useRef<THREE.Group>(null)
  const gltf = useGLTF(MODEL_PATH)
  const scene = gltf.scene

  // Apply PRAGA materials override
  useEffect(() => {
    scene.traverse((child: any) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: '#1A1A1A',
          roughness: 0.75,
          metalness: 0.1,
          ...(clippingPlanes.length > 0 ? { clippingPlanes } : {}),
        })
        child.castShadow = true
        child.receiveShadow = true
      }
    })
  }, [scene, clippingPlanes])

  useFrame(() => {
    if (!groupRef.current) return
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0, 0.05)
  })

  return (
    <group ref={groupRef}>
      <primitive object={scene.clone()} />
      {/* Level highlights */}
      {selectedLevel >= 0 && selectedLevel < LEVEL_RANGES.length && (
        <LevelHighlight
          yMin={LEVEL_RANGES[selectedLevel].yMin}
          yMax={LEVEL_RANGES[selectedLevel].yMax}
          isHovered={false}
          isSelected
        />
      )}
      {hoveredLevel !== null && hoveredLevel !== selectedLevel && hoveredLevel < LEVEL_RANGES.length && (
        <LevelHighlight
          yMin={LEVEL_RANGES[hoveredLevel].yMin}
          yMax={LEVEL_RANGES[hoveredLevel].yMax}
          isHovered
          isSelected={false}
        />
      )}
      {/* Level click zones */}
      {LEVEL_RANGES.map((level) => (
        <mesh
          key={level.name}
          position={[0, (level.yMin + level.yMax) / 2, 0]}
          visible={false}
          onClick={(e) => { e.stopPropagation(); onFloorClick(level.groupIndex) }}
          onPointerOver={(e) => { e.stopPropagation(); onFloorHover(level.groupIndex) }}
          onPointerOut={(e) => { e.stopPropagation(); onFloorHover(null) }}
        >
          <boxGeometry args={[8, level.yMax - level.yMin, 6]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      ))}
    </group>
  )
}

/* ─── Error Boundary for GLB loading ─── */
class ModelErrorBoundary extends (require('react') as any).Component {
  state: { hasError: boolean }
  props: { fallback: React.ReactNode; children: React.ReactNode }

  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
    this.props = props
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

/* ─── Procedural Building Fallback ─── */
function ProceduralBuilding() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      Math.sin(state.clock.elapsedTime * 0.15) * 0.1,
      0.02
    )
  })

  const floors = useMemo(() => {
    const items: { y: number; height: number; width: number; depth: number; color: string }[] = []
    let y = -6
    const types = [
      { name: 'Sótano', count: 3, h: 0.5, color: '#161616' },
      { name: 'Acceso', count: 1, h: 0.8, color: '#1A1A1A' },
      { name: 'Comercial', count: 1, h: 0.6, color: '#1E1E1E' },
      { name: 'Social', count: 1, h: 0.65, color: '#1A1A1A' },
      { name: 'Residencial', count: 12, h: 0.45, color: '#1C1C1C' },
      { name: 'Cubierta', count: 1, h: 0.3, color: '#222222' },
    ]

    for (const type of types) {
      for (let i = 0; i < type.count; i++) {
        const taper = 1 - Math.max(0, (y + 6) / 12) * 0.15
        items.push({
          y,
          height: type.h,
          width: 5.5 * taper,
          depth: 3.8 * taper,
          color: type.color,
        })
        y += type.h + 0.06
      }
    }
    return items
  }, [])

  // Calculate average depth for atrium (using last floor's depth as reference)
  const avgDepth = floors.length > 0 ? floors[floors.length - 1].depth : 3.8

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {floors.map((floor, i) => (
        <group key={i} position={[0, floor.y + floor.height / 2, 0]}>
          <mesh>
            <boxGeometry args={[floor.width, floor.height, floor.depth]} />
            <meshStandardMaterial color={floor.color} roughness={0.8} metalness={0.05} />
          </mesh>
          <mesh position={[0, 0, floor.depth / 2 + 0.005]}>
            <planeGeometry args={[floor.width * 0.85, floor.height * 0.5]} />
            <meshStandardMaterial color="#4A6070" roughness={0.15} metalness={0.1} transparent opacity={0.4} />
          </mesh>
          <mesh position={[0, 0, -floor.depth / 2 - 0.005]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[floor.width * 0.85, floor.height * 0.5]} />
            <meshStandardMaterial color="#4A6070" roughness={0.15} metalness={0.1} transparent opacity={0.4} />
          </mesh>
          <mesh position={[0, -floor.height / 2 + 0.02, 0]}>
            <boxGeometry args={[floor.width + 0.05, 0.04, floor.depth + 0.05]} />
            <meshStandardMaterial color="#222222" roughness={0.8} />
          </mesh>
        </group>
      ))}
      {/* Atrium void — uses avgDepth computed outside map */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.0, 12, avgDepth * 0.8]} />
        <meshStandardMaterial color="#0A0A0A" roughness={1} side={THREE.BackSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -6.1, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#0A0A0A" roughness={1} />
      </mesh>
    </group>
  )
}

/* ─── Building Model Wrapper — tries GLB, falls back to procedural ─── */
function BuildingModelWrapper({
  selectedLevel,
  hoveredLevel,
  onFloorClick,
  onFloorHover,
  clippingPlanes,
}: {
  selectedLevel: number
  hoveredLevel: number | null
  onFloorClick: (groupIndex: number) => void
  onFloorHover: (groupIndex: number | null) => void
  clippingPlanes: THREE.Plane[]
}) {
  return (
    <ModelErrorBoundary fallback={<ProceduralBuilding />}>
      <Suspense fallback={<ProceduralBuilding />}>
        <LoadedGLBModel
          selectedLevel={selectedLevel}
          hoveredLevel={hoveredLevel}
          onFloorClick={onFloorClick}
          onFloorHover={onFloorHover}
          clippingPlanes={clippingPlanes}
        />
      </Suspense>
    </ModelErrorBoundary>
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
  const targetPos = useRef(new THREE.Vector3(8, 4, 8))
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0))

  useEffect(() => {
    switch (viewMode) {
      case 'exploded':
        targetPos.current.set(8, 4, 8)
        targetLookAt.current.set(0, 0, 0)
        break
      case 'corte':
        targetPos.current.set(0, 2, 12)
        targetLookAt.current.set(0, 0, 0)
        break
      case 'fachada':
        targetPos.current.set(8, 3, 5)
        targetLookAt.current.set(0, 0, 0)
        break
    }
  }, [viewMode])

  useEffect(() => {
    if (selectedLevel < 0 || selectedLevel >= LEVEL_RANGES.length) return
    const level = LEVEL_RANGES[selectedLevel]
    const avgY = (level.yMin + level.yMax) / 2
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
  const clippingPlanes = useMemo(() => {
    if (viewMode === 'corte') {
      return [new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0)]
    }
    return [] as THREE.Plane[]
  }, [viewMode])

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[10, 15, 8]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-5, 8, -5]} intensity={0.4} />
      <pointLight position={[0, 3, 0]} intensity={0.6} color={BRONCE} distance={20} />
      <pointLight position={[0, -3, 0]} intensity={0.2} color="#334455" distance={15} />
      <hemisphereLight args={['#1A1A2E', '#0A0A0A', 0.3]} />

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -6.2, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#080808" roughness={1} metalness={0} />
      </mesh>

      {/* Contact shadows */}
      <ContactShadows
        position={[0, -6.1, 0]}
        opacity={0.3}
        scale={20}
        blur={2}
        far={15}
        color="#000000"
      />

      {/* Building Model — tries GLB, falls back to procedural */}
      <BuildingModelWrapper
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
      <fog attach="fog" args={['#0A0A0A', 18, 40]} />
    </>
  )
}

/* ─── Main Export ─── */
export default function BuildingScene(props: BuildingSceneProps) {
  return (
    <Canvas
      camera={{ position: [8, 4, 8], fov: 40, near: 0.1, far: 100 }}
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

// Preload the GLB model
useGLTF.preload(MODEL_PATH)
