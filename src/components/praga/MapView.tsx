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
const PRAGA_CENTER: [number, number] = [6.0935, -75.6410]

// ─── Layer definitions with real Caldas, Antioquia offsets ──
export const locationLayers: LocationLayer[] = [
  {
    id: 'movilidad',
    name: 'Movilidad',
    icon: '→',
    color: '#6B8FB5',
    points: [
      { name: 'Estación Metro Caldas', distance: '400m', time: '5 min', description: 'Acceso directo a la línea A del Metro de Medellín en la estación Caldas', lat: 6.0965, lng: -75.6390 },
      { name: 'Parada Ruta Integrada', distance: '150m', time: '2 min', description: 'Ruta alimentadora del sistema integrado de transporte del Valle de Aburrá', lat: 6.0920, lng: -75.6430 },
      { name: 'Autopista Sur', distance: '100m', time: '1 min', description: 'Conexión directa a la Autopista Sur que comunica con Medellín y el sur del Valle de Aburrá', lat: 6.0910, lng: -75.6380 },
    ]
  },
  {
    id: 'gastronomia',
    name: 'Gastronomía',
    icon: '◆',
    color: '#B56B8F',
    points: [
      { name: 'Restaurante Típico', distance: '200m', time: '3 min', description: 'Gastronomía antioqueña auténtica con ingredientes locales y tradición paisa', lat: 6.0950, lng: -75.6395 },
      { name: 'Café Especialidad', distance: '150m', time: '2 min', description: 'Café de especialidad del caucho antioqueño con tostión artesanal', lat: 6.0915, lng: -75.6425 },
      { name: 'Parque Gastronómico', distance: '500m', time: '7 min', description: 'Zona de restaurantes y fondas tradicionales alrededor del parque central de Caldas', lat: 6.0978, lng: -75.6380 },
    ]
  },
  {
    id: 'comercio',
    name: 'Comercio',
    icon: '□',
    color: '#8B6B4B',
    points: [
      { name: 'Centro Comercial', distance: '600m', time: '8 min', description: 'Plaza comercial con supermercado, bancos y tiendas de servicio', lat: 6.0900, lng: -75.6370 },
      { name: 'Supermercado', distance: '250m', time: '3 min', description: 'Supermercado con productos locales y de la región antioqueña', lat: 6.0945, lng: -75.6405 },
      { name: 'Plaza de Mercado', distance: '450m', time: '6 min', description: 'Plaza de mercado campesino con frutas, verduras y productos frescos del sur del Valle', lat: 6.0960, lng: -75.6365 },
    ]
  },
  {
    id: 'educacion',
    name: 'Educación',
    icon: '△',
    color: '#6B8F6B',
    points: [
      { name: 'Sede Universitaria', distance: '1.2km', time: '15 min', description: 'Sede universitaria ITM con programas de ingeniería y tecnología a minutos en metro', lat: 6.1040, lng: -75.6340 },
      { name: 'Colegio Caldas', distance: '500m', time: '6 min', description: 'Institución educativa con programas académicos y técnicos de calidad', lat: 6.0890, lng: -75.6440 },
    ]
  },
  {
    id: 'salud',
    name: 'Salud',
    icon: '○',
    color: '#6BB5A0',
    points: [
      { name: 'EPS / IPS Caldas', distance: '600m', time: '8 min', description: 'Centro de atención médica con servicios de consulta externa y urgencias', lat: 6.0955, lng: -75.6360 },
      { name: 'Farmacia', distance: '200m', time: '3 min', description: 'Farmacia comunitaria con servicio de entrega a domicilio', lat: 6.0925, lng: -75.6430 },
    ]
  },
  {
    id: 'naturaleza',
    name: 'Naturaleza',
    icon: '◇',
    color: '#4B5646',
    points: [
      { name: 'Parque Principal Caldas', distance: '400m', time: '5 min', description: 'Parque central del municipio con zonas verdes, kiosko y espacio público', lat: 6.0972, lng: -75.6375 },
      { name: 'Cerro Nutibama', distance: '800m', time: '10 min', description: 'Mirador natural con vistas panorámicas del Valle de Aburrá y senderos ecológicos', lat: 6.0860, lng: -75.6470 },
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
          <div class="praga-popup-detail">Caldas, Antioquia, Colombia</div>
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
