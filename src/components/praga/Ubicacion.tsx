'use client'

import { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'

const locationLayers = [
  {
    id: 'movilidad',
    name: 'Movilidad',
    icon: '→',
    points: [
      { name: 'Estación Metro', distance: '350m', time: '5 min', description: 'Acceso directo a línea principal del sistema de transporte masivo' },
      { name: 'Parada BRT', distance: '200m', time: '3 min', description: 'Sistema de transporte rápido con cobertura integral de la ciudad' },
      { name: 'Vía Principal', distance: '100m', time: '2 min', description: 'Conexión directa a la arteria vial más importante de la zona' },
    ]
  },
  {
    id: 'gastronomia',
    name: 'Gastronomía',
    icon: '◆',
    points: [
      { name: 'Restaurante Premium', distance: '150m', time: '2 min', description: 'Alta cocina en un entorno exclusivo con chefs reconocidos' },
      { name: 'Café Especialidad', distance: '100m', time: '1 min', description: 'Café de especialidad y repostería artesanal' },
      { name: 'Zona Gastronómica', distance: '400m', time: '6 min', description: 'Concentración de restaurantes y bares de autor' },
    ]
  },
  {
    id: 'comercio',
    name: 'Comercio',
    icon: '□',
    points: [
      { name: 'Centro Comercial', distance: '500m', time: '7 min', description: 'Centro comercial con tiendas de lujo y marcas internacionales' },
      { name: 'Supermercado Premium', distance: '200m', time: '3 min', description: 'Supermercado gourmet con productos importados y orgánicos' },
      { name: 'Boutiques', distance: '300m', time: '4 min', description: 'Tiendas de diseño y moda independiente' },
    ]
  },
  {
    id: 'educacion',
    name: 'Educación',
    icon: '△',
    points: [
      { name: 'Universidad', distance: '800m', time: '10 min', description: 'Institución educativa de prestigio con programas de pregrado y posgrado' },
      { name: 'Colegio Bilingüe', distance: '600m', time: '8 min', description: 'Colegio internacional con currículo bilingüe completo' },
    ]
  },
  {
    id: 'salud',
    name: 'Salud',
    icon: '○',
    points: [
      { name: 'Clínica Premium', distance: '700m', time: '9 min', description: 'Centro médico de alta complejidad con especialidades completas' },
      { name: 'Farmacia 24h', distance: '150m', time: '2 min', description: 'Farmacia de turno con servicio de entrega a domicilio' },
    ]
  },
  {
    id: 'naturaleza',
    name: 'Naturaleza',
    icon: '◇',
    points: [
      { name: 'Parque Principal', distance: '300m', time: '4 min', description: 'Parque urbano con senderos, lagos y zonas de esparcimiento' },
      { name: 'Ciclovía', distance: '100m', time: '1 min', description: 'Ruta ciclista dedicada con conexión a la red ciudadana' },
    ]
  },
]

export default function Ubicacion() {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [activeLayer, setActiveLayer] = useState('movilidad')

  const activePoints = locationLayers.find(l => l.id === activeLayer)?.points || []

  return (
    <section id="ubicacion" ref={ref} className="relative py-24 md:py-32 bg-[#F5F1EA]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map placeholder */}
          <div className="lg:col-span-2 relative h-[400px] md:h-[500px] bg-[#D8D1C8]/30 overflow-hidden">
            <img
              src="/images/renders/exterior-dusk.png"
              alt="Vista Urbana PRAGA"
              className="w-full h-full object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-[#F5F1EA]/40" />
            
            {/* Map pins */}
            {activePoints.map((point, i) => (
              <motion.div
                key={point.name}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.15 }}
                className="absolute cursor-pointer group"
                style={{
                  top: `${20 + i * 25}%`,
                  left: `${20 + i * 20}%`,
                }}
              >
                <div className="relative">
                  <div className="w-4 h-4 bg-[#8B6B4B] rounded-full shadow-lg" />
                  <div className="absolute -inset-2 bg-[#8B6B4B]/20 rounded-full animate-ping" />
                </div>
                <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-[#111111] px-3 py-2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                  <p className="text-[10px] text-[#F5F1EA]">{point.name}</p>
                  <p className="text-[8px] text-[#8B6B4B]">{point.distance} · {point.time}</p>
                </div>
              </motion.div>
            ))}

            {/* PRAGA location pin */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="relative">
                <div className="w-8 h-8 bg-[#111111] rounded-full flex items-center justify-center shadow-xl border-2 border-[#8B6B4B]">
                  <span className="text-[8px] tracking-wider text-[#8B6B4B] font-bold">P</span>
                </div>
                <div className="absolute -inset-3 border border-[#8B6B4B]/30 rounded-full" />
              </div>
            </div>
          </div>

          {/* Layers & Points */}
          <div>
            <div className="mb-6">
              <p className="text-[9px] tracking-[0.3em] uppercase text-[#8B6B4B] mb-3">Capas</p>
              <div className="flex flex-wrap gap-2">
                {locationLayers.map((layer) => (
                  <button
                    key={layer.id}
                    onClick={() => setActiveLayer(layer.id)}
                    className={`px-4 py-2 text-[10px] tracking-[0.1em] uppercase transition-all duration-300 border ${
                      activeLayer === layer.id
                        ? 'border-[#8B6B4B] bg-[#8B6B4B] text-[#F5F1EA]'
                        : 'border-[#D8D1C8] text-[#111111]/50 hover:border-[#8B6B4B]/50'
                    }`}
                  >
                    {layer.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {activePoints.map((point, i) => (
                <motion.div
                  key={point.name}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-4 border border-[#D8D1C8]/50 hover:border-[#8B6B4B]/30 transition-colors duration-300"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-[family-name:var(--font-cormorant)] text-base text-[#111111]">{point.name}</h4>
                    <span className="text-[9px] tracking-[0.1em] text-[#8B6B4B]">{point.time}</span>
                  </div>
                  <p className="text-[11px] text-[#111111]/50 leading-relaxed">{point.description}</p>
                  <p className="text-[10px] text-[#8B6B4B] mt-2">{point.distance}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
