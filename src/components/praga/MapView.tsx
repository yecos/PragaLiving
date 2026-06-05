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

// ─── PRAGA center (Caldas, Antioquia) ─────────────────
const PRAGA_CENTER: [number, number] = [6.08895, -75.63514]

// ─── Layer definitions with real Caldas, Antioquia POIs ──────
export const locationLayers: LocationLayer[] = [
  {
    id: 'movilidad',
    name: 'Movilidad',
    icon: '→',
    color: '#6B8FB5',
    points: [
      { name: 'Parada Bus Urbano', distance: '84m', time: '1 min', description: 'Parada de rutas urbanas con conexión al centro de Caldas y municipios cercanos', lat: 6.08975, lng: -75.63610 },
      { name: 'Parada Rutas Veredales', distance: '120m', time: '2 min', description: 'Conexión con rutas veredales y transporte rural de la zona sur del Valle de Aburrá', lat: 6.09007, lng: -75.63607 },
      { name: 'Estación La Estrella (Metro)', distance: '7.2 km', time: '25 min', description: 'Estación del Metro de Medellín Línea A, accesible vía bus integrado por Carrera 50', lat: 6.15278, lng: -75.62633 },
    ]
  },
  {
    id: 'gastronomia',
    name: 'Gastronomía',
    icon: '◆',
    color: '#B56B8F',
    points: [
      { name: 'Zona Gastronómica Caldas', distance: '200m', time: '3 min', description: 'Concentración de restaurantes típicos antioqueños y cafés en el centro de Caldas', lat: 6.09080, lng: -75.63650 },
      { name: 'Café Especialidad', distance: '150m', time: '2 min', description: 'Café de especialidad y repostería artesanal en el parque principal', lat: 6.09100, lng: -75.63500 },
      { name: 'Pasaje Alejandrino', distance: '242m', time: '3 min', description: 'Pasaje gastronómico con variedad de opciones locales y internacionales', lat: 6.09066, lng: -75.63650 },
    ]
  },
  {
    id: 'comercio',
    name: 'Comercio',
    icon: '□',
    color: '#8B6B4B',
    points: [
      { name: 'San Gabriel', distance: '201m', time: '3 min', description: 'Centro comercial local con supermercado, farmacia y tiendas de servicios', lat: 6.09051, lng: -75.63662 },
      { name: 'Bancolombia', distance: '273m', time: '4 min', description: 'Sucursal bancaria con servicios completos y cajero 24h', lat: 6.09138, lng: -75.63549 },
      { name: 'Locería Colombiana', distance: '500m', time: '7 min', description: 'Fábrica histórica de Corona con outlet de cerámica y materiales', lat: 6.09200, lng: -75.63800 },
    ]
  },
  {
    id: 'educacion',
    name: 'Educación',
    icon: '△',
    color: '#6B8F6B',
    points: [
      { name: 'IE María Auxiliadora', distance: '152m', time: '2 min', description: 'Institución educativa de prestigio con programas de preescolar a media técnica', lat: 6.09024, lng: -75.63559 },
      { name: 'Colegio Tercer Milenio', distance: '288m', time: '4 min', description: 'Colegio privado con currículo bilingüe y énfasis en tecnología', lat: 6.09110, lng: -75.63753 },
      { name: 'IE Ciencias Aplicadas', distance: '390m', time: '5 min', description: 'Institución técnica con programas de formación profesional', lat: 6.09249, lng: -75.63563 },
    ]
  },
  {
    id: 'salud',
    name: 'Salud',
    icon: '○',
    color: '#6BB5A0',
    points: [
      { name: 'Policlínico Sur', distance: '145m', time: '2 min', description: 'Clínica médica con consultas especializadas y servicios de urgencias', lat: 6.09002, lng: -75.63439 },
      { name: 'Hospital San Vicente de Paúl', distance: '540m', time: '7 min', description: 'Hospital principal de Caldas con servicios de alta complejidad', lat: 6.08720, lng: -75.63620 },
      { name: 'Cruz Verde Farmacia', distance: '134m', time: '2 min', description: 'Farmacia chain con servicio de entrega a domicilio', lat: 6.08972, lng: -75.63607 },
    ]
  },
  {
    id: 'naturaleza',
    name: 'Naturaleza',
    icon: '◇',
    color: '#4B5646',
    points: [
      { name: 'Parque El Carrusel', distance: '201m', time: '3 min', description: 'Parque urbano con glorieta, zonas verdes y senderos peatonales', lat: 6.08978, lng: -75.63676 },
      { name: 'Parque de la Locería', distance: '488m', time: '6 min', description: 'Parque histórico recientemente renovado con áreas deportivas y culturales', lat: 6.09162, lng: -75.63865 },
      { name: 'Parque Santander', distance: '400m', time: '5 min', description: 'Parque principal del centro de Caldas frente a la Alcaldía', lat: 6.09200, lng: -75.63700 },
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
          <div class="praga-popup-detail">Caldas, Antioquia</div>
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
