'use client'

import { useRef, useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { useSiteConfig } from '@/hooks/useSiteConfig'

const defaultCategories = [
  "Exteriores",
  "Interiores",
  "Atrio",
  "Amenidades",
  "Tipologías",
  "Planos"
]

const defaultGalleryItems = [
  {"id":1,"category":"Exteriores","src":"/images/renders/hero-day.jpg","title":"Fachada principal · Día"},
  {"id":2,"category":"Exteriores","src":"/images/renders/hero-sunset.jpg","title":"Fachada principal · Atardecer"},
  {"id":3,"category":"Exteriores","src":"/images/renders/hero-night.jpg","title":"Fachada principal · Noche"},
  {"id":4,"category":"Exteriores","src":"/images/renders/exterior-dusk.png","title":"Fachada · Hora azul"},
  {"id":5,"category":"Exteriores","src":"/images/renders/exterior-golden.png","title":"Fachada · Luz dorada"},
  {"id":6,"category":"Interiores","src":"/images/renders/lobby.png","title":"Lobby principal"},
  {"id":7,"category":"Atrio","src":"/images/renders/atrio-2026/recepcion-bienvenida.jpg","title":"Atrio · Bienvenida"},
  {"id":8,"category":"Atrio","src":"/images/renders/atrio-2026/recepcion-corredor.jpg","title":"Atrio · Recorridos luminosos"},
  {"id":9,"category":"Atrio","src":"/images/renders/atrio-2026/recepcion-escalera.jpg","title":"Atrio · Naturaleza integrada"},
  {"id":10,"category":"Atrio","src":"/images/renders/atrio-2026/recepcion-ascensor.jpg","title":"Atrio · Materialidad atemporal"},
  {"id":11,"category":"Atrio","src":"/images/renders/atrio-2026/atrio-niveles.jpg","title":"Atrio · Niveles residenciales"},
  {"id":12,"category":"Atrio","src":"/images/renders/atrio-2026/atrio-vertical.jpg","title":"Atrio · Vista vertical"},
  {"id":13,"category":"Atrio","src":"/images/renders/atrio-main.png","title":"Atrio central"},
  {"id":14,"category":"Atrio","src":"/images/renders/atrium-interior-1.png","title":"Atrio · Vista inferior"},
  {"id":15,"category":"Atrio","src":"/images/renders/atrium-interior-2.png","title":"Atrio · Vista superior"},
  {"id":16,"category":"Amenidades","src":"/images/amenities-2026/coworking-01.jpg","title":"Coworking · Zona de trabajo"},
  {"id":17,"category":"Amenidades","src":"/images/amenities-2026/coworking-02.jpg","title":"Coworking · Sala colaborativa"},
  {"id":18,"category":"Amenidades","src":"/images/amenities-2026/gimnasio-01.jpg","title":"Gimnasio · Entrenamiento"},
  {"id":19,"category":"Amenidades","src":"/images/amenities-2026/gimnasio-02.jpg","title":"Gimnasio · Zona funcional"},
  {"id":20,"category":"Amenidades","src":"/images/amenities-2026/ludoteca-01.jpg","title":"Ludoteca · Zona infantil"},
  {"id":21,"category":"Amenidades","src":"/images/amenities-2026/ludoteca-02.jpg","title":"Ludoteca · Área creativa"},
  {"id":22,"category":"Amenidades","src":"/images/amenities-2026/salon-social-01.jpg","title":"Salón social · Vista principal"},
  {"id":23,"category":"Amenidades","src":"/images/amenities-2026/salon-social-02.jpg","title":"Salón social · Reuniones"},
  {"id":24,"category":"Amenidades","src":"/images/amenities-2026/salon-social-03.jpg","title":"Salón social · Terraza"},
  {"id":25,"category":"Amenidades","src":"/images/amenities-2026/sauna-01.jpg","title":"Sauna · Calor seco"},
  {"id":26,"category":"Amenidades","src":"/images/amenities-2026/sauna-02.jpg","title":"Sauna · Zona de descanso"},
  {"id":27,"category":"Amenidades","src":"/images/amenities-2026/vitality-pool-01.jpg","title":"Vitality Pool · Hidroterapia"},
  {"id":28,"category":"Amenidades","src":"/images/amenities-2026/vitality-pool-02.jpg","title":"Vitality Pool · Área de relajación"},
  {"id":29,"category":"Amenidades","src":"/images/amenities-2026/wellness-ducha-01.jpg","title":"Wellness · Duchas"},
  {"id":30,"category":"Amenidades","src":"/images/amenities-2026/wellness-ducha-02.jpg","title":"Wellness · Duchas privadas"},
  {"id":31,"category":"Amenidades","src":"/images/amenities-2026/wellness-vestieres-01.jpg","title":"Wellness · Vestieres"},
  {"id":32,"category":"Amenidades","src":"/images/amenities-2026/zona-infantil-01.jpg","title":"Zona infantil · Juego"},
  {"id":33,"category":"Amenidades","src":"/images/amenities-2026/zona-infantil-02.jpg","title":"Zona infantil · Lectura"},
  {"id":34,"category":"Tipologías","src":"/images/typologies/104-01.jpg","title":"104 m² · Vista 01"},
  {"id":35,"category":"Tipologías","src":"/images/typologies/104-02.jpg","title":"104 m² · Vista 02"},
  {"id":36,"category":"Tipologías","src":"/images/typologies/104-03.jpg","title":"104 m² · Vista 03"},
  {"id":37,"category":"Tipologías","src":"/images/typologies/104-04.jpg","title":"104 m² · Vista 04"},
  {"id":38,"category":"Tipologías","src":"/images/typologies/104-05.jpg","title":"104 m² · Vista 05"},
  {"id":39,"category":"Tipologías","src":"/images/typologies/104-06.jpg","title":"104 m² · Vista 06"},
  {"id":40,"category":"Tipologías","src":"/images/typologies/104-07.jpg","title":"104 m² · Vista 07"},
  {"id":41,"category":"Tipologías","src":"/images/typologies/104-08.jpg","title":"104 m² · Vista 08"},
  {"id":42,"category":"Tipologías","src":"/images/typologies/104-09.jpg","title":"104 m² · Vista 09"},
  {"id":43,"category":"Tipologías","src":"/images/typologies/104-10.jpg","title":"104 m² · Vista 10"},
  {"id":44,"category":"Tipologías","src":"/images/typologies/104-11.jpg","title":"104 m² · Vista 11"},
  {"id":45,"category":"Tipologías","src":"/images/typologies/78-01.jpg","title":"78.51 m² · Vista 01"},
  {"id":46,"category":"Tipologías","src":"/images/typologies/78-02.jpg","title":"78.51 m² · Vista 02"},
  {"id":47,"category":"Tipologías","src":"/images/typologies/78-03.jpg","title":"78.51 m² · Vista 03"},
  {"id":48,"category":"Tipologías","src":"/images/typologies/78-04.jpg","title":"78.51 m² · Vista 04"},
  {"id":49,"category":"Tipologías","src":"/images/typologies/78-05.jpg","title":"78.51 m² · Vista 05"},
  {"id":50,"category":"Tipologías","src":"/images/typologies/60-01.jpg","title":"60 m² · Vista 01"},
  {"id":51,"category":"Tipologías","src":"/images/typologies/60-02.jpg","title":"60 m² · Vista 02"},
  {"id":52,"category":"Tipologías","src":"/images/typologies/60-03.jpg","title":"60 m² · Vista 03"},
  {"id":53,"category":"Tipologías","src":"/images/typologies/60-04.jpg","title":"60 m² · Vista 04"},
  {"id":54,"category":"Tipologías","src":"/images/typologies/60-05.jpg","title":"60 m² · Vista 05"},
  {"id":55,"category":"Tipologías","src":"/images/typologies/60-06.jpg","title":"60 m² · Vista 06"},
  {"id":56,"category":"Tipologías","src":"/images/typologies/33-01.jpg","title":"33–36 m² · Vista 01"},
  {"id":57,"category":"Tipologías","src":"/images/typologies/33-02.jpg","title":"33–36 m² · Vista 02"},
  {"id":58,"category":"Tipologías","src":"/images/typologies/33-03.jpg","title":"33–36 m² · Vista 03"},
  {"id":59,"category":"Tipologías","src":"/images/typologies/33-04.jpg","title":"33–36 m² · Vista 04"},
  {"id":60,"category":"Planos","src":"/images/planos/fachadas.jpg","title":"Fachadas"},
  {"id":61,"category":"Planos","src":"/images/planos/planta-parqueaderos.jpg","title":"Planta de parqueaderos"},
  {"id":62,"category":"Planos","src":"/images/planos/planta-primer-piso.jpg","title":"Planta primer piso"},
  {"id":63,"category":"Planos","src":"/images/planos/planta-social.jpg","title":"Planta zona social"},
  {"id":64,"category":"Planos","src":"/images/planos/planta-techos.jpg","title":"Planta de techos"},
  {"id":65,"category":"Planos","src":"/images/planos/planta-tipo-impares.jpg","title":"Planta tipo · Pisos impares"},
  {"id":66,"category":"Planos","src":"/images/planos/planta-tipo-pares.jpg","title":"Planta tipo · Pisos pares"},
  {"id":67,"category":"Planos","src":"/images/planos/planta-tipo-residencial.png","title":"Planta tipo · Residencial"},
  {"id":68,"category":"Planos","src":"/images/planos/planta-tipo.jpg","title":"Planta tipo"},
  {"id":69,"category":"Planos","src":"/images/planos/secciones.jpg","title":"Secciones del proyecto"},
  {"id":70,"category":"Planos","src":"/images/renders/exploded-view.png","title":"Vista explotada del edificio"},
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
