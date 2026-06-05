'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const quickQuestions = [
  '¿Cuáles son las tipologías disponibles?',
  '¿Qué amenidades incluye el proyecto?',
  '¿Cuál es el precio de las residencias?',
  '¿Cómo agendo una visita?',
]

export default function ChatIA() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Bienvenido a PRAGA Living. Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?'
    }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (text?: string) => {
    const message = text || input
    if (!message.trim()) return

    const userMessage: Message = { role: 'user', content: message }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })

      if (!response.ok) throw new Error('Error en la respuesta')

      const data = await response.json()
      const assistantMessage: Message = { role: 'assistant', content: data.message }
      setMessages(prev => [...prev, assistantMessage])
    } catch {
      // Fallback response if API fails
      const fallbackResponses: Record<string, string> = {
        'tipologías': 'PRAGA Living ofrece 8 tipologías desde Studio de 33 m² hasta Penthouse de 97 m². Cada residencia está diseñada con acabados premium, balcones privados y ventilación cruzada. ¿Te gustaría conocer más detalles de alguna en particular?',
        'amenidades': 'Nuestras amenidades incluyen: Coworking, Gimnasio premium, Salón Social, Ludoteca, Sauna, Baño Turco, Vitality Pool, Hidromasaje, Hidroterapia y Zona de Descanso. Todo diseñado para un estilo de vida excepcional.',
        'precio': 'Los precios varían según la tipología y el piso. Te recomiendo agendar una visita con nuestros asesores para recibir información personalizada y actualizada. ¿Te gustaría que te contacte un asesor?',
        'visita': 'Puedes agendar una visita de tres formas: 1) Por WhatsApp al +57 300 123 4567, 2) Completando el formulario de contacto en esta página, o 3) Llamando al +57 601 234 5678. ¿Cuál prefieres?',
      }

      const key = Object.keys(fallbackResponses).find(k => message.toLowerCase().includes(k))
      const response = key 
        ? fallbackResponses[key]
        : 'Gracias por tu interés en PRAGA Living. Un asesor se pondrá en contacto contigo pronto para brindarte información personalizada. Mientras tanto, puedes explorar nuestras tipologías y amenidades en esta plataforma.'

      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'assistant', content: response }])
        setIsTyping(false)
      }, 1000)
      return
    }

    setIsTyping(false)
  }

  return (
    <>
      {/* Chat toggle button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-6 z-40 w-14 h-14 bg-[#111111] border border-[#8B6B4B]/30 rounded-full flex items-center justify-center shadow-lg hover:border-[#8B6B4B] transition-colors group"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.svg key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B6B4B" strokeWidth="1.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </motion.svg>
          ) : (
            <motion.div key="chat" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B6B4B" strokeWidth="1.5">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-24 left-6 z-40 w-[360px] max-h-[500px] bg-[#111111] border border-[#8B6B4B]/20 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-[#8B6B4B]/10 flex items-center gap-3">
              <img src="/images/logo.png" alt="PRAGA" className="h-6 w-auto brightness-0 invert opacity-70" />
              <div>
                <p className="text-[11px] text-[#F5F1EA] tracking-wider">Asistente PRAGA</p>
                <p className="text-[8px] text-[#4B5646] tracking-wider">En línea</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[350px]">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] p-3 ${
                    msg.role === 'user'
                      ? 'bg-[#8B6B4B] text-[#F5F1EA]'
                      : 'bg-[#1A1A1A] border border-[#D8D1C8]/10 text-[#D8D1C8]/80'
                  }`}>
                    <p className="text-[12px] leading-relaxed">{msg.content}</p>
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-[#1A1A1A] border border-[#D8D1C8]/10 p-3 flex gap-1">
                    <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity }} className="w-1.5 h-1.5 bg-[#8B6B4B] rounded-full" />
                    <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} className="w-1.5 h-1.5 bg-[#8B6B4B] rounded-full" />
                    <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} className="w-1.5 h-1.5 bg-[#8B6B4B] rounded-full" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick questions */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                {quickQuestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    className="text-[9px] tracking-wider border border-[#8B6B4B]/20 text-[#8B6B4B] px-2.5 py-1.5 hover:bg-[#8B6B4B]/10 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-[#8B6B4B]/10">
              <form
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Escribe tu pregunta..."
                  className="flex-1 bg-[#1A1A1A] border border-[#D8D1C8]/10 px-3 py-2 text-[12px] text-[#F5F1EA] placeholder:text-[#D8D1C8]/20 focus:outline-none focus:border-[#8B6B4B]/40 transition-colors"
                />
                <button
                  type="submit"
                  className="bg-[#8B6B4B] text-[#F5F1EA] px-3 py-2 hover:bg-[#7A5C3E] transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                  </svg>
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
