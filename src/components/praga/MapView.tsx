'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// ─── Types ───────────────────────────────────────────────
export interface POIPoint {
  name: string
  distance: string
  time: string
  description: string
  lat: number
  lng: number
}

export interface LocationLayer {
  id: string
  name: string
  icon: string
  color: string
  points: POIPoint[]
}

// ─── PRAGA center ────────────────────────────────────────
const PRAGA_CENTER: [number, number] = [4.65, -74.05]

// ─── Layer definitions with real-ish Bogotá offsets ──────
export const locationLayers: LocationLayer[] = [
  {
    id: 'movilidad',
    name: 'Movilidad',
    icon: '→',
    color: '#6B8FB5',
    points: [
      { name: 'Estación Metro', distance: '350m', time: '5 min', description: 'Acceso directo a línea principal del sistema de transporte masivo', lat: 4.6528, lng: -74.0535 },
      { name: 'Parada BRT', distance: '200m', time: '3 min', description: 'Sistema de transporte rápido con cobertura integral de la ciudad', lat: 4.6475, lng: -74.0488 },
      { name: 'Vía Principal', distance: '100m', time: '2 min', description: 'Conexión directa a la arteria vial más importante de la zona', lat: 4.6490, lng: -74.0555 },
    ]
  },
  {
    id: 'gastronomia',
    name: 'Gastronomía',
    icon: '◆',
    color: '#B56B8F',
    points: [
      { name: 'Restaurante Premium', distance: '150m', time: '2 min', description: 'Alta cocina en un entorno exclusivo con chefs reconocidos', lat: 4.6515, lng: -74.0472 },
      { name: 'Café Especialidad', distance: '100m', time: '1 min', description: 'Café de especialidad y repostería artesanal', lat: 4.6482, lng: -74.0510 },
      { name: 'Zona Gastronómica', distance: '400m', time: '6 min', description: 'Concentración de restaurantes y bares de autor', lat: 4.6538, lng: -74.0460 },
    ]
  },
  {
    id: 'comercio',
    name: 'Comercio',
    icon: '□',
    color: '#8B6B4B',
    points: [
      { name: 'Centro Comercial', distance: '500m', time: '7 min', description: 'Centro comercial con tiendas de lujo y marcas internacionales', lat: 4.6455, lng: -74.0450 },
      { name: 'Supermercado Premium', distance: '200m', time: '3 min', description: 'Supermercado gourmet con productos importados y orgánicos', lat: 4.6510, lng: -74.0530 },
      { name: 'Boutiques', distance: '300m', time: '4 min', description: 'Tiendas de diseño y moda independiente', lat: 4.6535, lng: -74.0505 },
    ]
  },
  {
    id: 'educacion',
    name: 'Educación',
    icon: '△',
    color: '#6B8F6B',
    points: [
      { name: 'Universidad', distance: '800m', time: '10 min', description: 'Institución educativa de prestigio con programas de pregrado y posgrado', lat: 4.6560, lng: -74.0445 },
      { name: 'Colegio Bilingüe', distance: '600m', time: '8 min', description: 'Colegio internacional con currículo bilingüe completo', lat: 4.6445, lng: -74.0520 },
    ]
  },
  {
    id: 'salud',
    name: 'Salud',
    icon: '○',
    color: '#6BB5A0',
    points: [
      { name: 'Clínica Premium', distance: '700m', time: '9 min', description: 'Centro médico de alta complejidad con especialidades completas', lat: 4.6555, lng: -74.0545 },
      { name: 'Farmacia 24h', distance: '150m', time: '2 min', description: 'Farmacia de turno con servicio de entrega a domicilio', lat: 4.6492, lng: -74.0478 },
    ]
  },
  {
    id: 'naturaleza',
    name: 'Naturaleza',
    icon: '◇',
    color: '#4B5646',
    points: [
      { name: 'Parque Principal', distance: '300m', time: '4 min', description: 'Parque urbano con senderos, lagos y zonas de esparcimiento', lat: 4.6470, lng: -74.0555 },
      { name: 'Ciclovía', distance: '100m', time: '1 min', description: 'Ruta ciclista dedicada con conexión a la red ciudadana', lat: 4.6518, lng: -74.0558 },
    ]
  },
]

