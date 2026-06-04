'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type Tab = 'dashboard' | 'apartments' | 'leads' | 'amenities'

interface Apartment {
  id: string
  name: string
  area: number
  bedrooms: number
  bathrooms: number
  status: string
  price: number
  view: string
  floor: number
}

interface Lead {
  id: string
  name: string
  phone: string
  email: string
  interest: string
  message: string
  source: string
  created_at: string
}

const statusColors: Record<string, string> = {
  available: 'bg-[#4B5646] text-[#F5F1EA]',
  reserved: 'bg-[#8B6B4B] text-[#F5F1EA]',
  sold: 'bg-[#D8D1C8] text-[#111111]',
}

const statusLabels: Record<string, string> = {
  available: 'Disponible',
  reserved: 'Reservado',
  sold: 'Vendido',
}

export default function AdminPanel() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loginData, setLoginData] = useState({ user: '', pass: '' })
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [apartments, setApartments] = useState<Apartment[]>([])
  const [leads, setLeads] = useState<Lead[]>([])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (loginData.user && loginData.pass) {
      setIsLoggedIn(true)
    }
  }

  useEffect(() => {
    if (isLoggedIn) {
      fetch('/api/apartments').then(r => r.json()).then(d => setApartments(d.apartments || [])).catch(() => {})
      fetch('/api/leads').then(r => r.json()).then(d => setLeads(d.leads || [])).catch(() => {})
    }
  }, [isLoggedIn])

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-8">
            <img src="/images/logo.png" alt="PRAGA" className="h-12 w-auto mx-auto brightness-0 invert opacity-70 mb-4" />
            <h1 className="font-[family-name:var(--font-cormorant)] text-2xl text-[#F5F1EA] tracking-wider">Panel Administrativo</h1>
            <p className="text-[10px] text-[#D8D1C8]/30 tracking-widest uppercase mt-2">Acceso restringido</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-[10px] tracking-[0.15em] uppercase text-[#D8D1C8]/40 block mb-2">Usuario</label>
              <input
                type="text"
                value={loginData.user}
                onChange={(e) => setLoginData({ ...loginData, user: e.target.value })}
                className="w-full bg-transparent border border-[#D8D1C8]/20 px-4 py-3 text-sm text-[#F5F1EA] focus:border-[#8B6B4B] focus:outline-none transition-colors"
                placeholder="admin"
              />
            </div>
            <div>
              <label className="text-[10px] tracking-[0.15em] uppercase text-[#D8D1C8]/40 block mb-2">Contraseña</label>
              <input
                type="password"
                value={loginData.pass}
                onChange={(e) => setLoginData({ ...loginData, pass: e.target.value })}
                className="w-full bg-transparent border border-[#D8D1C8]/20 px-4 py-3 text-sm text-[#F5F1EA] focus:border-[#8B6B4B] focus:outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>
            <button type="submit" className="w-full text-[11px] tracking-[0.2em] uppercase bg-[#8B6B4B] text-[#F5F1EA] py-3.5 hover:bg-[#7A5C3E] transition-colors">
              Iniciar Sesión
            </button>
          </form>
        </motion.div>
      </div>
    )
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'apartments', label: 'Apartamentos' },
    { id: 'leads', label: 'Leads' },
    { id: 'amenities', label: 'Amenidades' },
  ]

  const available = apartments.filter(a => a.status === 'available').length
  const reserved = apartments.filter(a => a.status === 'reserved').length
  const sold = apartments.filter(a => a.status === 'sold').length

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Top bar */}
      <div className="bg-[#111111] border-b border-[#D8D1C8]/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img src="/images/logo.png" alt="PRAGA" className="h-8 w-auto brightness-0 invert opacity-70" />
          <span className="text-[10px] tracking-[0.3em] uppercase text-[#8B6B4B]">Admin</span>
        </div>
        <button onClick={() => setIsLoggedIn(false)} className="text-[10px] tracking-wider uppercase text-[#D8D1C8]/30 hover:text-[#8B6B4B] transition-colors">
          Cerrar Sesión
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-56 bg-[#111111] border-r border-[#D8D1C8]/5 min-h-[calc(100vh-56px)] p-4">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-4 py-2.5 text-[11px] tracking-[0.1em] uppercase transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-[#8B6B4B]/10 text-[#8B6B4B] border-l-2 border-[#8B6B4B]'
                    : 'text-[#D8D1C8]/30 hover:text-[#D8D1C8]/50 border-l-2 border-transparent'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1 p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h2 className="font-[family-name:var(--font-cormorant)] text-2xl text-[#F5F1EA] mb-6">Dashboard</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  {[
                    { label: 'Total Unidades', value: apartments.length, color: 'text-[#F5F1EA]' },
                    { label: 'Disponibles', value: available, color: 'text-[#4B5646]' },
                    { label: 'Reservadas', value: reserved, color: 'text-[#8B6B4B]' },
                    { label: 'Vendidas', value: sold, color: 'text-[#D8D1C8]' },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-[#111111] border border-[#D8D1C8]/5 p-5">
                      <p className={`font-[family-name:var(--font-cormorant)] text-3xl ${stat.color}`}>{stat.value}</p>
                      <p className="text-[9px] tracking-[0.15em] uppercase text-[#D8D1C8]/30 mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#111111] border border-[#D8D1C8]/5 p-5">
                    <h3 className="text-[10px] tracking-[0.2em] uppercase text-[#8B6B4B] mb-4">Leads Recientes</h3>
                    {leads.length === 0 ? (
                      <p className="text-[11px] text-[#D8D1C8]/20">No hay leads registrados</p>
                    ) : (
                      leads.slice(-5).reverse().map((lead) => (
                        <div key={lead.id} className="border-b border-[#D8D1C8]/5 py-2 last:border-0">
                          <p className="text-[12px] text-[#F5F1EA]">{lead.name}</p>
                          <p className="text-[10px] text-[#D8D1C8]/30">{lead.email} · {lead.interest}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="bg-[#111111] border border-[#D8D1C8]/5 p-5">
                    <h3 className="text-[10px] tracking-[0.2em] uppercase text-[#8B6B4B] mb-4">Disponibilidad por Piso</h3>
                    {apartments.map((apt) => (
                      <div key={apt.id} className="flex items-center justify-between border-b border-[#D8D1C8]/5 py-2 last:border-0">
                        <span className="text-[11px] text-[#D8D1C8]/50">Piso {apt.floor} · {apt.name}</span>
                        <span className={`text-[9px] tracking-wider uppercase px-2 py-0.5 ${statusColors[apt.status]}`}>
                          {statusLabels[apt.status]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'apartments' && (
              <motion.div key="apartments" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h2 className="font-[family-name:var(--font-cormorant)] text-2xl text-[#F5F1EA] mb-6">Apartamentos</h2>
                <div className="bg-[#111111] border border-[#D8D1C8]/5 overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#D8D1C8]/10">
                        {['ID', 'Nombre', 'Área', 'Hab', 'Baños', 'Piso', 'Vista', 'Precio', 'Estado'].map((h) => (
                          <th key={h} className="text-left text-[9px] tracking-[0.15em] uppercase text-[#8B6B4B] p-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {apartments.map((apt) => (
                        <tr key={apt.id} className="border-b border-[#D8D1C8]/5 hover:bg-[#1A1A1A] transition-colors">
                          <td className="text-[11px] text-[#D8D1C8]/40 p-3">{apt.id}</td>
                          <td className="text-[11px] text-[#F5F1EA] p-3">{apt.name}</td>
                          <td className="text-[11px] text-[#D8D1C8]/60 p-3">{apt.area} m²</td>
                          <td className="text-[11px] text-[#D8D1C8]/60 p-3">{apt.bedrooms}</td>
                          <td className="text-[11px] text-[#D8D1C8]/60 p-3">{apt.bathrooms}</td>
                          <td className="text-[11px] text-[#D8D1C8]/60 p-3">{apt.floor}</td>
                          <td className="text-[11px] text-[#D8D1C8]/60 p-3">{apt.view}</td>
                          <td className="text-[11px] text-[#8B6B4B] p-3">${(apt.price / 1000000).toFixed(0)}M</td>
                          <td className="p-3">
                            <span className={`text-[8px] tracking-wider uppercase px-2 py-0.5 ${statusColors[apt.status]}`}>
                              {statusLabels[apt.status]}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'leads' && (
              <motion.div key="leads" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-[family-name:var(--font-cormorant)] text-2xl text-[#F5F1EA]">Leads</h2>
                  <span className="text-[10px] tracking-wider text-[#8B6B4B]">{leads.length} registrados</span>
                </div>
                {leads.length === 0 ? (
                  <div className="bg-[#111111] border border-[#D8D1C8]/5 p-12 text-center">
                    <p className="text-[11px] text-[#D8D1C8]/20">No hay leads registrados aún</p>
                    <p className="text-[10px] text-[#D8D1C8]/10 mt-1">Los leads del formulario aparecerán aquí</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leads.map((lead) => (
                      <div key={lead.id} className="bg-[#111111] border border-[#D8D1C8]/5 p-4 flex items-center justify-between">
                        <div>
                          <p className="text-[13px] text-[#F5F1EA]">{lead.name}</p>
                          <p className="text-[10px] text-[#D8D1C8]/40">{lead.email} · {lead.phone}</p>
                          {lead.message && <p className="text-[10px] text-[#D8D1C8]/30 mt-1">{lead.message}</p>}
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] tracking-wider uppercase text-[#8B6B4B]">{lead.interest}</span>
                          <p className="text-[9px] text-[#D8D1C8]/20 mt-1">{new Date(lead.created_at).toLocaleDateString('es')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'amenities' && (
              <motion.div key="amenities" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h2 className="font-[family-name:var(--font-cormorant)] text-2xl text-[#F5F1EA] mb-6">Amenidades</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['Coworking', 'Gimnasio', 'Salón Social', 'Ludoteca', 'Sauna', 'Baño Turco', 'Vitality Pool', 'Hidromasaje', 'Hidroterapia', 'Zona Descanso'].map((amenity) => (
                    <div key={amenity} className="bg-[#111111] border border-[#D8D1C8]/5 p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 border border-[#8B6B4B]/30 flex items-center justify-center text-[#8B6B4B] text-xs">◇</div>
                        <span className="text-[12px] text-[#F5F1EA]">{amenity}</span>
                      </div>
                      <span className="text-[9px] tracking-wider uppercase text-[#4B5646]">Activo</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
