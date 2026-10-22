'use client'

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'

type GalleryPhoto = { src: string; alt?: string; label?: string }

export default function FullscreenGallery({
  photos, index, open, title, onClose, onIndexChange,
}: {
  photos: GalleryPhoto[]
  index: number
  open: boolean
  title: string
  onClose: () => void
  onIndexChange: (index: number) => void
}) {
  const touchX = useRef<number | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const safeIndex = Math.max(0, Math.min(index, photos.length - 1))
  const move = (offset: number) => {
    if (photos.length > 1) onIndexChange((safeIndex + offset + photos.length) % photos.length)
  }

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose() }
      if (event.key === 'ArrowLeft' && photos.length > 1) { event.preventDefault(); onIndexChange((index - 1 + photos.length) % photos.length) }
      if (event.key === 'ArrowRight' && photos.length > 1) { event.preventDefault(); onIndexChange((index + 1) % photos.length) }
      if (event.key === 'Tab') {
        event.preventDefault()
        closeRef.current?.focus()
      }
    }
    window.addEventListener('keydown', keydown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', keydown)
      previousFocus?.focus()
    }
  }, [open, photos.length, index, onIndexChange, onClose])

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open && photos.length > 0 && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex h-[100dvh] w-screen flex-col bg-[#111111] text-[#F5F1EA]"
          onTouchStart={(event) => { touchX.current = event.touches[0]?.clientX ?? null }}
          onTouchEnd={(event) => {
            if (touchX.current === null) return
            const dx = (event.changedTouches[0]?.clientX ?? touchX.current) - touchX.current
            touchX.current = null
            if (Math.abs(dx) > 60) move(dx < 0 ? 1 : -1)
          }}
        >
          <header className="flex shrink-0 items-center justify-between gap-4 px-5 py-4 md:px-10">
            <div className="min-w-0 truncate font-[family-name:var(--font-cormorant)] text-lg text-[#D8D1C8] md:text-2xl">
              PRAGA LIVING <span className="ml-3 text-sm text-[#8B6B4B]">{title}</span>
            </div>
            <button ref={closeRef} type="button" onClick={onClose} aria-label="Cerrar galería" className="flex h-11 w-11 shrink-0 items-center justify-center border border-[#D8D1C8]/30 text-2xl hover:border-[#8B6B4B]">×</button>
          </header>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-2 md:px-20">
            <img src={photos[safeIndex].src} alt={photos[safeIndex].alt || title} className="max-h-full max-w-full object-contain" />
            {photos.length > 1 && <>
              <button type="button" onClick={() => move(-1)} aria-label="Foto anterior" className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-white/25 bg-[#111111]/75 text-3xl hover:border-[#8B6B4B] md:left-6">‹</button>
              <button type="button" onClick={() => move(1)} aria-label="Foto siguiente" className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-white/25 bg-[#111111]/75 text-3xl hover:border-[#8B6B4B] md:right-6">›</button>
            </>}
          </div>
          <footer className="shrink-0 px-4 pb-5 pt-3 text-center text-[11px] uppercase tracking-[0.2em] text-[#C8A47F]">
            {photos[safeIndex].label || title} · Foto {safeIndex + 1} / {photos.length}
          </footer>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
