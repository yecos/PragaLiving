'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const indicators = [
  { label: 'Valorización Anual', value: '+12.5%', description: 'Incremento promedio del valor inmobiliario en la zona durante los últimos 5 años, superando el promedio de la ciudad.' },
  { label: 'Renta Estimada', value: '6.8%', description: 'Retorno estimado sobre inversión por arrendamiento, basado en análisis del mercado local y comparables de la zona.' },
  { label: 'Demanda Zona', value: '94%', description: 'Índice de ocupación en la zona, demostrando alta demanda y sostenibilidad del mercado inmobiliario local.' },
  { label: 'Plusvalía Proyectada', value: '+35%', description: 'Plusvalía esperada en 5 años según tendencias de desarrollo urbano y proyectos de infraestructura planificados.' },
]

const investmentSections = [
  {
    title: 'Ubicación Estratégica',
    description: 'PRAGA Living se ubica en una de las zonas de mayor crecimiento y transformación urbana, donde la conectividad, los servicios y la plusvalía convergen para crear una oportunidad de inversión excepcional. Los proyectos de infraestructura en curso garantizan la revalorización continua del entorno.',
  },
  {
    title: 'Escasez de Oferta',
    description: 'La oferta de residencias premium con características biophilic y amenidades de nivel hotelero es limitada en el mercado. PRAGA Living representa una oportunidad única de acceder a un producto diferenciado que no tendrá réplicas en la zona, protegiendo su valor a largo plazo.',
  },
  {
    title: 'Arquitectura como Valor',
    description: 'A diferencia de proyectos inmobiliarios tradicionales, PRAGA Living incorpora arquitectura de autor como factor de valoración. La calidad del diseño, los materiales y la construcción se traducen en un patrimonio que se aprecia con el tiempo, no solo en metros cuadrados.',
  },
  {
    title: 'Proyección de Mercado',
    description: 'El mercado inmobiliario premium en la zona muestra tendencias de crecimiento sostenido. La combinación de ubicación, diseño y exclusividad posiciona a PRAGA Living como una de las opciones de inversión más atractivas del mercado actual.',
  },
]

export default function Inversion() {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="inversion" ref={ref} className="relative py-24 md:py-32 bg-[#F5F1EA]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-[10px] tracking-[0.5em] uppercase text-[#8B6B4B] mb-4"
          >
            Inversión
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, delay: 0.2 }}
            className="font-[family-name:var(--font-cormorant)] text-3xl md:text-5xl text-[#111111] font-light"
          >
            Generar Decisión
          </motion.h2>
          <motion.div
            initial={{ width: 0 }}
            animate={isInView ? { width: 60 } : {}}
            transition={{ duration: 1, delay: 0.5 }}
            className="h-[1px] bg-[#8B6B4B] mx-auto mt-6"
          />
        </div>

        {/* Key indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          {indicators.map((indicator, i) => (
            <motion.div
              key={indicator.label}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.6 + i * 0.1 }}
              className="text-center p-6 border border-[#D8D1C8]/50 hover:border-[#8B6B4B]/30 transition-colors duration-500"
            >
              <p className="font-[family-name:var(--font-cormorant)] text-4xl md:text-5xl text-[#8B6B4B] font-light mb-2">
                {indicator.value}
              </p>
              <p className="text-[10px] tracking-[0.15em] uppercase text-[#111111]/50 mb-3">
                {indicator.label}
              </p>
              <p className="text-[11px] text-[#111111]/40 leading-relaxed">
                {indicator.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Investment sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {investmentSections.map((section, i) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 1 + i * 0.15 }}
              className="p-8 bg-[#111111] group hover:bg-[#1A1A1A] transition-colors duration-500"
            >
              <div className="flex items-center gap-4 mb-4">
                <span className="font-[family-name:var(--font-cormorant)] text-3xl text-[#8B6B4B]/30 group-hover:text-[#8B6B4B] transition-colors">
                  0{i + 1}
                </span>
                <div className="h-[1px] flex-1 bg-[#8B6B4B]/20" />
              </div>
              <h3 className="font-[family-name:var(--font-cormorant)] text-xl md:text-2xl text-[#F5F1EA] mb-4 tracking-wide">
                {section.title}
              </h3>
              <p className="font-[family-name:var(--font-inter)] text-sm text-[#D8D1C8]/50 leading-relaxed">
                {section.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 1.5 }}
          className="text-center mt-16"
        >
          <a
            href="#contacto"
            className="inline-block text-[11px] tracking-[0.2em] uppercase bg-[#8B6B4B] text-[#F5F1EA] px-10 py-4 hover:bg-[#7A5C3E] transition-all duration-300"
          >
            Solicitar Información de Inversión
          </a>
        </motion.div>
      </div>
    </section>
  )
}
