'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { DEFAULT_PRAGA_CENTER, locationLayers, poiMeta } from './locationData'
import type { LocationLayer, POIPoint } from './locationData'
export { DEFAULT_PRAGA_CENTER, locationLayers } from './locationData'
export type { LocationLayer, POIPoint } from './locationData'

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
  layers?: LocationLayer[]
  center?: [number, number]
}

export default function MapView({
  activeLayer,
  onPoiClick,
  flyToTarget,
  layers = locationLayers,
  center = DEFAULT_PRAGA_CENTER,
}: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const layerGroupsRef = useRef<Map<string, L.LayerGroup>>(new Map())
  const isInitializedRef = useRef(false)

  // ─── Initialize map ──────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || isInitializedRef.current) return
    isInitializedRef.current = true

    const map = L.map(mapContainerRef.current, {
      center: center,
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
    })

    // Dark tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map)

    // Add zoom control top-right
    L.control.zoom({ position: 'topright' }).addTo(map)

    // Minimal attribution
    L.control.attribution({ position: 'bottomright', prefix: false })
      .addAttribution('&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors')
      .addTo(map)

    // ─── Distance circles ──────────────────────────────
    DISTANCE_CIRCLES.forEach(({ radius, label, opacity }) => {
      L.circle(center, {
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
      const labelPoint = L.latLng(center[0] + (radius / 111320), center[1])
      L.marker(labelPoint, {
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
    L.marker(center, { icon: pragaIcon, zIndexOffset: 1000 })
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
    layers.forEach(layer => {
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

        // CMS text must be treated as text, never interpolated as popup HTML.
        const popup = document.createElement('div')
        popup.className = 'praga-popup praga-popup-poi'
        for (const [className, text] of [
          ['praga-popup-poi-name', poi.name],
          ['praga-popup-poi-meta', poiMeta(poi)],
          ['praga-popup-poi-desc', poi.description],
          ['praga-popup-poi-desc', poi.address],
        ] as const) {
          if (!text) continue
          const line = document.createElement('div')
          line.className = className
          line.textContent = text
          popup.appendChild(line)
        }
        if (poi.phone) {
          const phone = document.createElement('a')
          phone.href = `tel:${poi.phone.replace(/[^+0-9]/g, '')}`
          phone.textContent = poi.phone
          popup.appendChild(phone)
        }
        marker.bindPopup(popup, { className: 'praga-popup-container', closeButton: false })

        marker.on('click', () => {
          onPoiClick?.(poi)
        })

        group.addLayer(marker)
      })

      layerGroupsRef.current.set(layer.id, group)
    })

    mapRef.current = map

    // Invalidate size after mount
    const resizeTimer = setTimeout(() => map.invalidateSize(), 100)

    return () => {
      clearTimeout(resizeTimer)
      layerGroupsRef.current.clear()
      map.remove()
      isInitializedRef.current = false
      mapRef.current = null
    }
  }, [center, layers, onPoiClick])

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
  }, [activeLayer, center, layers, onPoiClick])

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
