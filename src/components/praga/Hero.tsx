'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useSiteConfig } from '@/hooks/useSiteConfig'

const defaultHeroImages = [
  { src: '/images/renders/hero-day.jpg', alt: 'PRAGA Living Día', label: 'Día' },
  { src: '/images/renders/hero-sunset.jpg', alt: 'PRAGA Living Atardecer', label: 'Atardecer' },
  { src: '/images/renders/hero-night.jpg', alt: 'PRAGA Living Noche', label: 'Noche' },
]

// Time-of-day icons as inline SVGs
const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
)

const SunsetIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 10V2" />
    <path d="m4.93 10.93 1.41 1.41" />
    <path d="M2 18h2" />
    <path d="M20 18h2" />
    <path d="m19.07 10.93-1.41 1.41" />
    <path d="M22 22H2" />
    <path d="M16 6l-4 4-4-4" />
    <path d="M16 18a4 4 0 0 0-8 0" />
  </svg>
)

const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
)

const timeOfDayIcons = [SunIcon, SunsetIcon, MoonIcon]

export default function Hero() {
  const { config } = useSiteConfig()
  const heroConfig = config?.hero

  const heroImages = heroConfig?.images || defaultHeroImages
  const subtitle = heroConfig?.subtitle || 'Residencias Premium'
  const title = heroConfig?.title || 'PRAGA'
  const titleAccent = heroConfig?.titleAccent || 'Living'
  const tagline = heroConfig?.tagline || 'Arquitectura para quienes valoran lo excepcional'
  const ctaPrimary = heroConfig?.ctaPrimary || { text: 'Explorar Residencias', link: '#tipologias' }
  const ctaSecondary = heroConfig?.ctaSecondary || { text: 'Recorrer Edificio', link: '#atrio' }
  const slideInterval = heroConfig?.slideInterval || 6000

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
    }, slideInterval)
    return () => clearInterval(interval)
  }, [heroImages.length, slideInterval])

  return (
    <section id="hero" ref={containerRef} className="relative h-screen overflow-hidden">
      {/* Background Images */}
      {heroImages.map((img: { src: string; alt: string; label: string }, i: number) => (
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

      {/* Noise / Grain texture overlay */}
      <div className="absolute inset-0 z-[2] pointer-events-none opacity-[0.035]" 
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
        }} 
      />

      {/* Horizontal light streaks */}
      <div className="absolute inset-0 z-[3] pointer-events-none overflow-hidden">
        <div 
          className="absolute inset-0 opacity-[0.06]"
          style={{
            background: `
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 48%,
                rgba(139, 107, 75, 0.15) 49.5%,
                rgba(245, 241, 234, 0.08) 50%,
                rgba(139, 107, 75, 0.15) 50.5%,
                transparent 51%,
                transparent 100%
              )
            `,
            animation: 'lightStreakMove 20s linear infinite',
          }}
        />
        <div 
          className="absolute inset-0 opacity-[0.04]"
          style={{
            background: `
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 32%,
                rgba(139, 107, 75, 0.12) 33.5%,
                rgba(245, 241, 234, 0.06) 34%,
                rgba(139, 107, 75, 0.12) 34.5%,
                transparent 35%,
                transparent 100%
              )
            `,
            animation: 'lightStreakMove2 15s linear infinite',
          }}
        />
      </div>

      {/* Vignette effect */}
      <div className="absolute inset-0 z-[4] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(17,17,17,0.5) 75%, rgba(17,17,17,0.85) 100%)',
        }}
      />

      {/* Original overlay (kept for depth) */}
      <div className="absolute inset-0 praga-overlay-dark z-[5]" />

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
            {subtitle}
          </p>
        </motion.div>

        {/* PRAGA title with clip-path reveal from center */}
        <div className="overflow-hidden">
          <motion.h1
            initial={{ clipPath: 'inset(0 50% 0 50%)', opacity: 0 }}
            animate={{ clipPath: 'inset(0 0% 0 0%)', opacity: 1 }}
            transition={{ duration: 1.4, delay: 2.8, ease: [0.76, 0, 0.24, 1] }}
            className="font-[family-name:var(--font-cormorant)] text-5xl md:text-7xl lg:text-8xl tracking-[0.15em] text-[#F5F1EA] font-light leading-[0.9]"
          >
            {title}
          </motion.h1>
        </div>

        {/* "Living" with letter-spacing animation */}
        <motion.p
          initial={{ opacity: 0, letterSpacing: '0.05em' }}
          animate={{ opacity: 1, letterSpacing: '0.3em' }}
          transition={{ duration: 1.2, delay: 3.4, ease: [0.76, 0, 0.24, 1] }}
          className="font-[family-name:var(--font-cormorant)] text-xl md:text-2xl tracking-[0.3em] text-[#D8D1C8] font-light mt-2"
        >
          {titleAccent}
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 3.8, ease: [0.76, 0, 0.24, 1] }}
          className="font-[family-name:var(--font-cormorant)] text-lg md:text-xl text-[#D8D1C8]/80 font-light mt-8 max-w-xl italic"
        >
          {tagline}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 4.2, ease: [0.76, 0, 0.24, 1] }}
          className="flex flex-col sm:flex-row gap-4 mt-12"
        >
          <a
            href={ctaPrimary.link}
            className="text-[11px] tracking-[0.2em] uppercase bg-[#8B6B4B] text-[#F5F1EA] px-8 py-3.5 hover:bg-[#7A5C3E] transition-all duration-300"
          >
            {ctaPrimary.text}
          </a>
          <a
            href={ctaSecondary.link}
            className="text-[11px] tracking-[0.2em] uppercase border border-[#F5F1EA]/30 text-[#F5F1EA] px-8 py-3.5 hover:border-[#8B6B4B] hover:text-[#8B6B4B] transition-all duration-300"
          >
            {ctaSecondary.text}
          </a>
        </motion.div>

        {/* Time-of-day indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 5, duration: 1 }}
          className="absolute bottom-32 flex items-center gap-1"
        >
          {heroImages.map((img: { src: string; alt: string; label: string }, i: number) => {
            const IconComponent = timeOfDayIcons[i % timeOfDayIcons.length]
            return (
              <button
                key={i}
                onClick={() => setCurrentImage(i)}
                className={`flex items-center gap-1.5 px-3 py-1.5 transition-all duration-500 ${
                  currentImage === i
                    ? 'text-[#8B6B4B]'
                    : 'text-[#D8D1C8]/40 hover:text-[#D8D1C8]/70'
                }`}
                aria-label={`Ver ${img.label}`}
              >
                <IconComponent />
                <span className="font-[family-name:var(--font-inter)] text-[9px] tracking-[0.2em] uppercase hidden sm:inline">
                  {img.label}
                </span>
              </button>
            )
          })}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 5.5, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10"
      >
        <p className="text-[9px] tracking-[0.3em] uppercase text-[#D8D1C8]/50">Scroll</p>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-[1px] h-8 bg-gradient-to-b from-[#8B6B4B] to-transparent"
        />
      </motion.div>

      {/* CSS animations for light streaks */}
      <style jsx>{`
        @keyframes lightStreakMove {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        @keyframes lightStreakMove2 {
          0% { transform: translateY(100%); }
          100% { transform: translateY(-100%); }
        }
      `}</style>
    </section>
  )
}
