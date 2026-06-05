'use client'

import { useRef, useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'

const amenities = [
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
    image: '/images/renders/vitality-pool.png',
    icon: '◇',
    benefits: ['Sauna seca', 'Baño turco', 'Zona descanso', 'Vestieres'],
  },
  {
    id: 'ludoteca',
    name: 'Ludoteca',
    description: 'Espacio seguro y estimulante para los más pequeños, con áreas de juego creativo, zona de lectura y actividades supervisadas. Diseñado para que los niños exploren y crezcan mientras los padres disfrutan tranquilidad.',
    image: '/images/renders/coworking.png',
    icon: '◇',
    benefits: ['Zona juegos', 'Área lectura', 'Supervisión', 'Materiales didácticos'],
  },
]

export default function Amenidades() {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [selected, setSelected] = useState(0)

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
            Amenidades
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, delay: 0.2 }}
            className="font-[family-name:var(--font-cormorant)] text-3xl md:text-5xl text-[#111111] font-light"
          >
            Vender estilo de vida
          </motion.h2>
          <motion.div
            initial={{ width: 0 }}
            animate={isInView ? { width: 60 } : {}}
            transition={{ duration: 1, delay: 0.5 }}
            className="h-[1px] bg-[#8B6B4B] mx-auto mt-6"
          />
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative h-[400px] md:h-[500px] overflow-hidden"
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={selected}
                src={amenities[selected].image}
                alt={amenities[selected].name}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.6 }}
                className="w-full h-full object-cover"
              />
            </AnimatePresence>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#111111]/70 to-transparent p-6">
              <h3 className="font-[family-name:var(--font-cormorant)] text-2xl text-[#F5F1EA]">
                {amenities[selected].name}
              </h3>
            </div>
          </motion.div>

          {/* Right: Details */}
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
              {amenities.map((amenity, i) => (
                <motion.button
                  key={amenity.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.5 + i * 0.08 }}
                  onClick={() => setSelected(i)}
                  className={`text-left p-4 transition-all duration-300 border ${
                    selected === i
                      ? 'border-[#8B6B4B] bg-[#8B6B4B]/5'
                      : 'border-[#D8D1C8]/50 hover:border-[#8B6B4B]/50'
                  }`}
                >
                  <span className={`text-[10px] tracking-[0.15em] uppercase transition-colors ${
                    selected === i ? 'text-[#8B6B4B]' : 'text-[#111111]/40'
                  }`}>
                    {amenity.name}
                  </span>
                </motion.button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={selected}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
              >
                <h3 className="font-[family-name:var(--font-cormorant)] text-2xl md:text-3xl text-[#111111] mb-4">
                  {amenities[selected].name}
                </h3>
                <p className="font-[family-name:var(--font-inter)] text-sm text-[#111111]/60 leading-relaxed mb-6">
                  {amenities[selected].description}
                </p>
                <div className="flex flex-wrap gap-3">
                  {amenities[selected].benefits.map((benefit, i) => (
                    <span
                      key={i}
                      className="text-[10px] tracking-[0.1em] uppercase border border-[#8B6B4B]/30 text-[#8B6B4B] px-3 py-1.5"
                    >
                      {benefit}
                    </span>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
