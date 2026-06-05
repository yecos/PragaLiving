'use client'

import { useRef } from 'react'
import { motion, useInView, useScroll, useTransform } from 'framer-motion'

export default function Atrio() {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  })
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.2, 1, 1.1])
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0])

  return (
    <section id="atrio" ref={ref} className="relative py-0 overflow-hidden">
      {/* Full-width cinematic image */}
      <div className="relative h-[80vh] md:h-screen overflow-hidden">
        <motion.div style={{ scale }} className="absolute inset-0">
          <img
            src="/images/renders/atrio-main.png"
            alt="PRAGA Living Atrio"
            className="w-full h-full object-cover"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#111111]/70 via-transparent to-[#111111]/80" />

        {/* Content overlay */}
        <motion.div style={{ opacity }} className="relative z-10 h-full flex flex-col justify-end px-6 md:px-16 pb-16 md:pb-24">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-[10px] tracking-[0.5em] uppercase text-[#8B6B4B] mb-4"
          >
            El Atrio
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, delay: 0.2 }}
            className="font-[family-name:var(--font-cormorant)] text-4xl md:text-6xl lg:text-7xl text-[#F5F1EA] font-light leading-[0.95] max-w-3xl"
          >
            Un espacio que
            <br />
            <span className="text-[#8B6B4B]">conecta y trasciende</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="font-[family-name:var(--font-inter)] text-sm text-[#D8D1C8]/70 leading-relaxed max-w-xl mt-6"
          >
            El atrio central de PRAGA Living es el corazón del edificio. Un vacío vertical 
            que conecta todos los niveles, permitiendo que la luz natural descienda desde la 
            cubierta hasta el lobby, mientras la vegetación crea un microecosistema que purifica 
            el aire y renueva el espíritu.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-8"
          >
            <a href="#recorridos" className="inline-flex items-center gap-2 text-[11px] tracking-[0.15em] uppercase text-[#8B6B4B] hover:text-[#C4A265] transition-colors">
              Recorrer el Atrio 360°
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </motion.div>
        </motion.div>
      </div>

      {/* Additional atrio details */}
      <div className="bg-[#111111] py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                image: '/images/renders/atrium-interior-1.png',
                title: 'Luz Natural',
                description: 'La cubierta se abre al cielo, permitiendo que la luz del sol bañe cada nivel del atrio, creando un juego de sombras que cambia con las horas del día.'
              },
              {
                image: '/images/renders/atrium-interior-2.png',
                title: 'Vegetación Vertical',
                description: 'Plantas seleccionadas colonizan las barandas y muros del atrio, purificando el aire y creando una conexión orgánica entre la arquitectura y la naturaleza.'
              },
              {
                image: '/images/renders/lobby.png',
                title: 'Circulación Fluida',
                description: 'Las circulaciones curvas del atrio invitan al recorrido pausado, transformando el acto de llegar a casa en una experiencia sensorial completa.'
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 1 + i * 0.2 }}
                className="group"
              >
                <div className="relative overflow-hidden mb-6">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-72 object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-[#111111]/20 group-hover:bg-transparent transition-colors duration-500" />
                </div>
                <h3 className="font-[family-name:var(--font-cormorant)] text-xl text-[#F5F1EA] mb-3 tracking-wide">
                  {item.title}
                </h3>
                <p className="font-[family-name:var(--font-inter)] text-xs text-[#D8D1C8]/60 leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
