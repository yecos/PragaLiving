'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { useSiteConfig } from '@/hooks/useSiteConfig'

const defaultAmenities = [
  {
    id: 'coworking',
    name: 'Coworking',
    description: 'Espacio de trabajo colaborativo diseñado para profesionales que buscan inspiración y productividad sin salir de casa. Conectividad de alta velocidad, zonas de concentración y áreas de reunión en un entorno que estimula la creatividad.',
    image: '/images/renders/coworking.png',
    icon: '◇',
    benefits: ['Fibra óptica', 'Salas de reunión', 'Zonas silenciosas', 'Café incluido'],
  },
  {
    id: 'gimnasio',
    name: 'Gimnasio',
    description: 'Equipamiento de última generación en un espacio diseñado para entrenar con vista al exterior. Máquinas cardiovasculares, zona de pesos libres y área funcional para rutinas personalizadas en un entorno que motiva el bienestar físico.',
    image: '/images/renders/gimnasio.png',
    icon: '◇',
    benefits: ['Equipamiento premium', 'Vista exterior', 'Zona funcional', 'Pesos libres'],
  },
  {
    id: 'salon-social',
    name: 'Salón Social',
    description: 'Un espacio versátil para celebraciones, reuniones y eventos íntimos. Diseñado con acabados de lujo, iluminación ambiental y capacidad para adaptarse a cualquier ocasión especial que requiera un marco excepcional.',
    image: '/images/renders/salon-social.png',
    icon: '◇',
    benefits: ['Cocina integrada', 'Terraza', 'Sistema audio', 'Capacidad 40 personas'],
  },
  {
    id: 'vitality-pool',
    name: 'Vitality Pool',
    description: 'Piscina de hidroterapia con vista panorámica a la ciudad. Chorros dirigidos, cascadas y temperatura controlada para la recuperación física y el relajamiento profundo en un ambiente que fusiona agua, cielo y arquitectura.',
    image: '/images/renders/vitality-pool.png',
    icon: '◇',
    benefits: ['Hidromasaje', 'Vista panorámica', 'Temperatura controlada', 'Cascadas'],
  },
  {
    id: 'sauna',
    name: 'Sauna & Turco',
    description: 'Circuito de bienestar que alterna entre el calor seco de la sauna finlandesa y la humedad del baño turco, diseñado para la desintoxicación, relajación muscular y renovación completa del cuerpo y la mente.',
    // TODO: No dedicated sauna.png render available — using vitality-pool.png as placeholder
    image: '/images/renders/vitality-pool.png',
    icon: '◇',
    benefits: ['Sauna seca', 'Baño turco', 'Zona descanso', 'Vestieres'],
  },
  {
    id: 'ludoteca',
    name: 'Ludoteca',
    description: 'Espacio seguro y estimulante para los más pequeños, con áreas de juego creativo, zona de lectura y actividades supervisadas. Diseñado para que los niños exploren y crezcan mientras los padres disfrutan tranquilidad.',
    // TODO: No dedicated ludoteca.png render available — using coworking.png as placeholder
    image: '/images/renders/coworking.png',
    icon: '◇',
    benefits: ['Zona juegos', 'Área lectura', 'Supervisión', 'Materiales didácticos'],
  },
]

