'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Navigation from '@/components/praga/Navigation'
import Hero from '@/components/praga/Hero'
import Manifiesto from '@/components/praga/Manifiesto'
import Arquitectura from '@/components/praga/Arquitectura'
import ExplorarEdificio from '@/components/praga/ExplorarEdificio'
import Atrio from '@/components/praga/Atrio'
import Amenidades from '@/components/praga/Amenidades'
import Tipologias from '@/components/praga/Tipologias'
import PlantaInteractiva from '@/components/praga/PlantaInteractiva'
import Recorridos360 from '@/components/praga/Recorridos360'
import Ubicacion from '@/components/praga/Ubicacion'
import Galeria from '@/components/praga/Galeria'
import Inversion from '@/components/praga/Inversion'
import Contacto from '@/components/praga/Contacto'
import Footer from '@/components/praga/Footer'
import WhatsAppButton from '@/components/praga/WhatsAppButton'
import ChatIA from '@/components/praga/ChatIA'

export default function Home() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2200)
    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      <AnimatePresence>
        {loading && (
          <motion.div
            key="loader"
            className="fixed inset-0 z-[100] bg-[#111111] flex items-center justify-center"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: 60 }}
                transition={{ duration: 1.5, ease: [0.76, 0, 0.24, 1] }}
                className="h-[1px] bg-[#8B6B4B] mx-auto mb-8"
              />
              <motion.img
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                src="/images/logo.png"
                alt="PRAGA Living"
                className="h-16 md:h-20 w-auto mx-auto brightness-0 invert"
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: 60 }}
                transition={{ duration: 1.5, ease: [0.76, 0, 0.24, 1], delay: 0.3 }}
                className="h-[1px] bg-[#8B6B4B] mx-auto mt-8"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative">
        <Navigation />
        <Hero />
        <Manifiesto />
        <Arquitectura />
        <ExplorarEdificio />
        <Atrio />
        <Amenidades />
        <Tipologias />
        <PlantaInteractiva />
        <Recorridos360 />
        <Ubicacion />
        <Galeria />
        <Inversion />
        <Contacto />
        <Footer />
        <WhatsAppButton />
        <ChatIA />
      </main>
    </>
  )
}