// ─── Custom PRAGA marker icon ────────────────────────────
function createPragaIcon(): L.DivIcon {
  return L.divIcon({
    className: 'praga-marker-custom',
    html: `
      <div class="praga-marker-wrapper">
        <div class="praga-marker-pulse"></div>
        <div class="praga-marker-pulse praga-marker-pulse-delay"></div>
        <div class="praga-marker-pin">
          <span class="praga-marker-letter">P</span>
        </div>
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  })
}

// ─── Distance circle styling ─────────────────────────────
const DISTANCE_CIRCLES = [
  { radius: 200, label: '200m', opacity: 0.2 },
  { radius: 500, label: '500m', opacity: 0.12 },
  { radius: 1000, label: '1km', opacity: 0.08 },
]

// ─── Component props ─────────────────────────────────────
interface MapViewProps {
  activeLayer: string
  onPoiClick?: (poi: POIPoint) => void
  flyToTarget?: POIPoint | null
}

export default function MapView({ activeLayer, onPoiClick, flyToTarget }: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const layerGroupsRef = useRef<Map<string, L.LayerGroup>>(new Map())
  const isInitializedRef = useRef(false)

  // ─── Initialize map ──────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || isInitializedRef.current) return
    isInitializedRef.current = true

    const map = L.map(mapContainerRef.current, {
      center: PRAGA_CENTER,
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
    })

    // Dark tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map)

    // Add zoom control top-right
    L.control.zoom({ position: 'topright' }).addTo(map)

    // Minimal attribution
    L.control.attribution({ position: 'bottomright', prefix: false })
      .addAttribution('&copy; <a href="https://carto.com/">CARTO</a>')
      .addTo(map)

    // ─── Distance circles ──────────────────────────────
    DISTANCE_CIRCLES.forEach(({ radius, label, opacity }) => {
      const circle = L.circle(PRAGA_CENTER, {
        radius,
        color: '#8B6B4B',
        weight: 1,
        opacity,
        fillColor: '#8B6B4B',
        fillOpacity: opacity * 0.3,
        dashArray: '4 6',
        interactive: false,
      }).addTo(map)

      // Label at top of circle
      const labelPoint = L.latLng(PRAGA_CENTER[0] + (radius / 111320), PRAGA_CENTER[1])
      const labelMarker = L.marker(labelPoint, {
        icon: L.divIcon({
          className: 'praga-distance-label',
          html: `<span>${label}</span>`,
          iconSize: [40, 16],
          iconAnchor: [20, 8],
        }),
        interactive: false,
      }).addTo(map)
    })

    // ─── PRAGA main marker ─────────────────────────────
    const pragaIcon = createPragaIcon()
    const pragaMarker = L.marker(PRAGA_CENTER, { icon: pragaIcon, zIndexOffset: 1000 })
      .addTo(map)
      .bindPopup(
        `<div class="praga-popup">
          <div class="praga-popup-title">PRAGA Living</div>
          <div class="praga-popup-subtitle">Residencia de Lujo</div>
          <div class="praga-popup-detail">Bogotá, Colombia</div>
        </div>`,
        { className: 'praga-popup-container', closeButton: false, offset: [0, -10] }
      )
    // ─── Create POI layer groups ────────────────────────
    locationLayers.forEach(layer => {
      const group = L.layerGroup()

      layer.points.forEach(poi => {
        const marker = L.circleMarker([poi.lat, poi.lng], {
          radius: 7,
          fillColor: layer.color,
          color: '#fff',
          weight: 2,
          opacity: 0.9,
          fillOpacity: 0.85,
        })

        marker.bindPopup(
          `<div class="praga-popup praga-popup-poi">
            <div class="praga-popup-poi-name">${poi.name}</div>
            <div class="praga-popup-poi-meta">${poi.distance} · ${poi.time}</div>
            <div class="praga-popup-poi-desc">${poi.description}</div>
          </div>`,
          { className: 'praga-popup-container', closeButton: false }
        )

        marker.on('click', () => {
          onPoiClick?.(poi)
        })

        group.addLayer(marker)
      })

      layerGroupsRef.current.set(layer.id, group)
    })

    mapRef.current = map

    // Invalidate size after mount
    setTimeout(() => map.invalidateSize(), 100)

    return () => {
      map.remove()
      isInitializedRef.current = false
      mapRef.current = null
    }
  }, [])

  // ─── Toggle POI layers ────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Remove all layer groups
    layerGroupsRef.current.forEach((group) => {
      if (map.hasLayer(group)) {
        map.removeLayer(group)
      }
    })

    // Add active layer
    const activeGroup = layerGroupsRef.current.get(activeLayer)
    if (activeGroup) {
      activeGroup.addTo(map)
    }
  }, [activeLayer])

  // ─── Fly to target ────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !flyToTarget) return

    map.flyTo([flyToTarget.lat, flyToTarget.lng], 17, {
      duration: 1.2,
    })
  }, [flyToTarget])

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-full"
      style={{ minHeight: '100%' }}
    />
  )
}
