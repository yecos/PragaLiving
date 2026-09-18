'use client'

import Image from 'next/image'
import { useRef } from 'react'
import { motion, useInView, useScroll, useTransform } from 'framer-motion'
import { useSiteConfig } from '@/hooks/useSiteConfig'

interface GalleryItem {
  image: string
  title: string
  alt: string
}

const defaultGallery: GalleryItem[] = [
  {
    image: '/images/renders/atrio-2026/recepcion-bienvenida.jpg',
    title: 'Bienvenida serena',
    alt: 'Recepción de PRAGA Living con sala de espera, vegetación y acabados cálidos',
  },
  {
    image: '/images/renders/atrio-2026/recepcion-corredor.jpg',
    title: 'Recorridos luminosos',
    alt: 'Recepción y corredor interior de PRAGA Living en madera y piedra clara',
  },
  {
    image: '/images/renders/atrio-2026/recepcion-escalera.jpg',
    title: 'Naturaleza integrada',
    alt: 'Lobby de PRAGA Living con escalera, jardín interior y luz natural',
  },
  {
    image: '/images/renders/atrio-2026/recepcion-ascensor.jpg',
    title: 'Materialidad atemporal',
    alt: 'Lobby de PRAGA Living con recepción, ascensor y mobiliario orgánico',
  },
]

const defaultReceptionStory = {
  label: 'La llegada',
  title: 'Una llegada que anticipa la experiencia',
  description: 'La recepción combina piedra, madera, iluminación cálida y formas orgánicas para crear una bienvenida serena. Cada detalle marca la transición entre el ritmo de la ciudad y la calma de llegar a casa.',
}

const defaultAtriumStory = {
  label: 'El corazón del proyecto',
  title: 'El corazón vivo del edificio',
  description: 'Un vacío vertical bañado por luz natural conecta visualmente cada nivel. Sus recorridos curvos, jardines interiores y materialidad honesta transforman la circulación cotidiana en una experiencia de encuentro, amplitud y conexión.',
}

