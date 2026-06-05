'use client'

import { useRef, useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { useSiteConfig } from '@/hooks/useSiteConfig'

const defaultCategories = [
  'Exteriores',
  'Interiores',
  'Atrio',
  'Amenidades',
  'Tipologías',
  'Videos',
]

const defaultGalleryItems = [
  { id: 1, category: 'Exteriores', src: '/images/renders/hero-day.jpg', title: 'Fachada Principal - Día' },
  { id: 2, category: 'Exteriores', src: '/images/renders/hero-sunset.jpg', title: 'Vista Atardecer' },
  { id: 3, category: 'Exteriores', src: '/images/renders/hero-night.jpg', title: 'Vista Nocturna' },
  { id: 4, category: 'Exteriores', src: '/images/renders/exterior-dusk.png', title: 'Fachada - Atardecer' },
  { id: 5, category: 'Exteriores', src: '/images/renders/exterior-golden.png', title: 'Fachada - Golden Hour' },
  { id: 6, category: 'Interiores', src: '/images/renders/lobby.png', title: 'Lobby Principal' },
  { id: 7, category: 'Atrio', src: '/images/renders/atrio-main.png', title: 'Atrio Central' },
  { id: 8, category: 'Atrio', src: '/images/renders/atrium-interior-1.png', title: 'Atrio - Vista Inferior' },
  { id: 9, category: 'Atrio', src: '/images/renders/atrium-interior-2.png', title: 'Atrio - Vista Superior' },
  { id: 10, category: 'Amenidades', src: '/images/renders/coworking.png', title: 'Coworking' },
  { id: 11, category: 'Amenidades', src: '/images/renders/gimnasio.png', title: 'Gimnasio' },
  { id: 12, category: 'Amenidades', src: '/images/renders/salon-social.png', title: 'Salón Social' },
  { id: 13, category: 'Amenidades', src: '/images/renders/vitality-pool.png', title: 'Vitality Pool' },
  { id: 14, category: 'Tipologías', src: '/images/renders/studio-33.png', title: 'Studio 33 m²' },
  { id: 15, category: 'Tipologías', src: '/images/renders/apto-57.png', title: 'Apartamento 57 m²' },
  { id: 16, category: 'Tipologías', src: '/images/renders/apto-74.png', title: 'Apartamento 74 m²' },
  { id: 17, category: 'Tipologías', src: '/images/renders/apto-97.png', title: 'Penthouse 97 m²' },
]

export default function Galeria() {
  const { config } = useSiteConfig()
  const galConfig = config?.galeria

  const label = galConfig?.label || 'Galería'
  const title = galConfig?.title || 'Visualizar Proyecto'
  const categories = galConfig?.categories || defaultCategories
  const galleryItems = galConfig?.items || defaultGalleryItems

  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [activeCategory, setActiveCategory] = useState(categories[0] || 'Exteriores')
  const [lightboxItem, setLightboxItem] = useState<typeof galleryItems[0] | null>(null)

  const filteredItems = galleryItems.filter((item: { category: string }) => item.category === activeCategory)

  return (
    <section id="galeria" ref={ref} className="relative py-24 md:py-32 bg-[#111111]">
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
            className="font-[family-name:var(--font-cormorant)] text-3xl md:text-5xl text-[#F5F1EA] font-light"
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

        {/* Category filter */}
        <div className="flex justify-center gap-3 mb-12 overflow-x-auto">
          {categories.map((cat: string) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-5 py-2 text-[10px] tracking-[0.15em] uppercase transition-all duration-300 border ${
                activeCategory === cat
                  ? 'border-[#8B6B4B] bg-[#8B6B4B]/10 text-[#8B6B4B]'
                  : 'border-[#D8D1C8]/10 text-[#D8D1C8]/40 hover:border-[#8B6B4B]/30 hover:text-[#D8D1C8]/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Gallery grid */}
        <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item: { id: number; src: string; title: string; category: string }, i: number) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="group cursor-pointer relative overflow-hidden aspect-square"
                onClick={() => setLightboxItem(item)}
              >
                <img
                  src={item.src}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-[#111111]/0 group-hover:bg-[#111111]/40 transition-colors duration-500 flex items-end">
                  <div className="p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-y-2 group-hover:translate-y-0">
                    <p className="text-[10px] text-[#D8D1C8]/80 tracking-wider">{item.title}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#111111]/95 flex items-center justify-center p-6"
            onClick={() => setLightboxItem(null)}
          >
            <motion.img
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.4 }}
              src={lightboxItem.src}
              alt={lightboxItem.title}
              className="max-w-full max-h-[85vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center">
              <p className="font-[family-name:var(--font-cormorant)] text-lg text-[#F5F1EA]">{lightboxItem.title}</p>
              <p className="text-[9px] tracking-[0.2em] uppercase text-[#8B6B4B] mt-1">{lightboxItem.category}</p>
            </div>
            <button
              onClick={() => setLightboxItem(null)}
              className="absolute top-6 right-6 p-2 border border-[#D8D1C8]/20 hover:border-[#8B6B4B] transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D8D1C8" strokeWidth="1.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