export default function Amenidades() {
  const { config } = useSiteConfig()
  const amenConfig = config?.amenidades

  const label = amenConfig?.label || 'Amenidades'
  const title = amenConfig?.title || 'Vivir estilo de vida'
  const amenities = amenConfig?.items || defaultAmenities

  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [selected, setSelected] = useState(0)

  const total = amenities.length
  const paddedIndex = (i: number) => String(i + 1).padStart(2, '0')

  return (
    <section id="amenidades" ref={ref} className="relative py-24 md:py-32 bg-[#F5F1EA]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-[10px] tracking-[0.5em] uppercase text-[#8B6B4B] mb-4"
          >
            {label}
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, delay: 0.2 }}
            className="font-[family-name:var(--font-cormorant)] text-3xl md:text-5xl text-[#111111] font-light"
          >
            {title}
          </motion.h2>
          <motion.div
            initial={{ width: 0 }}
            animate={isInView ? { width: 60 } : {}}
            transition={{ duration: 1, delay: 0.5 }}
            className="h-[1px] bg-[#8B6B4B] mx-auto mt-6"
          />
        </div>

        {/* Luxury Accordion Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
          {/* Left: Sticky Image Viewer (7 cols) */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="lg:col-span-7"
          >
            <div className="lg:sticky lg:top-32">
              <div className="relative aspect-[4/3] overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selected}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.6 }}
                    className="absolute inset-0"
                  >
                    <Image
                      src={amenities[selected]?.image || '/images/renders/coworking.png'}
                      alt={amenities[selected]?.name || 'Amenidad'}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 58vw"
                      priority={selected === 0}
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Cinematic gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/80 via-[#111111]/20 to-transparent pointer-events-none" />

                {/* Image name overlay at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selected}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.4 }}
                    >
                      <span className="text-[10px] tracking-[0.3em] uppercase text-[#8B6B4B] mb-1 block">
                        {paddedIndex(selected)} / {paddedIndex(total - 1)}
                      </span>
                      <h3 className="font-[family-name:var(--font-cormorant)] text-2xl md:text-3xl text-[#F5F1EA]">
                        {amenities[selected]?.name || 'Amenidad'}
                      </h3>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: Accordion List (5 cols) */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="lg:col-span-5"
          >
            <div className="flex flex-col gap-0">
              {amenities.map((amenity: typeof defaultAmenities[0], i: number) => {
                const isSelected = selected === i

                return (
                  <motion.div
                    key={amenity.id || i}
                    initial={{ opacity: 0, y: 15 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.5 + i * 0.08 }}
                  >
                    <button
                      onClick={() => setSelected(i)}
                      className={`w-full text-left transition-all duration-500 ${
                        isSelected
                          ? 'bg-[#111111] text-[#F5F1EA]'
                          : 'border-b border-[#D8D1C8]/50 hover:bg-[#111111]/5'
                      }`}
                    >
                      {/* Accordion header row */}
                      <div className="flex items-center justify-between p-5 md:p-6">
                        <div className="flex items-center gap-4 md:gap-5">
                          <span
                            className={`font-[family-name:var(--font-inter)] text-[10px] tracking-[0.15em] transition-colors duration-500 ${
                              isSelected ? 'text-[#8B6B4B]' : 'text-[#111111]/30'
                            }`}
                          >
                            {paddedIndex(i)}
                          </span>
                          <span
                            className={`font-[family-name:var(--font-cormorant)] text-lg md:text-xl transition-colors duration-500 ${
                              isSelected ? 'text-[#F5F1EA]' : 'text-[#111111]'
                            }`}
                          >
                            {amenity.name}
                          </span>
                        </div>

                        {/* Plus icon that rotates 45° when expanded */}
                        <motion.span
                          animate={{ rotate: isSelected ? 45 : 0 }}
                          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                          className={`flex items-center justify-center w-6 h-6 text-lg leading-none transition-colors duration-500 ${
                            isSelected ? 'text-[#8B6B4B]' : 'text-[#111111]/40'
                          }`}
                        >
                          +
                        </motion.span>
                      </div>

                      {/* Expandable content */}
                      <AnimatePresence>
                        {isSelected && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                            className="overflow-hidden"
                          >
                            <div className="px-5 md:px-6 pb-5 md:pb-6">
                              <p className="font-[family-name:var(--font-inter)] text-sm text-[#F5F1EA]/60 leading-relaxed mb-4">
                                {amenity.description}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {(amenity.benefits || []).map((benefit: string, j: number) => (
                                  <span
                                    key={j}
                                    className="text-[10px] tracking-[0.1em] uppercase rounded-full border border-[#8B6B4B]/40 text-[#8B6B4B] bg-[#8B6B4B]/10 backdrop-blur-sm px-3 py-1.5"
                                  >
                                    {benefit}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
