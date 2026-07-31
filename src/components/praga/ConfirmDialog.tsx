'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'

// ============================================
// Reusable confirm dialog — replaces native window.confirm()
// ============================================
// Usage:
//   const [confirmState, setConfirmState] = useState<{
//     open: boolean
//     title: string
//     message: string
//     onConfirm: () => void
//   }>({ open: false, title: '', message: '', onConfirm: () => {} })
//
//   const askConfirm = (title: string, message: string, onConfirm: () => void) => {
//     setConfirmState({ open: true, title, message, onConfirm })
//   }
//
//   <ConfirmDialog
//     open={confirmState.open}
//     title={confirmState.title}
//     message={confirmState.message}
//     onConfirm={() => { confirmState.onConfirm(); setConfirmState({ ...confirmState, open: false }) }}
//     onCancel={() => setConfirmState({ ...confirmState, open: false })}
//   />

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'info'
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'warning',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const variantStyles = {
    danger: {
      icon: 'text-red-400',
      border: 'border-red-500/30',
      bg: 'bg-red-500/10',
      button: 'bg-red-600 hover:bg-red-700 text-white',
    },
    warning: {
      icon: 'text-[#8B6B4B]',
      border: 'border-[#8B6B4B]/30',
      bg: 'bg-[#8B6B4B]/10',
      button: 'bg-[#8B6B4B] hover:bg-[#7A5C3E] text-[#F5F1EA]',
    },
    info: {
      icon: 'text-[#4B5646]',
      border: 'border-[#4B5646]/30',
      bg: 'bg-[#4B5646]/10',
      button: 'bg-[#4B5646] hover:bg-[#3A4537] text-[#F5F1EA]',
    },
  }[variant]

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] bg-black/70 flex items-center justify-center p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`bg-[#111111] border ${variantStyles.border} max-w-sm w-full`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b border-[#D8D1C8]/10 flex items-center gap-3">
              <div className={`w-10 h-10 ${variantStyles.bg} ${variantStyles.border} border flex items-center justify-center`}>
                <AlertTriangle className={`w-5 h-5 ${variantStyles.icon}`} />
              </div>
              <h3 className="font-[family-name:var(--font-cormorant)] text-xl text-[#F5F1EA]">
                {title}
              </h3>
            </div>

            {/* Body */}
            <div className="p-5">
              <p className="text-[12px] text-[#D8D1C8]/60 leading-relaxed">
                {message}
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-5 border-t border-[#D8D1C8]/10">
              <button
                onClick={onCancel}
                className="text-[10px] tracking-wider uppercase border border-[#D8D1C8]/15 text-[#D8D1C8]/40 px-4 py-2.5 hover:text-[#D8D1C8] transition-colors"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                className={`text-[10px] tracking-wider uppercase px-5 py-2.5 transition-colors ${variantStyles.button}`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
