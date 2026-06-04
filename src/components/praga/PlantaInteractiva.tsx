'use client'

import { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'

const floors = [
  {
    id: 's3',
    name: 'Sótano 3',
    type: 'Parqueaderos · Cuarto técnico',
    units: 0,
  },
  {
    id: 's2',
    name: 'Sótano 2',
    type: 'Parqueaderos',
    units: 0,
  },
  {
    id: 's1',
    name: 'Sótano 1',
    type: 'Parqueaderos visitantes',
    units: 0,
  },
  {
    id: 'acceso',
    name: 'Nivel Acceso',
    type: 'Lobby · Recepción · Comercio',
    units: 2,
  },
  {
    id: 'comercial',
    name: 'Nivel Comercial',
    type: 'Locales',
    units: 4,
  },
  {
    id: 'social',
    name: 'Zona Social',
    type: 'Coworking · Gimnasio · Salón Social · Ludoteca · Wellness',
    units: 0,
  },
  ...Array.from({ length: 12 }, (_, i) => ({
    id: `piso-${i + 1}`,
    name: `Piso ${i + 1}`,
    type: 'Residencial',
    units: i < 4 ? 6 : i < 8 ? 5 : 4,
  })),
]

const unitStatuses = ['available', 'reserved', 'sold'] as const

export default function PlantaInteractiva() {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [selectedFloor, setSelectedFloor] = useState(floors.length - 1)
  const [selectedUnit, setSelectedUnit] = useState<number | null>(null)

  const floor = floors[selectedFloor]
  const units = floor.units > 0
    ? Array.from({ length: floor.units }, (_, i) => ({
        id: i + 1,
        name: `${floor.id.toUpperCase()}-${String(i + 1).padStart(2, '0')}`,
        area: [33.05, 33.75, 35.60, 35.80, 57.05, 57.09, 74.73, 97.45][i % 8],
        bedrooms: i < 4 ? 1 : i < 6 ? 2 : 3,
        bathrooms: i < 4 ? 1 : 2,
        status: unitStatuses[i % 3],
      }))
    : []

  return (
    <section id="planta" ref={ref} className="relative py-24 md:py-32 bg-[#F5F1EA]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-[10px] tracking-[0.5em] uppercase text-[#8B6B4B] mb-4"
          >
            Planta Interactiva
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, delay: 0.2 }}
            className="font-[family-name:var(--font-cormorant)] text-3xl md:text-5xl text-[#111111] font-light"
          >
            Visualizar Distribución
          </motion.h2>
          <motion.div
            initial={{ width: 0 }}
            animate={isInView ? { width: 60 } : {}}
            transition={{ duration: 1, delay: 0.5 }}
            className="h-[1px] bg-[#8B6B4B] mx-auto mt-6"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Building vertical selector */}
          <div className="lg:col-span-2">
            <div className="bg-[#111111] p-4 overflow-y-auto max-h-[600px]">
              <p className="text-[9px] tracking-[0.3em] uppercase text-[#8B6B4B] mb-4 text-center">Niveles</p>
              <div className="flex flex-col gap-1">
                {floors.map((f, i) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      setSelectedFloor(i)
                      setSelectedUnit(null)
                    }}
                    className={`text-left p-2.5 transition-all duration-300 border-l-2 ${
                      selectedFloor === i
                        ? 'border-l-[#8B6B4B] bg-[#8B6B4B]/10'
                        : 'border-l-transparent hover:border-l-[#8B6B4B]/30 hover:bg-[#1A1A1A]'
                    }`}
                  >
                    <p className={`text-[10px] tracking-[0.1em] ${
                      selectedFloor === i ? 'text-[#8B6B4B]' : 'text-[#D8D1C8]/40'
                    }`}>
                      {f.name}
                    </p>
                    <p className="text-[8px] text-[#D8D1C8]/20 mt-0.5 truncate">{f.type}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Floor plan visualization */}
          <div className="lg:col-span-7">
            <div className="bg-[#111111] p-6 h-full min-h-[400px] relative">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-[family-name:var(--font-cormorant)] text-xl text-[#F5F1EA]">{floor.name}</h3>
                  <p className="text-[10px] text-[#D8D1C8]/40 tracking-[0.1em] uppercase">{floor.type}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#4B5646]" />
                    <span className="text-[9px] text-[#D8D1C8]/50">Disponible</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#8B6B4B]" />
                    <span className="text-[9px] text-[#D8D1C8]/50">Reservado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#D8D1C8]/30" />
                    <span className="text-[9px] text-[#D8D1C8]/50">Vendido</span>
                  </div>
                </div>
              </div>

              {floor.units > 0 ? (
                <div className="grid grid-cols-3 gap-3 mt-6">
                  {units.map((unit, i) => (
                    <motion.button
                      key={unit.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => setSelectedUnit(selectedUnit === i ? null : i)}
                      className={`relative p-4 border transition-all duration-300 ${
                        selectedUnit === i
                          ? 'border-[#8B6B4B]'
                          : unit.status === 'available'
                          ? 'border-[#4B5646]/50 hover:border-[#4B5646]'
                          : unit.status === 'reserved'
                          ? 'border-[#8B6B4B]/50'
                          : 'border-[#D8D1C8]/20 opacity-50'
                      }`}
                    >
                      <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                        unit.status === 'available' ? 'bg-[#4B5646]' : unit.status === 'reserved' ? 'bg-[#8B6B4B]' : 'bg-[#D8D1C8]/30'
                      }`} />
                      <p className="text-[10px] text-[#D8D1C8]/60 font-mono">{unit.name}</p>
                      <p className="font-[family-name:var(--font-cormorant)] text-lg text-[#F5F1EA] mt-1">{unit.area} m²</p>
                      <p className="text-[9px] text-[#D8D1C8]/40 mt-1">{unit.bedrooms}H · {unit.bathrooms}B</p>
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <p className="font-[family-name:var(--font-cormorant)] text-2xl text-[#D8D1C8]/30">{floor.type}</p>
                    <p className="text-[10px] text-[#D8D1C8]/20 mt-2">Sin unidades residenciales</p>
                  </div>
                </div>
              )}

              {/* Exploded view image */}
              <div className="mt-6 relative">
                <img
                  src="/images/renders/exploded-view.png"
                  alt="Vista Explotada PRAGA"
                  className="w-full max-h-[200px] object-contain opacity-20"
                />
              </div>
            </div>
          </div>

          {/* Unit detail sidebar */}
          <div className="lg:col-span-3">
            <div className="bg-[#111111] p-6 min-h-[400px]">
              {selectedUnit !== null && units[selectedUnit] ? (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="mb-4">
                    <span className={`text-[9px] tracking-[0.15em] uppercase px-2 py-1 ${
                      units[selectedUnit].status === 'available' ? 'bg-[#4B5646] text-[#F5F1EA]' : units[selectedUnit].status === 'reserved' ? 'bg-[#8B6B4B] text-[#F5F1EA]' : 'bg-[#D8D1C8]/20 text-[#D8D1C8]/50'
                    }`}>
                      {units[selectedUnit].status === 'available' ? 'Disponible' : units[selectedUnit].status === 'reserved' ? 'Reservado' : 'Vendido'}
                    </span>
                  </div>
                  <h4 className="font-[family-name:var(--font-cormorant)] text-xl text-[#F5F1EA] mb-1">
                    {units[selectedUnit].name}
                  </h4>
                  <p className="font-[family-name:var(--font-cormorant)] text-2xl text-[#8B6B4B] mb-4">
                    {units[selectedUnit].area} m²
                  </p>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between border-b border-[#D8D1C8]/10 pb-2">
                      <span className="text-[10px] text-[#D8D1C8]/40 uppercase tracking-wider">Habitaciones</span>
                      <span className="text-sm text-[#F5F1EA]">{units[selectedUnit].bedrooms}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#D8D1C8]/10 pb-2">
                      <span className="text-[10px] text-[#D8D1C8]/40 uppercase tracking-wider">Baños</span>
                      <span className="text-sm text-[#F5F1EA]">{units[selectedUnit].bathrooms}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#D8D1C8]/10 pb-2">
                      <span className="text-[10px] text-[#D8D1C8]/40 uppercase tracking-wider">Piso</span>
                      <span className="text-sm text-[#F5F1EA]">{floor.name}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <a href="#contacto" className="block text-center text-[10px] tracking-[0.2em] uppercase bg-[#8B6B4B] text-[#F5F1EA] py-3 hover:bg-[#7A5C3E] transition-colors">
                      Contactar Asesor
                    </a>
                    <button className="block w-full text-center text-[10px] tracking-[0.2em] uppercase border border-[#8B6B4B]/30 text-[#8B6B4B] py-3 hover:bg-[#8B6B4B]/10 transition-colors">
                      Ver Recorrido 360°
                    </button>
                    <button className="block w-full text-center text-[10px] tracking-[0.2em] uppercase border border-[#D8D1C8]/20 text-[#D8D1C8]/50 py-3 hover:border-[#D8D1C8]/40 transition-colors">
                      Descargar Ficha
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="w-[1px] h-12 bg-[#8B6B4B]/30 mx-auto mb-4" />
                    <p className="text-[10px] text-[#D8D1C8]/30 tracking-[0.15em] uppercase">
                      Selecciona una unidad
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
