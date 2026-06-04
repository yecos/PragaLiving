'use client'

import { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'

const spaces = [
  { id: 'lobby', name: 'Lobby', image: '/images/renders/lobby.png' },
  { id: 'atrio', name: 'Atrio', image: '/images/renders/atrio-main.png' },
  { id: 'coworking', name: 'Coworking', image: '/images/renders/coworking.png' },
  { id: 'gimnasio', name: 'Gimnasio', image: '/images/renders/gimnasio.png' },
  { id: 'salon', name: 'Salón Social', image: '/images/renders/salon-social.png' },
  { id: 'studio', name: 'Studio', image: '/images/renders/studio-33.png' },
  { id: 'apto57', name: 'Apartamento 57 m²', image: '/images/renders/apto-57.png' },
  { id: 'apto74', name: 'Apartamento 74 m²', image: '/images/renders/apto-74.png' },
  { id: 'apto97', name: 'Penthouse 97 m²', image: '/images/renders/apto-97.png' },
]

export default function Recorridos360() {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [activeSpace, setActiveSpace] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)

  return (
    <section id="recorridos" ref={ref} className="relative py-24 md:py-32 bg-[#111111]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-[10px] tracking-[0.5em] uppercase text-[#8B6B4B] mb-4"
          >
            Recorridos 360°
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, delay: 0.2 }}
            className="font-[family-name:var(--font-cormorant)] text-3xl md:text-5xl text-[#F5F1EA] font-light"
          >
            Experimentar Espacios
          </motion.h2>
          <motion.div
            initial={{ width: 0 }}
            animate={isInView ? { width: 60 } : {}}
            transition={{ duration: 1, delay: 0.5 }}
            className="h-[1px] bg-[#8B6B4B] mx-auto mt-6"
          />
        </div>

        {/* Space selector */}
        <div className="flex gap-3 overflow-x-auto pb-4 mb-8 scrollbar-hide">
          {spaces.map((space, i) => (
            <motion.button
              key={space.id}
              initial={{ opacity: 0, y: 15 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.6 + i * 0.06 }}
              onClick={() => setActiveSpace(i)}
              className={`whitespace-nowrap px-5 py-2.5 text-[10px] tracking-[0.15em] uppercase transition-all duration-300 border ${
                activeSpace === i
                  ? 'border-[#8B6B4B] bg-[#8B6B4B]/10 text-[#8B6B4B]'
                  : 'border-[#D8D1C8]/10 text-[#D8D1C8]/40 hover:border-[#8B6B4B]/30 hover:text-[#D8D1C8]/60'
              }`}
            >
              {space.name}
            </motion.button>
          ))}
        </div>

        {/* 360 Viewer placeholder */}
        <div className="relative aspect-[16/9] bg-[#1A1A1A] overflow-hidden group">
          <img
            src={spaces[activeSpace].image}
            alt={spaces[activeSpace].name}
            className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500"
          />
          
          {/* 360 overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="w-20 h-20 border border-[#8B6B4B]/50 rounded-full mx-auto mb-4 flex items-center justify-center"
              >
                <div className="w-14 h-14 border border-[#8B6B4B]/30 rounded-full flex items-center justify-center">
                  <span className="text-[10px] tracking-[0.2em] text-[#8B6B4B]">360°</span>
                </div>
              </motion.div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-[#D8D1C8]/40">
                Arrastra para explorar
              </p>
            </div>
          </div>

          {/* Hotspot indicators */}
          <div className="absolute top-1/3 left-1/4">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-4 h-4 bg-[#8B6B4B]/60 rounded-full cursor-pointer flex items-center justify-center"
            >
              <div className="w-2 h-2 bg-[#8B6B4B] rounded-full" />
            </motion.div>
          </div>
          <div className="absolute top-1/2 right-1/3">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              className="w-4 h-4 bg-[#8B6B4B]/60 rounded-full cursor-pointer flex items-center justify-center"
            >
              <div className="w-2 h-2 bg-[#8B6B4B] rounded-full" />
            </motion.div>
          </div>

          {/* Fullscreen button */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="absolute top-4 right-4 p-2 bg-[#111111]/50 backdrop-blur-sm border border-[#D8D1C8]/10 hover:border-[#8B6B4B]/30 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D8D1C8" strokeWidth="1.5">
              <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />
            </svg>
          </button>

          {/* Space name */}
          <div className="absolute bottom-4 left-4">
            <p className="font-[family-name:var(--font-cormorant)] text-xl text-[#F5F1EA]">
              {spaces[activeSpace].name}
            </p>
            <p className="text-[9px] tracking-[0.2em] uppercase text-[#8B6B4B] mt-1">
              Recorrido Virtual
            </p>
          </div>
        </div>

        {/* Navigation dots */}
        <div className="flex justify-center gap-2 mt-6">
          {spaces.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveSpace(i)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                activeSpace === i ? 'bg-[#8B6B4B] w-6' : 'bg-[#D8D1C8]/20 hover:bg-[#D8D1C8]/40'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
