'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion, useInView } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useSiteConfig } from '@/hooks/useSiteConfig'

type AmenityImage = { src: string; alt: string; label: string }
type Amenity = { id: string; name: string; description: string; images: AmenityImage[]; benefits: string[] }

const image = (src: string, alt: string, label: string): AmenityImage => ({ src: `/images/amenities-2026/${src}`, alt, label })

const defaultAmenities: Amenity[] = [
  { id: 'coworking', name: 'Coworking', description: 'Un entorno sereno para concentrarse, crear y conectar. La luz natural, las salas de reunión y las zonas de trabajo flexible hacen que cada jornada fluya sin salir de casa.', images: [image('coworking-01.jpg', 'Coworking de PRAGA Living con mesas de trabajo, vegetación y vista a la montaña', 'Trabajo con perspectiva'), image('coworking-02.jpg', 'Zona colaborativa del coworking de PRAGA Living', 'Conectar y crear')], benefits: ['Trabajo flexible', 'Salas de reunión', 'Luz natural', 'Conectividad'] },
  { id: 'gimnasio', name: 'Gimnasio', description: 'Entrenar se convierte en parte del paisaje. Un gimnasio completo, bañado por luz natural y equipado para combinar cardio, fuerza y movimiento funcional.', images: [image('gimnasio-01.jpg', 'Gimnasio de PRAGA Living con equipos de cardio y fuerza', 'Energía en movimiento'), image('gimnasio-02.jpg', 'Gimnasio panorámico de PRAGA Living con vista a la ciudad y la montaña', 'Entrenar con vista')], benefits: ['Cardio', 'Fuerza', 'Zona funcional', 'Vista panorámica'] },
  { id: 'salon-social', name: 'Salón Social', description: 'Un escenario cálido y sofisticado para celebrar, recibir y compartir. Sus ambientes integrados se adaptan con naturalidad a encuentros íntimos y ocasiones memorables.', images: [image('salon-social-01.jpg', 'Salón social de PRAGA Living con mobiliario contemporáneo', 'Momentos para compartir'), image('salon-social-02.jpg', 'Sala principal del salón social de PRAGA Living', 'Encuentros memorables'), image('salon-social-03.jpg', 'Salón social de PRAGA Living con comedor y vista panorámica', 'Celebrar con estilo')], benefits: ['Sala y comedor', 'Vista panorámica', 'Ambientes integrados', 'Diseño versátil'] },
  { id: 'vitality-pool', name: 'Vitality Pool', description: 'Agua, luz y horizonte en un refugio pensado para bajar el ritmo. La hidroterapia y las zonas de descanso crean una experiencia de renovación cotidiana.', images: [image('vitality-pool-01.jpg', 'Vitality Pool de PRAGA Living con iluminación cálida y vista exterior', 'Bienestar en el agua'), image('vitality-pool-02.jpg', 'Zona de descanso junto al Vitality Pool de PRAGA Living', 'Pausa y contemplación')], benefits: ['Hidroterapia', 'Temperatura controlada', 'Zona de descanso', 'Vista exterior'] },
  { id: 'sauna', name: 'Sauna & Turco', description: 'Un circuito privado de bienestar para recuperar el cuerpo y despejar la mente. Sauna, duchas de experiencia y vestieres se conectan en una atmósfera íntima y envolvente.', images: [image('sauna-01.jpg', 'Sauna en madera de PRAGA Living con vista a la montaña', 'Calor que renueva'), image('sauna-02.jpg', 'Segunda vista del sauna panorámico de PRAGA Living', 'Silencio y contemplación'), image('wellness-ducha-01.jpg', 'Ducha de experiencia del circuito de bienestar de PRAGA Living', 'Ritual de agua'), image('wellness-ducha-02.jpg', 'Zona de duchas y descanso de PRAGA Living', 'Pausa sensorial'), image('wellness-vestieres-01.jpg', 'Vestieres del área de bienestar de PRAGA Living', 'Bienestar en cada detalle')], benefits: ['Sauna', 'Baño turco', 'Duchas de experiencia', 'Vestieres'] },
  { id: 'ludoteca', name: 'Ludoteca', description: 'Un universo seguro para imaginar, jugar y descubrir. La ludoteca integra ambientes interiores y una zona al aire libre donde los más pequeños pueden vivir sus propias aventuras.', images: [image('ludoteca-01.jpg', 'Ludoteca interior de PRAGA Living con juegos y mobiliario infantil', 'Imaginar sin límites'), image('ludoteca-02.jpg', 'Salón infantil de PRAGA Living con mesas de actividades', 'Aprender jugando'), image('zona-infantil-01.jpg', 'Zona infantil exterior de PRAGA Living con juegos y vegetación', 'Aventuras al aire libre'), image('zona-infantil-02.jpg', 'Parque infantil exterior de PRAGA Living con columpios', 'Un lugar para crecer')], benefits: ['Juego interior', 'Zona exterior', 'Área creativa', 'Entorno seguro'] },
]

