'use client'

import React, { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useSiteConfig } from '@/hooks/useSiteConfig'

const leadSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  phone: z.string().min(1, 'El teléfono es requerido').regex(/^(\+57\s?)?3[0-9]{2}\s?[0-9]{3}\s?[0-9]{2}\s?[0-9]{2}$|^[0-9]{7,10}$/, 'Formato de teléfono colombiano inválido'),
  email: z.string().min(1, 'El email es requerido').email('Formato de email inválido'),
  interest: z.string().optional(),
  message: z.string().optional(),
})

type LeadFormData = z.infer<typeof leadSchema>

const defaultInterestOptions = [
  { value: 'Studio 33m²', label: 'Studio 33m²' },
  { value: 'Studio Plus 35m²', label: 'Studio Plus 35m²' },
  { value: 'Apartamento 2H 57m²', label: 'Apartamento 2H 57m²' },
  { value: 'Apartamento Premium 2H 74m²', label: 'Apartamento Premium 2H 74m²' },
  { value: 'Penthouse 3H 97m²', label: 'Penthouse 3H 97m²' },
  { value: 'General', label: 'General' },
]

const defaultContactMethods = [
  { label: 'Llamada', value: '+57 601 234 5678', href: 'tel:+576012345678', icon: 'phone' as const },
  { label: 'Email', value: 'info@pragaliving.com', href: 'mailto:info@pragaliving.com', icon: 'email' as const },
  { label: 'WhatsApp', value: '+57 300 123 4567', href: 'https://wa.me/573001234567?text=Hola%2C%20me%20interesa%20conocer%20m%C3%A1s%20sobre%20PRAGA%20Living', icon: 'whatsapp' as const },
]

const defaultSchedule = [
  { days: 'Lunes a Viernes', hours: '8:00 AM - 6:00 PM' },
  { days: 'Sábados', hours: '9:00 AM - 2:00 PM' },
  { days: 'Visitas Privadas', hours: 'Bajo cita' },
]

function PhoneIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
    </svg>
  )
}

function EmailIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

const iconMap: Record<string, () => React.ReactElement> = { phone: PhoneIcon, email: EmailIcon, whatsapp: WhatsAppIcon }

