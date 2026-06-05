'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

export default function Manifiesto() {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section ref={ref} className="relative py-32 md:py-40 bg-[#111111] overflow-hidden">
      {/* Decorative lines */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-20 bg-[#8B6B4B]/30" />
      
      <div className="max-w-4xl mx-auto px-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-[10px] tracking-[0.5em] uppercase text-[#8B6B4B] mb-12"
        >
          Manifiesto
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 0.2 }}
          className="font-[family-name:var(--font-cormorant)] text-3xl md:text-5xl lg:text-6xl text-[#F5F1EA] font-light leading-tight tracking-wide"
        >
          Una pieza arquitectónica
          <br />
          <span className="text-gradient-bronce">diseñada para permanecer</span>
        </motion.h2>

        <motion.div
          initial={{ width: 0 }}
          animate={isInView ? { width: 60 } : {}}
          transition={{ duration: 1, delay: 0.6 }}
          className="h-[1px] bg-[#8B6B4B] mx-auto my-12"
        />

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="font-[family-name:var(--font-inter)] text-sm md:text-base text-[#D8D1C8]/70 leading-relaxed max-w-2xl mx-auto"
        >
          PRAGA Living no vende apartamentos. Vende arquitectura, diseño, bienestar, 
          permanencia, exclusividad, patrimonio y estilo de vida. Cada espacio ha sido 
          concebido como una obra que trasciende el tiempo, donde la materia se transforma 
          en experiencia y la estructura se convierte en hogar.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 1 }}
          className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {['Arquitectura', 'Bienestar', 'Permanencia', 'Exclusividad'].map((word, i) => (
            <motion.div
              key={word}
              initial={{ opacity: 0, y: 15 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 1.2 + i * 0.15 }}
              className="text-center"
            >
              <p className="font-[family-name:var(--font-cormorant)] text-lg text-[#8B6B4B] tracking-wider">
                {word}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1px] h-20 bg-[#8B6B4B]/30" />
    </section>
  )
}