export default function Atrio() {
  const { config } = useSiteConfig()
  const atrioConfig = config?.atrio

  // Los nuevos campos opcionales mantienen compatible la configuración anterior
  // mientras la narrativa visual renovada funciona como experiencia predeterminada.
  const heroImage = atrioConfig?.heroImage || '/images/renders/atrio-2026/atrio-niveles.jpg'
  const verticalImage = atrioConfig?.verticalImage || '/images/renders/atrio-2026/atrio-vertical.jpg'
  const label = atrioConfig?.label || 'El Atrio'
  const heading1 = atrioConfig?.heading1 || 'Un espacio que'
  const heading2Accent = atrioConfig?.heading2Accent || 'conecta y trasciende'
  const introParagraph = atrioConfig?.introParagraph || 'El atrio central de PRAGA Living articula el edificio desde la recepción hasta los niveles residenciales. La luz natural, la vegetación y una materialidad cálida convierten cada recorrido en una experiencia de conexión, calma y pertenencia.'
  const ctaText = atrioConfig?.ctaText || 'Recorrer el Atrio 360°'
  const ctaLink = atrioConfig?.ctaLink || '#recorridos'
  const gallery: GalleryItem[] = atrioConfig?.gallery?.length ? atrioConfig.gallery : defaultGallery
  const receptionStory = atrioConfig?.receptionStory || defaultReceptionStory
  const atriumStory = atrioConfig?.atriumStory || defaultAtriumStory

  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const scale = useTransform(scrollYProgress, [0, 0.35, 1], [1.12, 1, 1.05])
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.55, 1], [0, 1, 1, 0.45])

  return (
    <section id="atrio" ref={ref} className="relative overflow-hidden">
      <div className="relative h-[82vh] min-h-[620px] md:h-screen overflow-hidden bg-[#111111]">
        <motion.div style={{ scale }} className="absolute inset-0">
          <Image
            src={heroImage}
            alt="Atrio central de PRAGA Living conectando los niveles residenciales"
            fill
            quality={90}
            sizes="100vw"
            className="object-cover"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#111111]/55 via-[#111111]/10 to-[#111111]/90" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#111111]/40 via-transparent to-transparent" />

        <motion.div
          style={{ opacity }}
          className="relative z-10 h-full flex flex-col justify-end px-6 md:px-16 lg:px-24 pb-16 md:pb-24"
        >
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-[10px] tracking-[0.5em] uppercase text-[#C4A265] mb-4"
          >
            {label}
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, delay: 0.2 }}
            className="font-[family-name:var(--font-cormorant)] text-4xl md:text-6xl lg:text-7xl text-[#F5F1EA] font-light leading-[0.95] max-w-3xl"
          >
            {heading1}
            <br />
            <span className="text-[#C4A265]">{heading2Accent}</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.55 }}
            className="font-[family-name:var(--font-inter)] text-sm text-[#F5F1EA]/75 leading-relaxed max-w-2xl mt-6"
          >
            {introParagraph}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.75 }}
            className="mt-8"
          >
            <a
              href={ctaLink}
              className="inline-flex items-center gap-2 text-[11px] tracking-[0.15em] uppercase text-[#C4A265] hover:text-[#F5F1EA] transition-colors"
            >
              {ctaText}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </motion.div>
        </motion.div>
      </div>

      <div className="bg-[#111111] py-20 md:py-28 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-[0.72fr_1.6fr] gap-12 lg:gap-20 items-start">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.8 }}
              className="lg:sticky lg:top-28"
            >
              <p className="text-[10px] tracking-[0.45em] uppercase text-[#8B6B4B] mb-5">
                {receptionStory.label}
              </p>
              <h3 className="font-[family-name:var(--font-cormorant)] text-3xl md:text-5xl text-[#F5F1EA] font-light leading-tight">
                {receptionStory.title}
              </h3>
              <div className="w-14 h-px bg-[#8B6B4B] my-7" />
              <p className="font-[family-name:var(--font-inter)] text-sm text-[#D8D1C8]/65 leading-7">
                {receptionStory.description}
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
              {gallery.map((item, index) => (
                <motion.figure
                  key={item.image}
                  initial={{ opacity: 0, y: 35 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.75, delay: (index % 2) * 0.1 }}
                  className={`group relative overflow-hidden bg-[#1A1A1A] ${index === 0 ? 'md:col-span-2' : ''}`}
                >
                  <div className={`relative ${index === 0 ? 'aspect-[16/9]' : 'aspect-[4/3]'}`}>
                    <Image
                      src={item.image}
                      alt={item.alt}
                      fill
                      quality={88}
                      sizes={index === 0 ? '(max-width: 1024px) 100vw, 64vw' : '(max-width: 768px) 100vw, 32vw'}
                      className="object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.035]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/75 via-transparent to-transparent" />
                    <figcaption className="absolute left-5 right-5 bottom-4 font-[family-name:var(--font-cormorant)] text-lg text-[#F5F1EA] tracking-wide">
                      {item.title}
                    </figcaption>
                  </div>
                </motion.figure>
              ))}
            </div>
          </div>

          <div className="mt-24 md:mt-36 pt-16 md:pt-24 border-t border-[#D8D1C8]/10 grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-24 items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 1 }}
              className="relative aspect-[4/5] max-h-[820px] overflow-hidden bg-[#1A1A1A]"
            >
              <Image
                src={verticalImage}
                alt="Vista ascendente del atrio central de PRAGA Living"
                fill
                quality={90}
                sizes="(max-width: 1024px) 100vw, 52vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/35 via-transparent to-transparent" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 35 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.9 }}
            >
              <p className="text-[10px] tracking-[0.45em] uppercase text-[#8B6B4B] mb-5">
                {atriumStory.label}
              </p>
              <h3 className="font-[family-name:var(--font-cormorant)] text-3xl md:text-5xl lg:text-6xl text-[#F5F1EA] font-light leading-[1.02]">
                {atriumStory.title}
              </h3>
              <div className="w-14 h-px bg-[#8B6B4B] my-7" />
              <p className="font-[family-name:var(--font-inter)] text-sm text-[#D8D1C8]/65 leading-7 max-w-lg">
                {atriumStory.description}
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
