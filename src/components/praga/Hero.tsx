'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

const heroImages = [
  { src: '/images/renders/hero-day.png', alt: 'PRAGA Living Día' },
  { src: '/images/renders/hero-sunset.png', alt: 'PRAGA Living Atardecer' },
  { src: '/images/renders/hero-night.png', alt: 'PRAGA Living Noche' },
]

export default function Hero() {
  const [currentImage, setCurrentImage] = useState(0)
  const containerRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start']
  })

  const y = useTransform(scrollYProgress, [0, 1], [0, 200])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 1.1])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % heroImages.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section id="hero" ref={containerRef} className="relative h-screen overflow-hidden">
      {/* Background Images */}
      {heroImages.map((img, i) => (
        <motion.div
          key={i}
          className="absolute inset-0"
          initial={false}
          animate={{ opacity: currentImage === i ? 1 : 0 }}
          transition={{ duration: 2, ease: [0.76, 0, 0.24, 1] }}
        >
          <motion.div style={{ scale }} className="absolute inset-0">
            <img
              src={img.src}
              alt={img.alt}
              className="w-full h-full object-cover"
            />
          </motion.div>
        </motion.div>
      ))}

      {/* Overlay */}
      <div className="absolute inset-0 praga-overlay-dark" />

      {/* Content */}
      <motion.div 
        style={{ y, opacity }}
        className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 2.5, ease: [0.76, 0, 0.24, 1] }}
          className="mb-6"
        >
          <div className="w-[60px] h-[1px] bg-[#8B6B4B] mx-auto mb-8" />
          <p className="font-[family-name:var(--font-inter)] text-[10px] tracking-[0.5em] uppercase text-[#8B6B4B]">
            Residencias Premium
          </p>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 2.8, ease: [0.76, 0, 0.24, 1] }}
          className="font-[family-name:var(--font-cormorant)] text-5xl md:text-7xl lg:text-8xl tracking-[0.15em] text-[#F5F1EA] font-light leading-[0.9]"
        >
          PRAGA
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 3.1, ease: [0.76, 0, 0.24, 1] }}
          className="font-[family-name:var(--font-cormorant)] text-xl md:text-2xl tracking-[0.3em] text-[#D8D1C8] font-light mt-2"
        >
          Living
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 3.5, ease: [0.76, 0, 0.24, 1] }}
          className="font-[family-name:var(--font-cormorant)] text-lg md:text-xl text-[#D8D1C8]/80 font-light mt-8 max-w-xl italic"
        >
          Arquitectura para quienes valoran lo excepcional
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 4, ease: [0.76, 0, 0.24, 1] }}
          className="flex flex-col sm:flex-row gap-4 mt-12"
        >
          <a
            href="#tipologias"
            className="text-[11px] tracking-[0.2em] uppercase bg-[#8B6B4B] text-[#F5F1EA] px-8 py-3.5 hover:bg-[#7A5C3E] transition-all duration-300"
          >
            Explorar Residencias
          </a>
          <a
            href="#atrio"
            className="text-[11px] tracking-[0.2em] uppercase border border-[#F5F1EA]/30 text-[#F5F1EA] px-8 py-3.5 hover:border-[#8B6B4B] hover:text-[#8B6B4B] transition-all duration-300"
          >
            Recorrer Edificio
          </a>
        </motion.div>

        {/* Image indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 4.5, duration: 1 }}
          className="absolute bottom-32 flex gap-3"
        >
          {heroImages.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentImage(i)}
              className={`w-8 h-[1px] transition-all duration-500 ${
                currentImage === i ? 'bg-[#8B6B4B] w-12' : 'bg-[#F5F1EA]/30'
              }`}
            />
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 5, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <p className="text-[9px] tracking-[0.3em] uppercase text-[#D8D1C8]/50">Scroll</p>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-[1px] h-8 bg-gradient-to-b from-[#8B6B4B] to-transparent"
        />
      </motion.div>
    </section>
  )
}