export default function Amenidades() {
  const { config } = useSiteConfig()
  const amenConfig = config?.amenidades
  const [selected, setSelected] = useState(0)
  const [activeImage, setActiveImage] = useState(0)
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const amenity = defaultAmenities[selected]
  const padded = (n: number) => String(n + 1).padStart(2, '0')
  const selectAmenity = (n: number) => { setSelected(n); setActiveImage(0) }
  const previous = () => setActiveImage((n) => (n - 1 + amenity.images.length) % amenity.images.length)
  const next = () => setActiveImage((n) => (n + 1) % amenity.images.length)

  return (
    <section id="amenidades" ref={ref} className="relative bg-[#F5F1EA] py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <motion.p initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} className="mb-4 text-[10px] uppercase tracking-[0.5em] text-[#8B6B4B]">{amenConfig?.label || 'Amenidades'}</motion.p>
          <motion.h2 initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.2 }} className="font-[family-name:var(--font-cormorant)] text-3xl font-light text-[#111111] md:text-5xl">{amenConfig?.title || 'Vender estilo de vida'}</motion.h2>
          <div className="mx-auto mt-6 h-px w-[60px] bg-[#8B6B4B]" />
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={isInView ? { opacity: 1, x: 0 } : {}} className="lg:col-span-7">
            <div className="lg:sticky lg:top-28">
              <div className="relative aspect-[4/3] overflow-hidden bg-[#171715]">
                <AnimatePresence mode="wait">
                  <motion.div key={`${amenity.id}-${activeImage}`} initial={{ opacity: 0, scale: 1.025 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.55 }} className="absolute inset-0">
                    <Image src={amenity.images[activeImage].src} alt={amenity.images[activeImage].alt} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 58vw" priority={selected === 0 && activeImage === 0} />
                  </motion.div>
                </AnimatePresence>
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#111111]/85 via-transparent to-[#111111]/10" />
                {amenity.images.length > 1 && <div className="absolute right-4 top-4 z-10 flex gap-2"><button type="button" onClick={previous} aria-label="Imagen anterior" className="flex h-10 w-10 items-center justify-center border border-white/30 bg-[#111111]/35 text-white backdrop-blur-sm hover:border-[#B89268]"><ChevronLeft className="h-4 w-4" /></button><button type="button" onClick={next} aria-label="Imagen siguiente" className="flex h-10 w-10 items-center justify-center border border-white/30 bg-[#111111]/35 text-white backdrop-blur-sm hover:border-[#B89268]"><ChevronRight className="h-4 w-4" /></button></div>}
                <div className="absolute inset-x-0 bottom-0 p-5 md:p-8"><span className="mb-1 block text-[10px] uppercase tracking-[0.3em] text-[#C5A47E]">{padded(selected)} / {padded(defaultAmenities.length - 1)} · Vista {activeImage + 1} de {amenity.images.length}</span><h3 className="font-[family-name:var(--font-cormorant)] text-2xl text-[#F5F1EA] md:text-3xl">{amenity.images[activeImage].label}</h3></div>
              </div>
              {amenity.images.length > 1 && <div className="mt-3 grid grid-flow-col auto-cols-fr gap-2" aria-label={`Galería de ${amenity.name}`}>{amenity.images.map((item, i) => <button key={item.src} type="button" onClick={() => setActiveImage(i)} aria-label={`Ver ${item.label}`} className={`relative aspect-[4/3] overflow-hidden border-2 ${activeImage === i ? 'border-[#8B6B4B]' : 'border-transparent opacity-55'}`}><Image src={item.src} alt="" fill className="object-cover" sizes="10vw" /></button>)}</div>}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} animate={isInView ? { opacity: 1, x: 0 } : {}} className="lg:col-span-5">
            {defaultAmenities.map((item, i) => { const active = selected === i; return <div key={item.id}><button type="button" onClick={() => selectAmenity(i)} aria-expanded={active} className={`w-full text-left transition-all ${active ? 'bg-[#111111] text-[#F5F1EA]' : 'border-b border-[#D8D1C8]/60 hover:bg-[#111111]/5'}`}><div className="flex items-center justify-between p-5 md:p-6"><div className="flex items-center gap-4 md:gap-5"><span className={`text-[10px] tracking-[0.15em] ${active ? 'text-[#B89268]' : 'text-[#111111]/30'}`}>{padded(i)}</span><span className={`font-[family-name:var(--font-cormorant)] text-lg md:text-xl ${active ? 'text-[#F5F1EA]' : 'text-[#111111]'}`}>{item.name}</span></div><span className={`text-lg ${active ? 'text-[#B89268]' : 'text-[#111111]/40'}`}>{active ? '×' : '+'}</span></div><AnimatePresence initial={false}>{active && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden"><div className="px-5 pb-5 md:px-6 md:pb-6"><p className="mb-4 text-sm leading-relaxed text-[#F5F1EA]/65">{item.description}</p><div className="flex flex-wrap gap-2">{item.benefits.map((benefit) => <span key={benefit} className="rounded-full border border-[#B89268]/40 bg-[#B89268]/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.1em] text-[#C5A47E]">{benefit}</span>)}</div></div></motion.div>}</AnimatePresence></button></div> })}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