export default function Contacto() {
  const { config } = useSiteConfig()
  const contactoConfig = config?.contacto
  const generalConfig = config?.general

  const label = contactoConfig?.label || 'Contacto'
  const title = contactoConfig?.title || 'Agendar Visita'
  const intro = contactoConfig?.intro || 'Nuestro equipo de asesores está disponible para acompañarle en cada paso del proceso. Desde la primera consulta hasta la firma de su nueva residencia, le garantizamos una experiencia personalizada y discreta.'
  const contactMethods = contactoConfig?.methods || defaultContactMethods
  const schedule = contactoConfig?.schedule || defaultSchedule
  const interestOptionsRaw = contactoConfig?.interestOptions || defaultInterestOptions.map(o => o.value)
  const interestOptions = interestOptionsRaw.map((opt: string) => ({ value: opt, label: opt }))
  const whatsappNumber = generalConfig?.whatsapp || '+57 300 123 4567'
  const whatsappMessage = contactoConfig?.whatsappMessage || 'Hola, me interesa conocer más sobre PRAGA Living'

  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, formState: { errors }, reset } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      interest: '',
      message: '',
    },
  })

  const onSubmit = async (data: LeadFormData) => {
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          source: 'website',
        }),
      })
      const result = await res.json()
      if (result.success) {
        toast.success('Solicitud enviada', {
          description: 'Un asesor se pondrá en contacto contigo pronto.',
          duration: 5000,
          style: {
            background: '#111111',
            border: '1px solid #8B6B4B33',
            color: '#F5F1EA',
            fontSize: '13px',
          },
        })
        reset()
      } else {
        toast.error('Error al enviar', {
          description: result.error || 'Intente nuevamente.',
          style: {
            background: '#111111',
            border: '1px solid #ff444433',
            color: '#F5F1EA',
            fontSize: '13px',
          },
        })
      }
    } catch {
      toast.error('Error de conexión', {
        description: 'Verifique su conexión e intente nuevamente.',
        style: {
          background: '#111111',
          border: '1px solid #ff444433',
          color: '#F5F1EA',
          fontSize: '13px',
        },
      })
    }
    setIsSubmitting(false)
  }

  const waLink = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsappMessage)}`

  return (
    <section id="contacto" ref={ref} className="relative py-24 md:py-32 bg-[#111111]">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact methods */}
          <div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="font-[family-name:var(--font-inter)] text-sm text-[#D8D1C8]/60 leading-relaxed mb-8"
            >
              {intro}
            </motion.p>

            <div className="space-y-4 mb-10">
              {contactMethods.map((method: { label: string; value: string; href: string; icon: string }, i: number) => {
                const IconComp = iconMap[method.icon] || PhoneIcon
                return (
                  <motion.a
                    key={method.label}
                    href={method.href}
                    target={method.label === 'WhatsApp' ? '_blank' : undefined}
                    rel={method.label === 'WhatsApp' ? 'noopener noreferrer' : undefined}
                    initial={{ opacity: 0, x: -20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.8 + i * 0.1 }}
                    className="flex items-center gap-4 p-4 border border-[#D8D1C8]/10 hover:border-[#8B6B4B]/30 transition-colors duration-300 group"
                  >
                    <div className="text-[#8B6B4B] group-hover:text-[#C4A265] transition-colors">
                      <IconComp />
                    </div>
                    <div>
                      <p className="text-[10px] tracking-[0.15em] uppercase text-[#D8D1C8]/40">{method.label}</p>
                      <p className="font-[family-name:var(--font-cormorant)] text-lg text-[#F5F1EA] group-hover:text-[#8B6B4B] transition-colors">
                        {method.value}
                      </p>
                    </div>
                  </motion.a>
                )
              })}
            </div>

            {/* WhatsApp CTA */}
            <motion.a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 1.1 }}
              className="flex items-center justify-center gap-3 w-full py-4 bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/20 transition-colors duration-300 mb-10"
            >
              <WhatsAppIcon />
              <span className="text-[11px] tracking-[0.2em] uppercase">Contactar por WhatsApp</span>
            </motion.a>

            {/* Schedule */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 1.2 }}
              className="p-6 border border-[#8B6B4B]/20"
            >
              <p className="text-[10px] tracking-[0.3em] uppercase text-[#8B6B4B] mb-3">Horario de Atención</p>
              <div className="space-y-2">
                {schedule.map((item: { days: string; hours: string }, i: number) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-[11px] text-[#D8D1C8]/50">{item.days}</span>
                    <span className={`text-[11px] ${item.hours === 'Bajo cita' ? 'text-[#8B6B4B]' : 'text-[#F5F1EA]'}`}>{item.hours}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              <div>
                <label className="text-[10px] tracking-[0.15em] uppercase text-[#D8D1C8]/40 block mb-2">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  {...register('name')}
                  className={`w-full bg-transparent border px-4 py-3 text-sm text-[#F5F1EA] font-[family-name:var(--font-inter)] focus:outline-none transition-colors placeholder:text-[#D8D1C8]/20 ${errors.name ? 'border-red-400/50 focus:border-red-400' : 'border-[#D8D1C8]/20 focus:border-[#8B6B4B]'}`}
                  placeholder="Ingrese su nombre"
                />
                {errors.name && <p className="text-[10px] text-red-400/70 mt-1">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-[10px] tracking-[0.15em] uppercase text-[#D8D1C8]/40 block mb-2">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    {...register('phone')}
                    className={`w-full bg-transparent border px-4 py-3 text-sm text-[#F5F1EA] font-[family-name:var(--font-inter)] focus:outline-none transition-colors placeholder:text-[#D8D1C8]/20 ${errors.phone ? 'border-red-400/50 focus:border-red-400' : 'border-[#D8D1C8]/20 focus:border-[#8B6B4B]'}`}
                    placeholder="+57 300 000 0000"
                  />
                  {errors.phone && <p className="text-[10px] text-red-400/70 mt-1">{errors.phone.message}</p>}
                </div>
                <div>
                  <label className="text-[10px] tracking-[0.15em] uppercase text-[#D8D1C8]/40 block mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    {...register('email')}
                    className={`w-full bg-transparent border px-4 py-3 text-sm text-[#F5F1EA] font-[family-name:var(--font-inter)] focus:outline-none transition-colors placeholder:text-[#D8D1C8]/20 ${errors.email ? 'border-red-400/50 focus:border-red-400' : 'border-[#D8D1C8]/20 focus:border-[#8B6B4B]'}`}
                    placeholder="correo@ejemplo.com"
                  />
                  {errors.email && <p className="text-[10px] text-red-400/70 mt-1">{errors.email.message}</p>}
                </div>
              </div>

              <div>
                <label className="text-[10px] tracking-[0.15em] uppercase text-[#D8D1C8]/40 block mb-2">
                  Interés
                </label>
                <select
                  {...register('interest')}
                  className="w-full bg-transparent border border-[#D8D1C8]/20 px-4 py-3 text-sm text-[#F5F1EA] font-[family-name:var(--font-inter)] focus:border-[#8B6B4B] focus:outline-none transition-colors appearance-none"
                >
                  <option value="" className="bg-[#111111]">Seleccione una opción</option>
                  {interestOptions.map((opt: { value: string; label: string }) => (
                    <option key={opt.value} value={opt.value} className="bg-[#111111]">{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] tracking-[0.15em] uppercase text-[#D8D1C8]/40 block mb-2">
                  Mensaje
                </label>
                <textarea
                  {...register('message')}
                  rows={4}
                  className="w-full bg-transparent border border-[#D8D1C8]/20 px-4 py-3 text-sm text-[#F5F1EA] font-[family-name:var(--font-inter)] focus:border-[#8B6B4B] focus:outline-none transition-colors placeholder:text-[#D8D1C8]/20 resize-none"
                  placeholder="Cuéntenos sobre sus necesidades..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full text-[11px] tracking-[0.2em] uppercase bg-[#8B6B4B] text-[#F5F1EA] py-4 hover:bg-[#7A5C3E] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
              </button>

              <p className="text-[9px] text-[#D8D1C8]/20 text-center">
                Al enviar este formulario, acepta nuestra política de privacidad y tratamiento de datos personales.
              </p>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
