'use client'

import { useRef } from 'react'
import { motion, useInView, useScroll, useTransform } from 'framer-motion'

export default function Arquitectura() {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  })
  const parallaxY = useTransform(scrollYProgress, [0, 1], [50, -50])

  return (
    <section id="arquitectura" ref={ref} className="relative py-24 md:py-32 bg-[#F5F1EA] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
            className="relative"
          >
            <motion.div style={{ y: parallaxY }} className="relative">
              <img
                src="/images/renders/exterior-golden.png"
                alt="PRAGA Living Exterior"
                className="w-full h-[500px] md:h-[600px] object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-[#111111]/50 to-transparent" />
            </motion.div>
            {/* Decorative frame */}
            <div className="absolute -bottom-4 -right-4 w-full h-full border border-[#8B6B4B]/30 -z-10" />
          </motion.div>

          {/* Content */}
          <div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
              className="text-[10px] tracking-[0.5em] uppercase text-[#8B6B4B] mb-4"
            >
              Arquitectura
            </motion.p>

            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 1, delay: 0.2 }}
              className="font-[family-name:var(--font-cormorant)] text-3xl md:text-5xl text-[#111111] font-light leading-tight mb-8"
            >
              Donde la arquitectura
              <br />
              <span className="text-[#8B6B4B]">y la naturaleza se encuentran</span>
            </motion.h2>

            <motion.div
              initial={{ width: 0 }}
              animate={isInView ? { width: 60 } : {}}
              transition={{ duration: 1, delay: 0.5 }}
              className="h-[1px] bg-[#8B6B4B] mb-8"
            />

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="font-[family-name:var(--font-inter)] text-sm text-[#111111]/70 leading-relaxed mb-6"
            >
              PRAGA Living integra diseño biophilic en cada nivel del edificio. Fachadas vegetales, 
              balcones con jardines privados y un atrio central que conecta visualmente todos los 
              pisos, creando un ecosistema habitable donde la naturaleza no es un adorno, sino 
              parte esencial de la experiencia arquitectónica.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="font-[family-name:var(--font-inter)] text-sm text-[#111111]/70 leading-relaxed mb-10"
            >
              Cada residencia ha sido diseñada para maximizar la luz natural, la ventilación 
              cruzada y las vistas panorámicas, creando espacios que respiran y se adaptan 
              al ritmo de quienes los habitan.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 1 }}
              className="grid grid-cols-3 gap-6"
            >
              {[
                { number: '12', label: 'Niveles Residenciales' },
                { number: '8', label: 'Tipologías' },
                { number: '360°', label: 'Recorridos Virtuales' },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <p className="font-[family-name:var(--font-cormorant)] text-3xl md:text-4xl text-[#8B6B4B] font-light">
                    {stat.number}
                  </p>
                  <p className="font-[family-name:var(--font-inter)] text-[10px] tracking-[0.1em] uppercase text-[#111111]/50 mt-1">
                    {stat.label}
                  </p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
