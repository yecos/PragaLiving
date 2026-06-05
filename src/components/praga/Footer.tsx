'use client'

import { motion } from 'framer-motion'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const footerLinks = [
    {
      title: 'Proyecto',
      links: [
        { label: 'Arquitectura', href: '#arquitectura' },
        { label: 'Amenidades', href: '#amenidades' },
        { label: 'Tipologías', href: '#tipologias' },
        { label: 'Planta Interactiva', href: '#planta' },
      ],
    },
    {
      title: 'Explorar',
      links: [
        { label: 'Recorridos 360°', href: '#recorridos' },
        { label: 'Galería', href: '#galeria' },
        { label: 'Ubicación', href: '#ubicacion' },
        { label: 'Inversión', href: '#inversion' },
      ],
    },
    {
      title: 'Contacto',
      links: [
        { label: 'Agendar Visita', href: '#contacto' },
        { label: 'WhatsApp', href: 'https://wa.me/573001234567' },
        { label: 'Llamada', href: 'tel:+576012345678' },
        { label: 'Email', href: 'mailto:info@pragaliving.com' },
      ],
    },
  ]

  return (
    <footer className="bg-[#0A0A0A] pt-20 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Top section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="mb-6">
              <img
                src="/images/logo.png"
                alt="PRAGA Living"
                className="h-12 w-auto brightness-0 invert opacity-80"
              />
            </div>
            <p className="font-[family-name:var(--font-inter)] text-xs text-[#D8D1C8]/30 leading-relaxed mb-6">
              Arquitectura para quienes valoran lo excepcional. Una pieza arquitectónica diseñada para permanecer.
            </p>
            <div className="w-[60px] h-[1px] bg-[#8B6B4B]/30" />
          </div>

          {/* Links */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h4 className="text-[10px] tracking-[0.3em] uppercase text-[#8B6B4B] mb-6">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="font-[family-name:var(--font-inter)] text-xs text-[#D8D1C8]/40 hover:text-[#8B6B4B] transition-colors duration-300"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="h-[1px] bg-[#D8D1C8]/5 mb-8" />

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[10px] text-[#D8D1C8]/20 tracking-wider">
            © {currentYear} PRAGA Living. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-[10px] text-[#D8D1C8]/20 hover:text-[#8B6B4B] transition-colors tracking-wider">
              Política de Privacidad
            </a>
            <a href="#" className="text-[10px] text-[#D8D1C8]/20 hover:text-[#8B6B4B] transition-colors tracking-wider">
              Términos de Uso
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
