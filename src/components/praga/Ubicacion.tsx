'use client'

import { useRef, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { motion, useInView } from 'framer-motion'
import type { POIPoint } from './MapView'

// ─── Dynamic import of map (SSR disabled — Leaflet needs window) ───
const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#111111] flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#8B6B4B] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-[10px] tracking-[0.3em] uppercase text-[#8B6B4B]">Cargando mapa</p>
      </div>
    </div>
  ),
})

// ─── Layer data (re-exported from MapView for sidebar use) ─────────
const locationLayers = [
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
      { name: 'Pasaje Alejandrino', distance: '242m', time: '3 min', description: 'Pasaje gastronómico con variedad de opciones locales e internacionales', lat: 6.09066, lng: -75.63650 },
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
      { name: 'Cruz Verde Farmacia', distance: '134m', time: '2 min', description: 'Farmacia con servicio de entrega a domicilio', lat: 6.08972, lng: -75.63607 },
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

export default function Ubicacion() {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [activeLayer, setActiveLayer] = useState('movilidad')
  const [flyToTarget, setFlyToTarget] = useState<POIPoint | null>(null)

  const activeLayerData = locationLayers.find(l => l.id === activeLayer)
  const activePoints = activeLayerData?.points || []
  const activeColor = activeLayerData?.color || '#8B6B4B'

  const handlePoiClick = useCallback((poi: POIPoint) => {
    setFlyToTarget(poi)
    // Reset fly target after animation
    setTimeout(() => setFlyToTarget(null), 1500)
  }, [])

  return (
    <section id="ubicacion" ref={ref} className="relative py-24 md:py-32 bg-[#F5F1EA]">
      {/* ─── Leaflet CSS overrides injected here ─── */}
      <style jsx global>{`
        /* PRAGA marker */
        .praga-marker-custom {
          background: none !important;
          border: none !important;
        }
        .praga-marker-wrapper {
          position: relative;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .praga-marker-pin {
          width: 36px;
          height: 36px;
          background: #111111;
          border: 2.5px solid #8B6B4B;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 3;
          box-shadow: 0 4px 20px rgba(0,0,0,0.4), 0 0 12px rgba(139,107,75,0.3);
        }
        .praga-marker-letter {
          font-family: var(--font-cormorant), serif;
          font-size: 16px;
          font-weight: 700;
          color: #8B6B4B;
          letter-spacing: 0.05em;
        }
        .praga-marker-pulse {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1.5px solid #8B6B4B;
          opacity: 0;
          z-index: 1;
          animation: praga-pulse 2.5s ease-out infinite;
        }
        .praga-marker-pulse-delay {
          animation-delay: 1.2s;
        }
        @keyframes praga-pulse {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
          100% { transform: translate(-50%, -50%) scale(2.8); opacity: 0; }
        }

        /* Distance labels */
        .praga-distance-label {
          background: none !important;
          border: none !important;
          font-family: var(--font-inter), sans-serif;
          font-size: 9px;
          letter-spacing: 0.15em;
          color: rgba(139,107,75,0.6);
          text-shadow: 0 1px 4px rgba(0,0,0,0.5);
        }

        /* Popup overrides */
        .praga-popup-container {
          background: none !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .praga-popup-container .leaflet-popup-content-wrapper {
          background: #111111 !important;
          border: 1px solid rgba(139,107,75,0.3) !important;
          border-radius: 2px !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important;
          padding: 0 !important;
        }
        .praga-popup-container .leaflet-popup-content {
          margin: 0 !important;
          font-family: var(--font-inter), sans-serif !important;
        }
        .praga-popup-container .leaflet-popup-tip {
          background: #111111 !important;
          border: none !important;
        }
        .praga-popup-container .leaflet-popup-close-button {
          color: #8B6B4B !important;
        }
        .praga-popup {
          padding: 14px 18px;
        }
        .praga-popup-title {
          font-family: var(--font-cormorant), serif;
          font-size: 16px;
          font-weight: 600;
          color: #8B6B4B;
          letter-spacing: 0.05em;
          margin-bottom: 4px;
        }
        .praga-popup-subtitle {
          font-size: 11px;
          color: #F5F1EA;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 2px;
        }
        .praga-popup-detail {
          font-size: 10px;
          color: rgba(245,241,234,0.5);
        }
        .praga-popup-poi-name {
          font-family: var(--font-cormorant), serif;
          font-size: 14px;
          font-weight: 600;
          color: #F5F1EA;
          margin-bottom: 4px;
        }
        .praga-popup-poi-meta {
          font-size: 10px;
          color: #8B6B4B;
          letter-spacing: 0.08em;
          margin-bottom: 6px;
        }
        .praga-popup-poi-desc {
          font-size: 11px;
          color: rgba(245,241,234,0.6);
          line-height: 1.5;
        }

        /* Zoom controls */
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 2px 12px rgba(0,0,0,0.3) !important;
          border-radius: 2px !important;
          overflow: hidden;
        }
        .leaflet-control-zoom a {
          background: #111111 !important;
          color: #8B6B4B !important;
          border: none !important;
          border-bottom: 1px solid rgba(139,107,75,0.2) !important;
          width: 32px !important;
          height: 32px !important;
          line-height: 32px !important;
          font-size: 14px !important;
        }
        .leaflet-control-zoom a:last-child {
          border-bottom: none !important;
        }
        .leaflet-control-zoom a:hover {
          background: #1a1a1a !important;
          color: #F5F1EA !important;
        }

        /* Attribution */
        .leaflet-control-attribution {
          background: rgba(17,17,17,0.7) !important;
          color: rgba(139,107,75,0.5) !important;
          font-size: 8px !important;
          padding: 2px 6px !important;
          border-radius: 2px 0 0 0 !important;
        }
        .leaflet-control-attribution a {
          color: rgba(139,107,75,0.6) !important;
        }
        .leaflet-control-attribution a:hover {
          color: #8B6B4B !important;
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-6">
        {/* ─── Header ─── */}
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-[10px] tracking-[0.5em] uppercase text-[#8B6B4B] mb-4"
          >
            Ubicación
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, delay: 0.2 }}
            className="font-[family-name:var(--font-cormorant)] text-3xl md:text-5xl text-[#111111] font-light"
          >
            Vender Entorno
          </motion.h2>
          <motion.div
            initial={{ width: 0 }}
            animate={isInView ? { width: 60 } : {}}
            transition={{ duration: 1, delay: 0.5 }}
            className="h-[1px] bg-[#8B6B4B] mx-auto mt-6"
          />
        </div>

        {/* ─── Map + Sidebar grid ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map area — 2/3 width on desktop */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, delay: 0.3 }}
            className="lg:col-span-2 relative h-[350px] md:h-[500px] overflow-hidden border border-[#D8D1C8]/50"
          >
            <MapView
              activeLayer={activeLayer}
              flyToTarget={flyToTarget}
              onPoiClick={handlePoiClick}
            />
          </motion.div>

          {/* Sidebar — 1/3 width on desktop, below map on mobile */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 1, delay: 0.5 }}
            className="flex flex-col"
          >
            {/* Layer toggle buttons */}
            <div className="mb-6">
              <p className="text-[9px] tracking-[0.3em] uppercase text-[#8B6B4B] mb-3">Capas</p>
              <div className="flex flex-wrap gap-2">
                {locationLayers.map((layer) => (
                  <button
                    key={layer.id}
                    onClick={() => setActiveLayer(layer.id)}
                    className={`relative px-4 py-2 text-[10px] tracking-[0.1em] uppercase transition-all duration-300 border flex items-center gap-1.5 ${
                      activeLayer === layer.id
                        ? 'border-[#8B6B4B] bg-[#111111] text-[#F5F1EA]'
                        : 'border-[#D8D1C8] text-[#111111]/50 hover:border-[#8B6B4B]/50 hover:text-[#111111]/80'
                    }`}
                  >
                    <span
                      className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: layer.color }}
                    />
                    {layer.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Active layer indicator */}
            <div className="flex items-center gap-2 mb-4">
              <div className="h-[1px] flex-1 bg-[#D8D1C8]" />
              <span
                className="text-[9px] tracking-[0.2em] uppercase"
                style={{ color: activeColor }}
              >
                {activeLayerData?.name}
              </span>
              <div className="h-[1px] flex-1 bg-[#D8D1C8]" />
            </div>

            {/* POI list */}
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1 praga-poi-scroll">
              {activePoints.map((point, i) => (
                <motion.div
                  key={point.name}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => handlePoiClick(point)}
                  className="p-4 border border-[#D8D1C8]/50 hover:border-[#8B6B4B]/30 transition-all duration-300 cursor-pointer group hover:bg-white/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0 group-hover:scale-125 transition-transform duration-300"
                        style={{ backgroundColor: activeColor }}
                      />
                      <h4 className="font-[family-name:var(--font-cormorant)] text-base text-[#111111]">
                        {point.name}
                      </h4>
                    </div>
                    <span className="text-[9px] tracking-[0.1em] text-[#8B6B4B] whitespace-nowrap ml-2">
                      {point.time}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#111111]/50 leading-relaxed pl-[18px]">
                    {point.description}
                  </p>
                  <div className="flex items-center gap-3 mt-2 pl-[18px]">
                    <span className="text-[10px] text-[#8B6B4B] tracking-wide">{point.distance}</span>
                    <span className="text-[10px] text-[#D8D1C8]">|</span>
                    <span className="text-[10px] text-[#111111]/30 tracking-wide">{point.time} caminando</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Bottom info */}
            <div className="mt-auto pt-6">
              <div className="p-4 bg-[#111111]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 border border-[#8B6B4B] rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="font-[family-name:var(--font-cormorant)] text-sm font-bold text-[#8B6B4B]">P</span>
                  </div>
                  <div>
                    <p className="font-[family-name:var(--font-cormorant)] text-sm text-[#F5F1EA]">PRAGA Living</p>
                    <p className="text-[9px] text-[#8B6B4B] tracking-wider uppercase">Caldas, Antioquia</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-[9px] text-[#F5F1EA]/40 tracking-wider">
                  <span>6.0890° N</span>
                  <span>75.6351° W</span>
                  <span>1,750m s.n.m.</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ─── Distance legend ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex items-center justify-center gap-8 mt-8"
        >
          {[
            { label: '200m', opacity: 0.4 },
            { label: '500m', opacity: 0.25 },
            { label: '1km', opacity: 0.15 },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full border border-[#8B6B4B]/40"
                style={{ backgroundColor: `rgba(139,107,75,${item.opacity})` }}
              />
              <span className="text-[10px] text-[#111111]/40 tracking-wider">{item.label}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ─── Custom scrollbar for POI list ─── */}
      <style jsx global>{`
        .praga-poi-scroll::-webkit-scrollbar {
          width: 3px;
        }
        .praga-poi-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .praga-poi-scroll::-webkit-scrollbar-thumb {
          background: #D8D1C8;
          border-radius: 3px;
        }
        .praga-poi-scroll::-webkit-scrollbar-thumb:hover {
          background: #8B6B4B;
        }
      `}</style>
    </section>
  )
}
