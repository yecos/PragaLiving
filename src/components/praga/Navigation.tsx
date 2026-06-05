'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const navItems = [
  { label: 'Inicio', href: '#hero' },
  { label: 'Arquitectura', href: '#arquitectura' },
  { label: 'Edificio', href: '#edificio' },
  { label: 'Atrio', href: '#atrio' },
  { label: 'Amenidades', href: '#amenidades' },
  { label: 'Tipologías', href: '#tipologias' },
  { label: 'Planta', href: '#planta' },
  { label: '360°', href: '#recorridos' },
  { label: 'Ubicación', href: '#ubicacion' },
  { label: 'Galería', href: '#galeria' },
  { label: 'Inversión', href: '#inversion' },
  { label: 'Contacto', href: '#contacto' },
]

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('hero')

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80)
      
      const sections = navItems.map(item => item.href.replace('#', ''))
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i])
        if (el) {
          const rect = el.getBoundingClientRect()
          if (rect.top <= 150) {
            setActiveSection(sections[i])
            break
          }
        }
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollTo = (href: string) => {
    setMenuOpen(false)
    const el = document.querySelector(href)
    if (!el) return
    // Use Lenis smooth scroll if available, otherwise fallback to native
    const lenis = (window as unknown as Record<string, unknown>).__lenis as { scrollTo: (target: Element, options?: { offset?: number }) => void } | undefined
    if (lenis) {
      lenis.scrollTo(el, { offset: -80 })
    } else {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, delay: 2.2, ease: [0.76, 0, 0.24, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled 
            ? 'bg-[#111111]/95 backdrop-blur-md py-3' 
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <button onClick={() => scrollTo('#hero')} className="flex items-center gap-3 group">
            <img
              src="/images/logo.png"
              alt="PRAGA Living"
              className="h-8 md:h-10 w-auto object-contain brightness-0 invert"
            />
          </button>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-8">
            {navItems.slice(1, 8).map((item) => (
              <button
                key={item.href}
                onClick={() => scrollTo(item.href)}
                className={`text-[11px] tracking-[0.15em] uppercase transition-all duration-300 hover:text-[#8B6B4B] relative ${
                  scrolled ? 'text-[#D8D1C8]' : 'text-[#F5F1EA]/80'
                } ${activeSection === item.href.replace('#', '') ? 'text-[#8B6B4B]' : ''}`}
              >
                {item.label}
                {activeSection === item.href.replace('#', '') && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -bottom-1 left-0 right-0 h-[1px] bg-[#8B6B4B]"
                  />
                )}
              </button>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-4">
            <button
              onClick={() => scrollTo('#contacto')}
              className="text-[11px] tracking-[0.15em] uppercase bg-[#8B6B4B] text-[#F5F1EA] px-6 py-2.5 hover:bg-[#7A5C3E] transition-colors duration-300"
            >
              Agendar Visita
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden flex flex-col gap-1.5 p-2"
          >
            <motion.span
              animate={{ rotate: menuOpen ? 45 : 0, y: menuOpen ? 7 : 0 }}
              className={`block w-6 h-[1px] transition-colors ${scrolled ? 'bg-[#F5F1EA]' : 'bg-[#F5F1EA]'}`}
            />
            <motion.span
              animate={{ opacity: menuOpen ? 0 : 1 }}
              className={`block w-6 h-[1px] transition-colors ${scrolled ? 'bg-[#F5F1EA]' : 'bg-[#F5F1EA]'}`}
            />
            <motion.span
              animate={{ rotate: menuOpen ? -45 : 0, y: menuOpen ? -7 : 0 }}
              className={`block w-6 h-[1px] transition-colors ${scrolled ? 'bg-[#F5F1EA]' : 'bg-[#F5F1EA]'}`}
            />
          </button>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-[#111111] flex items-center justify-center"
          >
            <div className="flex flex-col items-center gap-6">
              {navItems.map((item, i) => (
                <motion.button
                  key={item.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => scrollTo(item.href)}
                  className={`font-[family-name:var(--font-cormorant)] text-3xl tracking-[0.15em] transition-colors duration-300 hover:text-[#8B6B4B] ${
                    activeSection === item.href.replace('#', '') ? 'text-[#8B6B4B]' : 'text-[#F5F1EA]'
                  }`}
                >
                  {item.label}
                </motion.button>
              ))}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: navItems.length * 0.05 }}
                onClick={() => scrollTo('#contacto')}
                className="mt-4 text-[11px] tracking-[0.15em] uppercase bg-[#8B6B4B] text-[#F5F1EA] px-8 py-3 hover:bg-[#7A5C3E] transition-colors"
              >
                Agendar Visita
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
