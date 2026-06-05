'use client'

import { useState, useCallback, useRef } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RTooltip } from 'recharts'
import { Download, Upload, Copy, Check, ImageIcon, ExternalLink, FileText, Plus, X } from 'lucide-react'
import FloorPlanEditor from './FloorPlanEditor'
import SiteConfigEditor from './SiteConfigEditor'

type Tab = 'dashboard' | 'apartments' | 'leads' | 'amenities' | 'plantas' | 'contenido' | 'ubicacion' | 'configuracion' | 'medios' | 'cotizaciones'

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
  typology: string
  features?: string | null
}

interface Lead {
  id: string
  name: string
  phone: string
  email: string
  interest: string | null
  message: string | null
  source: string
  status: string
  notes: string | null
  createdAt: string
}

interface Amenity {
  id: string
  name: string
  description: string
  icon: string | null
  category: string
  active: boolean
  order: number
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

const leadStatusColors: Record<string, string> = {
  new: 'bg-[#4B5646] text-[#F5F1EA]',
  contacted: 'bg-[#8B6B4B] text-[#F5F1EA]',
  qualified: 'bg-[#6B8B4B] text-[#F5F1EA]',
  lost: 'bg-[#D8D1C8]/30 text-[#D8D1C8]/60',
}

const leadStatusLabels: Record<string, string> = {
  new: 'Nuevo',
  contacted: 'Contactado',
  qualified: 'Calificado',
  lost: 'Perdido',
}

const categoryLabels: Record<string, string> = {
  wellness: 'Bienestar',
  social: 'Social',
  work: 'Trabajo',
  leisure: 'Recreación',
}

interface Quote {
  id: string
  number: string
  leadId: string
  apartmentId: string
  discount: number
  finalPrice: number
  paymentPlan: string
  notes: string
  validDays: number
  validUntil: string
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
  createdAt: string
  updatedAt: string
  leadName?: string
  leadEmail?: string
  leadPhone?: string
  apartmentName?: string
  apartmentArea?: number
  apartmentTypology?: string
  apartmentPrice?: number
}

const quoteStatusColors: Record<string, string> = {
  draft: 'bg-[#D8D1C8]/30 text-[#D8D1C8]/60',
  sent: 'bg-[#8B6B4B] text-[#F5F1EA]',
  accepted: 'bg-[#4B5646] text-[#F5F1EA]',
  rejected: 'bg-red-900/60 text-red-200',
  expired: 'bg-[#D8D1C8]/20 text-[#D8D1C8]/40',
}

const quoteStatusLabels: Record<string, string> = {
  draft: 'Borrador',
  sent: 'Enviada',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
  expired: 'Expirada',
}

const PIE_COLORS = ['#4B5646', '#8B6B4B', '#D8D1C8']

export default function AdminPanel() {
  const { data: session, status } = useSession()
  const [loginData, setLoginData] = useState({ user: '', pass: '' })
  const [loginError, setLoginError] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')

  const handleTabSwitch = (tab: Tab) => {
    setActiveTab(tab)
    if (tab === 'medios') {
      void fetchMedia()
    }
    if (tab === 'cotizaciones') {
      void fetchQuotes()
    }
  }
  const [apartments, setApartments] = useState<Apartment[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [amenities, setAmenities] = useState<Amenity[]>([])
  const [loading, setLoading] = useState(false)

  // Apartment filters
  const [aptSearch, setAptSearch] = useState('')
  const [aptStatusFilter, setAptStatusFilter] = useState('')
  const [aptTypologyFilter, setAptTypologyFilter] = useState('')
  const [editingAptId, setEditingAptId] = useState<string | null>(null)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  // Lead states
  const [expandedLead, setExpandedLead] = useState<string | null>(null)
  const [leadNotes, setLeadNotes] = useState('')
  const [leadStatusFilter, setLeadStatusFilter] = useState('')

  // Amenity editing
  const [editingAmenity, setEditingAmenity] = useState<string | null>(null)
  const [amenityEditData, setAmenityEditData] = useState<{ name: string; description: string; category: string }>({ name: '', description: '', category: '' })

  // Media library
  const [mediaData, setMediaData] = useState<Record<string, Array<{ name: string; url: string; size: number }>>>({})
  const [mediaCategory, setMediaCategory] = useState<string>('all')
  const [mediaLoading, setMediaLoading] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [uploadCategory, setUploadCategory] = useState<string>('general')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Quotes
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [showNewQuote, setShowNewQuote] = useState(false)
  const [newQuoteData, setNewQuoteData] = useState({
    leadId: '',
    apartmentId: '',
    discount: 0,
    paymentPlan: 'Contado',
    notes: '',
    validDays: 30,
  })
  const [creatingQuote, setCreatingQuote] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [aptRes, leadRes, amenRes] = await Promise.all([
        fetch('/api/apartments'),
        fetch('/api/leads'),
        fetch('/api/amenities'),
      ])
      const aptData = await aptRes.json()
      const leadData = await leadRes.json()
      const amenData = await amenRes.json()
      setApartments(aptData.apartments || [])
      setLeads(leadData.leads || [])
      setAmenities(amenData.amenities || [])
    } catch {
      // silently fail
    }
    setLoading(false)
  }, [])

  const fetchMedia = useCallback(async () => {
    setMediaLoading(true)
    try {
      const res = await fetch('/api/media')
      const data = await res.json()
      setMediaData(data)
    } catch {
      // silently fail
    }
    setMediaLoading(false)
  }, [])

  const fetchQuotes = useCallback(async () => {
    try {
      const res = await fetch('/api/quotes')
      const data = await res.json()
      setQuotes(data.quotes || [])
    } catch {
      // silently fail
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    try {
      const result = await signIn('credentials', {
        username: loginData.user,
        password: loginData.pass,
        redirect: false,
      })
      if (result?.error) {
        setLoginError('Credenciales inválidas')
      } else if (result?.ok) {
        void fetchData()
      }
    } catch {
      setLoginError('Error de conexión')
    }
  }

  // Apartments: inline edit handlers
  const startEdit = (aptId: string, field: string, value: string) => {
    setEditingAptId(aptId)
    setEditingField(field)
    setEditValue(value)
  }

  const saveEdit = async () => {
    if (!editingAptId || !editingField) return
    try {
      const body: Record<string, unknown> = { id: editingAptId }
      if (editingField === 'status') body.status = editValue
      if (editingField === 'price') body.price = editValue
      await fetch('/api/apartments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      setApartments(prev => prev.map(a => {
        if (a.id !== editingAptId) return a
        if (editingField === 'status') return { ...a, status: editValue }
        if (editingField === 'price') return { ...a, price: parseFloat(editValue) }
        return a
      }))
    } catch {
      // silently fail
    }
    setEditingAptId(null)
    setEditingField(null)
    setEditValue('')
  }

  const updateLeadStatus = async (leadId: string, status: string) => {
    try {
      await fetch('/api/leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leadId, status }),
      })
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status } : l))
    } catch {
      // silently fail
    }
  }

  const saveLeadNotes = async (leadId: string) => {
    try {
      await fetch('/api/leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leadId, notes: leadNotes }),
      })
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, notes: leadNotes } : l))
    } catch {
      // silently fail
    }
  }

  const toggleAmenity = async (amenityId: string, active: boolean) => {
    try {
      await fetch('/api/amenities', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: amenityId, active }),
      })
      setAmenities(prev => prev.map(a => a.id === amenityId ? { ...a, active } : a))
    } catch {
      // silently fail
    }
  }

  const saveAmenity = async (amenityId: string) => {
    try {
      await fetch('/api/amenities', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: amenityId, ...amenityEditData }),
      })
      setAmenities(prev => prev.map(a => a.id === amenityId ? { ...a, ...amenityEditData } : a))
      setEditingAmenity(null)
    } catch {
      // silently fail
    }
  }

  const exportLeadsCSV = () => {
    const header = 'Nombre,Teléfono,Email,Interés,Estado,Fecha,Notas\n'
    const rows = filteredLeads.map(l =>
      `"${l.name}","${l.phone}","${l.email}","${l.interest || ''}","${leadStatusLabels[l.status] || l.status}","${new Date(l.createdAt).toLocaleDateString('es-CO')}","${(l.notes || '').replace(/"/g, '""')}"`
    ).join('\n')
    const csv = header + rows
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leads-praga-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Computed values
  const available = apartments.filter(a => a.status === 'available').length
  const reserved = apartments.filter(a => a.status === 'reserved').length
  const sold = apartments.filter(a => a.status === 'sold').length
  const soldPct = apartments.length > 0 ? ((sold / apartments.length) * 100).toFixed(1) : '0'

  const pieData = [
    { name: 'Disponibles', value: available },
    { name: 'Reservadas', value: reserved },
    { name: 'Vendidas', value: sold },
  ].filter(d => d.value > 0)

  // Filtered apartments
  const filteredApartments = apartments.filter(a => {
    if (aptSearch) {
      const s = aptSearch.toLowerCase()
      if (!a.name.toLowerCase().includes(s) && !a.floor.toString().includes(s) && !a.typology.toLowerCase().includes(s)) return false
    }
    if (aptStatusFilter && a.status !== aptStatusFilter) return false
    if (aptTypologyFilter && a.typology !== aptTypologyFilter) return false
    return true
  })

  // Filtered leads
  const filteredLeads = leads.filter(l => {
    if (leadStatusFilter && l.status !== leadStatusFilter) return false
    return true
  })

  // Availability by floor
  const floorAvailability = apartments.reduce((acc, a) => {
    const key = `Piso ${a.floor}`
    if (!acc[key]) acc[key] = { total: 0, available: 0, reserved: 0, sold: 0 }
    acc[key].total++
    if (a.status === 'available') acc[key].available++
    if (a.status === 'reserved') acc[key].reserved++
    if (a.status === 'sold') acc[key].sold++
    return acc
  }, {} as Record<string, { total: number; available: number; reserved: number; sold: number }>)

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center p-6">
        <div className="w-8 h-8 border-2 border-[#8B6B4B] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Login screen
  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <div className="text-center mb-8">
            <img src="/images/logo.png" alt="PRAGA" className="h-12 w-auto mx-auto brightness-0 invert opacity-70 mb-4" />
            <h1 className="font-[family-name:var(--font-cormorant)] text-2xl text-[#F5F1EA] tracking-wider">Panel Administrativo</h1>
            <p className="text-[10px] text-[#D8D1C8]/30 tracking-widest uppercase mt-2">Acceso restringido</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-[10px] tracking-[0.15em] uppercase text-[#D8D1C8]/40 block mb-2">Usuario</label>
              <input type="text" value={loginData.user} onChange={(e) => setLoginData({ ...loginData, user: e.target.value })} className="w-full bg-transparent border border-[#D8D1C8]/20 px-4 py-3 text-sm text-[#F5F1EA] focus:border-[#8B6B4B] focus:outline-none transition-colors" placeholder="admin" />
            </div>
            <div>
              <label className="text-[10px] tracking-[0.15em] uppercase text-[#D8D1C8]/40 block mb-2">Contraseña</label>
              <input type="password" value={loginData.pass} onChange={(e) => setLoginData({ ...loginData, pass: e.target.value })} className="w-full bg-transparent border border-[#D8D1C8]/20 px-4 py-3 text-sm text-[#F5F1EA] focus:border-[#8B6B4B] focus:outline-none transition-colors" placeholder="••••••••" />
            </div>
            {loginError && <p className="text-[10px] text-red-400">{loginError}</p>}
            <button type="submit" className="w-full text-[11px] tracking-[0.2em] uppercase bg-[#8B6B4B] text-[#F5F1EA] py-3.5 hover:bg-[#7A5C3E] transition-colors">Iniciar Sesión</button>
          </form>
        </motion.div>
      </div>
    )
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'apartments', label: 'Apartamentos' },
    { id: 'plantas', label: 'Plantas' },
    { id: 'leads', label: 'Leads' },
    { id: 'amenities', label: 'Amenidades' },
    { id: 'contenido', label: 'Contenido' },
    { id: 'ubicacion', label: 'Ubicación' },
    { id: 'configuracion', label: 'Configuración' },
    { id: 'medios', label: 'Medios' },
    { id: 'cotizaciones', label: 'Cotizaciones' },
  ]

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Top bar */}
      <div className="bg-[#111111] border-b border-[#D8D1C8]/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img src="/images/logo.png" alt="PRAGA" className="h-8 w-auto brightness-0 invert opacity-70" />
          <span className="text-[10px] tracking-[0.3em] uppercase text-[#8B6B4B]">Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[10px] tracking-wider uppercase text-[#D8D1C8]/30 hover:text-[#8B6B4B] transition-colors">
            <ExternalLink className="w-3 h-3" />
            Abrir Sitio
          </a>
          <button onClick={() => void fetchData()} className="text-[10px] tracking-wider uppercase text-[#D8D1C8]/30 hover:text-[#8B6B4B] transition-colors">
            Actualizar
          </button>
          <button onClick={() => void signOut()} className="text-[10px] tracking-wider uppercase text-[#D8D1C8]/30 hover:text-[#8B6B4B] transition-colors">
            Cerrar Sesión
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-56 bg-[#111111] border-r border-[#D8D1C8]/5 min-h-[calc(100vh-56px)] p-4 hidden md:block">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => handleTabSwitch(tab.id)} className={`w-full text-left px-4 py-2.5 text-[11px] tracking-[0.1em] uppercase transition-all duration-300 ${activeTab === tab.id ? 'bg-[#8B6B4B]/10 text-[#8B6B4B] border-l-2 border-[#8B6B4B]' : 'text-[#D8D1C8]/30 hover:text-[#D8D1C8]/50 border-l-2 border-transparent'}`}>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Mobile tabs */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#111111] border-t border-[#D8D1C8]/5 z-50 flex">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => handleTabSwitch(tab.id)} className={`flex-1 py-3 text-[9px] tracking-wider uppercase ${activeTab === tab.id ? 'text-[#8B6B4B]' : 'text-[#D8D1C8]/30'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 p-4 md:p-6 pb-20 md:pb-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-[#8B6B4B] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {/* ═══ DASHBOARD ═══ */}
              {activeTab === 'dashboard' && (
                <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <h2 className="font-[family-name:var(--font-cormorant)] text-2xl text-[#F5F1EA] mb-6">Dashboard</h2>

                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                    {[
                      { label: 'Total Unidades', value: apartments.length, color: 'text-[#F5F1EA]' },
                      { label: 'Disponibles', value: available, color: 'text-[#4B5646]' },
                      { label: 'Reservadas', value: reserved, color: 'text-[#8B6B4B]' },
                      { label: 'Vendidas', value: sold, color: 'text-[#D8D1C8]' },
                      { label: '% Vendido', value: `${soldPct}%`, color: 'text-[#8B6B4B]' },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-[#111111] border border-[#D8D1C8]/5 p-5">
                        <p className={`font-[family-name:var(--font-cormorant)] text-3xl ${stat.color}`}>{stat.value}</p>
                        <p className="text-[9px] tracking-[0.15em] uppercase text-[#D8D1C8]/30 mt-1">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Pie Chart */}
                    <div className="bg-[#111111] border border-[#D8D1C8]/5 p-5">
                      <h3 className="text-[10px] tracking-[0.2em] uppercase text-[#8B6B4B] mb-4">Distribución por Estado</h3>
                      <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                              {pieData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <RTooltip contentStyle={{ background: '#111111', border: '1px solid #8B6B4B33', borderRadius: 0, fontSize: '11px', color: '#F5F1EA' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex justify-center gap-4 mt-2">
                        {pieData.map((d, i) => (
                          <div key={d.name} className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5" style={{ backgroundColor: PIE_COLORS[i] }} />
                            <span className="text-[9px] text-[#D8D1C8]/50">{d.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Availability by Floor */}
                    <div className="bg-[#111111] border border-[#D8D1C8]/5 p-5">
                      <h3 className="text-[10px] tracking-[0.2em] uppercase text-[#8B6B4B] mb-4">Disponibilidad por Piso</h3>
                      <div className="max-h-52 overflow-y-auto custom-scrollbar space-y-2">
                        {Object.entries(floorAvailability).sort((a, b) => {
                          const fa = parseInt(a[0].replace('Piso ', ''))
                          const fb = parseInt(b[0].replace('Piso ', ''))
                          return fa - fb
                        }).map(([floor, data]) => (
                          <div key={floor} className="flex items-center gap-3">
                            <span className="text-[10px] text-[#D8D1C8]/40 w-14 font-[family-name:var(--font-inter)]">{floor}</span>
                            <div className="flex-1 h-4 bg-[#1A1A1A] flex overflow-hidden">
                              {data.available > 0 && <div className="bg-[#4B5646]/70 h-full" style={{ width: `${(data.available / data.total) * 100}%` }} />}
                              {data.reserved > 0 && <div className="bg-[#8B6B4B]/70 h-full" style={{ width: `${(data.reserved / data.total) * 100}%` }} />}
                              {data.sold > 0 && <div className="bg-[#D8D1C8]/30 h-full" style={{ width: `${(data.sold / data.total) * 100}%` }} />}
                            </div>
                            <span className="text-[9px] text-[#D8D1C8]/30 w-16 text-right">{data.available}/{data.total} disp.</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recent Leads */}
                    <div className="bg-[#111111] border border-[#D8D1C8]/5 p-5 md:col-span-2">
                      <h3 className="text-[10px] tracking-[0.2em] uppercase text-[#8B6B4B] mb-4">Leads Recientes</h3>
                      {leads.length === 0 ? (
                        <p className="text-[11px] text-[#D8D1C8]/20">No hay leads registrados</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {leads.slice(0, 6).map((lead) => (
                            <div key={lead.id} className="border border-[#D8D1C8]/5 p-3">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-[12px] text-[#F5F1EA]">{lead.name}</p>
                                <span className={`text-[8px] tracking-wider uppercase px-1.5 py-0.5 ${leadStatusColors[lead.status] || 'bg-[#D8D1C8]/20 text-[#D8D1C8]/50'}`}>
                                  {leadStatusLabels[lead.status] || lead.status}
                                </span>
                              </div>
                              <p className="text-[10px] text-[#D8D1C8]/30">{lead.email} · {lead.phone}</p>
                              {lead.interest && <p className="text-[9px] text-[#8B6B4B]/60 mt-1">{lead.interest}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ═══ APARTMENTS ═══ */}
              {activeTab === 'apartments' && (
                <motion.div key="apartments" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                    <h2 className="font-[family-name:var(--font-cormorant)] text-2xl text-[#F5F1EA]">Apartamentos</h2>
                    <div className="flex flex-wrap gap-3 items-center">
                      <input type="text" placeholder="Buscar nombre/piso..." value={aptSearch} onChange={e => setAptSearch(e.target.value)} className="bg-[#111111] border border-[#D8D1C8]/15 px-3 py-1.5 text-[11px] text-[#F5F1EA] w-40 focus:border-[#8B6B4B] focus:outline-none" />
                      <select value={aptStatusFilter} onChange={e => setAptStatusFilter(e.target.value)} className="bg-[#111111] border border-[#D8D1C8]/15 px-3 py-1.5 text-[11px] text-[#F5F1EA] focus:border-[#8B6B4B] focus:outline-none appearance-none">
                        <option value="" className="bg-[#111111]">Todos los estados</option>
                        <option value="available" className="bg-[#111111]">Disponible</option>
                        <option value="reserved" className="bg-[#111111]">Reservado</option>
                        <option value="sold" className="bg-[#111111]">Vendido</option>
                      </select>
                      <select value={aptTypologyFilter} onChange={e => setAptTypologyFilter(e.target.value)} className="bg-[#111111] border border-[#D8D1C8]/15 px-3 py-1.5 text-[11px] text-[#F5F1EA] focus:border-[#8B6B4B] focus:outline-none appearance-none">
                        <option value="" className="bg-[#111111]">Todas las tipologías</option>
                        <option value="Studio" className="bg-[#111111]">Studio</option>
                        <option value="Studio Plus" className="bg-[#111111]">Studio Plus</option>
                        <option value="Apartamento 2H" className="bg-[#111111]">Apartamento 2H</option>
                        <option value="Apartamento Premium 2H" className="bg-[#111111]">Apartamento Premium 2H</option>
                        <option value="Penthouse 3H" className="bg-[#111111]">Penthouse 3H</option>
                      </select>
                      <span className="text-[10px] text-[#D8D1C8]/30">{filteredApartments.length} unidades</span>
                    </div>
                  </div>

                  <div className="bg-[#111111] border border-[#D8D1C8]/5 overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#D8D1C8]/10">
                          {['Nombre', 'Área', 'Hab', 'Baños', 'Piso', 'Vista', 'Tipología', 'Precio', 'Estado'].map((h) => (
                            <th key={h} className="text-left text-[9px] tracking-[0.15em] uppercase text-[#8B6B4B] p-3 whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredApartments.map((apt) => (
                          <tr key={apt.id} className="border-b border-[#D8D1C8]/5 hover:bg-[#1A1A1A] transition-colors">
                            <td className="text-[11px] text-[#F5F1EA] p-3 whitespace-nowrap">{apt.name}</td>
                            <td className="text-[11px] text-[#D8D1C8]/60 p-3">{apt.area} m²</td>
                            <td className="text-[11px] text-[#D8D1C8]/60 p-3">{apt.bedrooms}</td>
                            <td className="text-[11px] text-[#D8D1C8]/60 p-3">{apt.bathrooms}</td>
                            <td className="text-[11px] text-[#D8D1C8]/60 p-3">{apt.floor}</td>
                            <td className="text-[11px] text-[#D8D1C8]/60 p-3">{apt.view}</td>
                            <td className="text-[11px] text-[#D8D1C8]/60 p-3">{apt.typology}</td>
                            <td className="p-3">
                              {editingAptId === apt.id && editingField === 'price' ? (
                                <input type="number" value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={() => void saveEdit()} onKeyDown={e => e.key === 'Enter' && void saveEdit()} className="bg-[#0A0A0A] border border-[#8B6B4B] px-2 py-1 text-[11px] text-[#8B6B4B] w-28 focus:outline-none" autoFocus />
                              ) : (
                                <span className="text-[11px] text-[#8B6B4B] cursor-pointer hover:underline" onClick={() => startEdit(apt.id, 'price', apt.price.toString())}>
                                  ${(apt.price / 1000000).toFixed(0)}M
                                </span>
                              )}
                            </td>
                            <td className="p-3">
                              {editingAptId === apt.id && editingField === 'status' ? (
                                <select value={editValue} onChange={e => { setEditValue(e.target.value); setTimeout(() => void saveEdit(), 50) }} className="bg-[#0A0A0A] border border-[#8B6B4B] px-1 py-0.5 text-[9px] text-[#F5F1EA] focus:outline-none" autoFocus>
                                  <option value="available" className="bg-[#111111]">Disponible</option>
                                  <option value="reserved" className="bg-[#111111]">Reservado</option>
                                  <option value="sold" className="bg-[#111111]">Vendido</option>
                                </select>
                              ) : (
                                <span className={`text-[8px] tracking-wider uppercase px-2 py-0.5 cursor-pointer ${statusColors[apt.status]}`} onClick={() => startEdit(apt.id, 'status', apt.status)}>
                                  {statusLabels[apt.status]}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {/* ═══ LEADS ═══ */}
              {activeTab === 'leads' && (
                <motion.div key="leads" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                    <h2 className="font-[family-name:var(--font-cormorant)] text-2xl text-[#F5F1EA]">Leads</h2>
                    <div className="flex items-center gap-3">
                      <select value={leadStatusFilter} onChange={e => setLeadStatusFilter(e.target.value)} className="bg-[#111111] border border-[#D8D1C8]/15 px-3 py-1.5 text-[11px] text-[#F5F1EA] focus:border-[#8B6B4B] focus:outline-none appearance-none">
                        <option value="" className="bg-[#111111]">Todos</option>
                        <option value="new" className="bg-[#111111]">Nuevo</option>
                        <option value="contacted" className="bg-[#111111]">Contactado</option>
                        <option value="qualified" className="bg-[#111111]">Calificado</option>
                        <option value="lost" className="bg-[#111111]">Perdido</option>
                      </select>
                      <button onClick={exportLeadsCSV} className="flex items-center gap-1.5 text-[10px] tracking-wider uppercase border border-[#8B6B4B]/30 text-[#8B6B4B] px-3 py-1.5 hover:bg-[#8B6B4B]/10 transition-colors">
                        <Download className="w-3 h-3" /> CSV
                      </button>
                      <span className="text-[10px] text-[#D8D1C8]/30">{filteredLeads.length} leads</span>
                    </div>
                  </div>

                  {/* Status Pipeline */}
                  <div className="flex gap-2 mb-6 flex-wrap">
                    {['new', 'contacted', 'qualified', 'lost'].map((s, i) => {
                      const count = leads.filter(l => l.status === s).length
                      return (
                        <div key={s} className="flex items-center gap-1.5">
                          {i > 0 && <span className="text-[#D8D1C8]/20 text-[10px]">→</span>}
                          <span className={`text-[9px] tracking-wider uppercase px-2 py-1 ${leadStatusColors[s]}`}>
                            {leadStatusLabels[s]} ({count})
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  {filteredLeads.length === 0 ? (
                    <div className="bg-[#111111] border border-[#D8D1C8]/5 p-12 text-center">
                      <p className="text-[11px] text-[#D8D1C8]/20">No hay leads registrados aún</p>
                      <p className="text-[10px] text-[#D8D1C8]/10 mt-1">Los leads del formulario aparecerán aquí</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredLeads.map((lead) => (
                        <motion.div key={lead.id} layout className="bg-[#111111] border border-[#D8D1C8]/5 p-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-[13px] text-[#F5F1EA] font-medium">{lead.name}</p>
                            <select value={lead.status} onChange={e => void updateLeadStatus(lead.id, e.target.value)} className="bg-transparent text-[9px] tracking-wider uppercase border-none focus:outline-none cursor-pointer" style={{ color: lead.status === 'new' ? '#4B5646' : lead.status === 'contacted' ? '#8B6B4B' : lead.status === 'qualified' ? '#6B8B4B' : '#D8D1C8' }}>
                              <option value="new" className="bg-[#111111]">Nuevo</option>
                              <option value="contacted" className="bg-[#111111]">Contactado</option>
                              <option value="qualified" className="bg-[#111111]">Calificado</option>
                              <option value="lost" className="bg-[#111111]">Perdido</option>
                            </select>
                          </div>
                          <p className="text-[10px] text-[#D8D1C8]/40">{lead.email} · {lead.phone}</p>
                          {lead.interest && <p className="text-[10px] text-[#8B6B4B]/70 mt-1">Interés: {lead.interest}</p>}
                          {lead.message && <p className="text-[10px] text-[#D8D1C8]/25 mt-1 line-clamp-2">{lead.message}</p>}
                          <p className="text-[9px] text-[#D8D1C8]/20 mt-2">{new Date(lead.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}</p>

                          <button onClick={() => { setExpandedLead(expandedLead === lead.id ? null : lead.id); setLeadNotes(lead.notes || '') }} className="text-[9px] tracking-wider uppercase text-[#8B6B4B]/50 hover:text-[#8B6B4B] transition-colors mt-2">
                            {expandedLead === lead.id ? 'Cerrar' : 'Notas'}
                          </button>

                          <AnimatePresence>
                            {expandedLead === lead.id && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                <textarea value={leadNotes} onChange={e => setLeadNotes(e.target.value)} className="w-full mt-2 bg-[#0A0A0A] border border-[#D8D1C8]/10 px-3 py-2 text-[10px] text-[#F5F1EA] resize-none h-16 focus:border-[#8B6B4B] focus:outline-none" placeholder="Agregar notas..." />
                                <button onClick={() => void saveLeadNotes(lead.id)} className="text-[9px] tracking-wider uppercase text-[#8B6B4B] hover:text-[#C4A265] transition-colors mt-1">Guardar</button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ═══ PLANTAS ═══ */}
              {activeTab === 'plantas' && (
                <motion.div key="plantas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <FloorPlanEditor />
                </motion.div>
              )}

              {/* ═══ CONTENIDO ═══ */}
              {activeTab === 'contenido' && (
                <motion.div key="contenido" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <SiteConfigEditor mode="contenido" />
                </motion.div>
              )}

              {/* ═══ UBICACION ═══ */}
              {activeTab === 'ubicacion' && (
                <motion.div key="ubicacion" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <SiteConfigEditor mode="ubicacion" />
                </motion.div>
              )}

              {/* ═══ CONFIGURACION ═══ */}
              {activeTab === 'configuracion' && (
                <motion.div key="configuracion" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <SiteConfigEditor mode="configuracion" />
                </motion.div>
              )}

              {/* ═══ MEDIOS ═══ */}
              {activeTab === 'medios' && (
                <motion.div key="medios" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                    <h2 className="font-[family-name:var(--font-cormorant)] text-2xl text-[#F5F1EA]">Medios</h2>
                    <div className="flex items-center gap-3">
                      <select
                        value={uploadCategory}
                        onChange={e => setUploadCategory(e.target.value)}
                        className="bg-[#111111] border border-[#D8D1C8]/15 px-3 py-1.5 text-[11px] text-[#F5F1EA] focus:border-[#8B6B4B] focus:outline-none appearance-none"
                      >
                        <option value="renders" className="bg-[#111111]">Renders</option>
                        <option value="planos" className="bg-[#111111]">Planos</option>
                        <option value="galeria" className="bg-[#111111]">Galería</option>
                        <option value="general" className="bg-[#111111]">General</option>
                        <option value="logos" className="bg-[#111111]">Logos</option>
                      </select>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingFile}
                        className="flex items-center gap-1.5 text-[10px] tracking-wider uppercase bg-[#8B6B4B] text-[#F5F1EA] px-4 py-2 hover:bg-[#7A5C3E] transition-colors disabled:opacity-50"
                      >
                        {uploadingFile ? (
                          <div className="w-3 h-3 border border-[#F5F1EA] border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Upload className="w-3 h-3" />
                        )}
                        Subir
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          const handleUpload = async () => {
                            setUploadingFile(true)
                            try {
                              const formData = new FormData()
                              formData.append('file', file)
                              formData.append('category', uploadCategory)
                              const res = await fetch('/api/upload', { method: 'POST', body: formData })
                              if (res.ok) {
                                void fetchMedia()
                              }
                            } catch {
                              // silently fail
                            }
                            setUploadingFile(false)
                            if (fileInputRef.current) fileInputRef.current.value = ''
                          }
                          void handleUpload()
                        }}
                      />
                    </div>
                  </div>

                  {/* Category filter tabs */}
                  <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
                    {[
                      { id: 'all', label: 'Todos' },
                      { id: 'renders', label: 'Renders' },
                      { id: 'planos', label: 'Planos' },
                      { id: 'galeria', label: 'Galería' },
                      { id: 'general', label: 'General' },
                      { id: 'logos', label: 'Logos' },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setMediaCategory(cat.id)}
                        className={`px-4 py-2 text-[10px] tracking-[0.1em] uppercase whitespace-nowrap transition-all duration-300 ${
                          mediaCategory === cat.id
                            ? 'bg-[#8B6B4B] text-[#F5F1EA]'
                            : 'bg-[#111111] text-[#D8D1C8]/40 border border-[#D8D1C8]/10 hover:text-[#D8D1C8]/60 hover:border-[#8B6B4B]/30'
                        }`}
                      >
                        {cat.label}
                        {cat.id !== 'all' && mediaData[cat.id] && (
                          <span className="ml-1.5 text-[9px] opacity-60">({mediaData[cat.id].length})</span>
                        )}
                        {cat.id === 'all' && (
                          <span className="ml-1.5 text-[9px] opacity-60">({Object.values(mediaData).reduce((a, b) => a + b.length, 0)})</span>
                        )}
                      </button>
                    ))}
                  </div>

                  {mediaLoading ? (
                    <div className="flex items-center justify-center h-48">
                      <div className="w-8 h-8 border-2 border-[#8B6B4B] border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : Object.values(mediaData).every(v => v.length === 0) ? (
                    <div className="bg-[#111111] border border-[#D8D1C8]/5 p-12 text-center">
                      <ImageIcon className="w-8 h-8 text-[#D8D1C8]/15 mx-auto mb-3" />
                      <p className="text-[11px] text-[#D8D1C8]/20">No hay imágenes en la biblioteca</p>
                      <p className="text-[10px] text-[#D8D1C8]/10 mt-1">Sube imágenes usando el botón de arriba</p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {(mediaCategory === 'all'
                        ? ['renders', 'planos', 'galeria', 'general', 'logos']
                        : [mediaCategory]
                      ).map((cat) => {
                        const images = mediaData[cat] || []
                        if (images.length === 0) return null
                        return (
                          <div key={cat}>
                            <h3 className="text-[10px] tracking-[0.2em] uppercase text-[#8B6B4B] mb-3 flex items-center gap-2">
                              {cat.charAt(0).toUpperCase() + cat.slice(1)}
                              <span className="text-[9px] text-[#D8D1C8]/20">({images.length})</span>
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                              {images.map((img) => (
                                <div
                                  key={img.url}
                                  className="group bg-[#111111] border border-[#D8D1C8]/5 hover:border-[#8B6B4B]/30 transition-all duration-300 overflow-hidden"
                                >
                                  <div className="aspect-square bg-[#0A0A0A] relative overflow-hidden">
                                    <img
                                      src={img.url}
                                      alt={img.name}
                                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                                    />
                                  </div>
                                  <div className="p-2.5">
                                    <p className="text-[10px] text-[#F5F1EA] truncate" title={img.name}>{img.name}</p>
                                    <p className="text-[9px] text-[#D8D1C8]/25 mt-0.5">{(img.size / 1024).toFixed(1)} KB</p>
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(img.url).then(() => {
                                          setCopiedUrl(img.url)
                                          setTimeout(() => setCopiedUrl(null), 2000)
                                        })
                                      }}
                                      className="mt-2 w-full flex items-center justify-center gap-1 text-[9px] tracking-wider uppercase border border-[#D8D1C8]/10 text-[#D8D1C8]/40 hover:text-[#8B6B4B] hover:border-[#8B6B4B]/30 py-1.5 transition-colors"
                                    >
                                      {copiedUrl === img.url ? (
                                        <>
                                          <Check className="w-3 h-3 text-[#4B5646]" />
                                          <span className="text-[#4B5646]">Copiado</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-3 h-3" />
                                          <span>Copiar URL</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ═══ AMENITIES ═══ */}
              {activeTab === 'amenities' && (
                <motion.div key="amenities" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <h2 className="font-[family-name:var(--font-cormorant)] text-2xl text-[#F5F1EA] mb-6">Amenidades</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {amenities.map((amenity) => (
                      <div key={amenity.id} className="bg-[#111111] border border-[#D8D1C8]/5 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 border border-[#8B6B4B]/30 flex items-center justify-center text-[#8B6B4B] text-xs">◇</div>
                            {editingAmenity === amenity.id ? (
                              <input type="text" value={amenityEditData.name} onChange={e => setAmenityEditData({ ...amenityEditData, name: e.target.value })} className="bg-[#0A0A0A] border border-[#8B6B4B] px-2 py-1 text-[12px] text-[#F5F1EA] focus:outline-none" />
                            ) : (
                              <span className="text-[12px] text-[#F5F1EA]">{amenity.name}</span>
                            )}
                          </div>
                          <button onClick={() => void toggleAmenity(amenity.id, !amenity.active)} className={`text-[9px] tracking-wider uppercase px-2 py-0.5 ${amenity.active ? 'bg-[#4B5646] text-[#F5F1EA]' : 'bg-[#D8D1C8]/10 text-[#D8D1C8]/30'}`}>
                            {amenity.active ? 'Activo' : 'Inactivo'}
                          </button>
                        </div>

                        {editingAmenity === amenity.id ? (
                          <div className="space-y-2 mt-2">
                            <textarea value={amenityEditData.description} onChange={e => setAmenityEditData({ ...amenityEditData, description: e.target.value })} className="w-full bg-[#0A0A0A] border border-[#D8D1C8]/10 px-3 py-2 text-[10px] text-[#F5F1EA] resize-none h-16 focus:border-[#8B6B4B] focus:outline-none" />
                            <select value={amenityEditData.category} onChange={e => setAmenityEditData({ ...amenityEditData, category: e.target.value })} className="bg-[#0A0A0A] border border-[#D8D1C8]/10 px-2 py-1 text-[10px] text-[#F5F1EA] focus:outline-none appearance-none">
                              <option value="wellness" className="bg-[#111111]">Bienestar</option>
                              <option value="social" className="bg-[#111111]">Social</option>
                              <option value="work" className="bg-[#111111]">Trabajo</option>
                              <option value="leisure" className="bg-[#111111]">Recreación</option>
                            </select>
                            <div className="flex gap-2">
                              <button onClick={() => void saveAmenity(amenity.id)} className="text-[9px] tracking-wider uppercase text-[#8B6B4B] hover:text-[#C4A265]">Guardar</button>
                              <button onClick={() => setEditingAmenity(null)} className="text-[9px] tracking-wider uppercase text-[#D8D1C8]/30 hover:text-[#D8D1C8]/50">Cancelar</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-[10px] text-[#D8D1C8]/30 line-clamp-2">{amenity.description}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-[9px] text-[#D8D1C8]/20">{categoryLabels[amenity.category] || amenity.category}</span>
                              <button onClick={() => { setEditingAmenity(amenity.id); setAmenityEditData({ name: amenity.name, description: amenity.description, category: amenity.category }) }} className="text-[9px] tracking-wider uppercase text-[#8B6B4B]/40 hover:text-[#8B6B4B] transition-colors">
                                Editar
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ═══ COTIZACIONES ═══ */}
              {activeTab === 'cotizaciones' && (
                <motion.div key="cotizaciones" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                    <h2 className="font-[family-name:var(--font-cormorant)] text-2xl text-[#F5F1EA]">Cotizaciones</h2>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setShowNewQuote(true)}
                        className="flex items-center gap-1.5 text-[10px] tracking-wider uppercase bg-[#8B6B4B] text-[#F5F1EA] px-4 py-2 hover:bg-[#7A5C3E] transition-colors"
                      >
                        <Plus className="w-3 h-3" /> Nueva Cotización
                      </button>
                      <span className="text-[10px] text-[#D8D1C8]/30">{quotes.length} cotizaciones</span>
                    </div>
                  </div>

                  {/* New Quote Form */}
                  <AnimatePresence>
                    {showNewQuote && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-6">
                        <div className="bg-[#111111] border border-[#8B6B4B]/20 p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-[family-name:var(--font-cormorant)] text-lg text-[#F5F1EA]">Nueva Cotización</h3>
                            <button onClick={() => setShowNewQuote(false)} className="text-[#D8D1C8]/40 hover:text-[#D8D1C8] transition-colors">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Lead Select */}
                            <div>
                              <label className="text-[10px] tracking-[0.15em] uppercase text-[#D8D1C8]/40 block mb-2">Cliente (Lead)</label>
                              <select
                                value={newQuoteData.leadId}
                                onChange={e => setNewQuoteData({ ...newQuoteData, leadId: e.target.value })}
                                className="w-full bg-[#0A0A0A] border border-[#D8D1C8]/15 px-3 py-2.5 text-[11px] text-[#F5F1EA] focus:border-[#8B6B4B] focus:outline-none appearance-none"
                              >
                                <option value="" className="bg-[#111111]">Seleccionar lead...</option>
                                {leads.map(lead => (
                                  <option key={lead.id} value={lead.id} className="bg-[#111111]">{lead.name} — {lead.email}</option>
                                ))}
                              </select>
                            </div>
                            {/* Apartment Select */}
                            <div>
                              <label className="text-[10px] tracking-[0.15em] uppercase text-[#D8D1C8]/40 block mb-2">Apartamento</label>
                              <select
                                value={newQuoteData.apartmentId}
                                onChange={e => setNewQuoteData({ ...newQuoteData, apartmentId: e.target.value })}
                                className="w-full bg-[#0A0A0A] border border-[#D8D1C8]/15 px-3 py-2.5 text-[11px] text-[#F5F1EA] focus:border-[#8B6B4B] focus:outline-none appearance-none"
                              >
                                <option value="" className="bg-[#111111]">Seleccionar apartamento...</option>
                                {apartments.filter(a => a.status === 'available').map(apt => (
                                  <option key={apt.id} value={apt.id} className="bg-[#111111]">{apt.name} — {apt.typology} — ${(apt.price / 1000000).toFixed(0)}M</option>
                                ))}
                              </select>
                            </div>
                            {/* Discount */}
                            <div>
                              <label className="text-[10px] tracking-[0.15em] uppercase text-[#D8D1C8]/40 block mb-2">Descuento (COP)</label>
                              <input
                                type="number"
                                value={newQuoteData.discount || ''}
                                onChange={e => setNewQuoteData({ ...newQuoteData, discount: parseInt(e.target.value) || 0 })}
                                className="w-full bg-[#0A0A0A] border border-[#D8D1C8]/15 px-3 py-2.5 text-[11px] text-[#F5F1EA] focus:border-[#8B6B4B] focus:outline-none"
                                placeholder="0"
                              />
                            </div>
                            {/* Payment Plan */}
                            <div>
                              <label className="text-[10px] tracking-[0.15em] uppercase text-[#D8D1C8]/40 block mb-2">Plan de Pago</label>
                              <select
                                value={newQuoteData.paymentPlan}
                                onChange={e => setNewQuoteData({ ...newQuoteData, paymentPlan: e.target.value })}
                                className="w-full bg-[#0A0A0A] border border-[#D8D1C8]/15 px-3 py-2.5 text-[11px] text-[#F5F1EA] focus:border-[#8B6B4B] focus:outline-none appearance-none"
                              >
                                <option value="Contado" className="bg-[#111111]">Contado</option>
                                <option value="Crédito 5 años" className="bg-[#111111]">Crédito 5 años</option>
                                <option value="Crédito 10 años" className="bg-[#111111]">Crédito 10 años</option>
                                <option value="Crédito 15 años" className="bg-[#111111]">Crédito 15 años</option>
                                <option value="Crédito 20 años" className="bg-[#111111]">Crédito 20 años</option>
                              </select>
                            </div>
                            {/* Valid Days */}
                            <div>
                              <label className="text-[10px] tracking-[0.15em] uppercase text-[#D8D1C8]/40 block mb-2">Vigencia (días)</label>
                              <input
                                type="number"
                                value={newQuoteData.validDays}
                                onChange={e => setNewQuoteData({ ...newQuoteData, validDays: parseInt(e.target.value) || 30 })}
                                className="w-full bg-[#0A0A0A] border border-[#D8D1C8]/15 px-3 py-2.5 text-[11px] text-[#F5F1EA] focus:border-[#8B6B4B] focus:outline-none"
                                placeholder="30"
                              />
                            </div>
                            {/* Notes */}
                            <div className="md:col-span-2">
                              <label className="text-[10px] tracking-[0.15em] uppercase text-[#D8D1C8]/40 block mb-2">Notas</label>
                              <textarea
                                value={newQuoteData.notes}
                                onChange={e => setNewQuoteData({ ...newQuoteData, notes: e.target.value })}
                                className="w-full bg-[#0A0A0A] border border-[#D8D1C8]/15 px-3 py-2.5 text-[11px] text-[#F5F1EA] resize-none h-16 focus:border-[#8B6B4B] focus:outline-none"
                                placeholder="Notas adicionales..."
                              />
                            </div>
                          </div>
                          {/* Preview */}
                          {newQuoteData.apartmentId && (() => {
                            const apt = apartments.find(a => a.id === newQuoteData.apartmentId)
                            if (!apt) return null
                            const finalPrice = apt.price - (newQuoteData.discount || 0)
                            return (
                              <div className="mt-4 p-3 bg-[#0A0A0A] border border-[#8B6B4B]/10">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] tracking-wider uppercase text-[#D8D1C8]/40">Precio Final</span>
                                  <div className="text-right">
                                    <span className="text-[9px] text-[#D8D1C8]/30 line-through mr-2">${(apt.price / 1000000).toFixed(0)}M</span>
                                    <span className="font-[family-name:var(--font-cormorant)] text-xl text-[#4B5646]">${(finalPrice / 1000000).toFixed(0)}M</span>
                                  </div>
                                </div>
                              </div>
                            )
                          })()}
                          <div className="mt-4 flex gap-3">
                            <button
                              onClick={() => {
                                const handleCreate = async () => {
                                  if (!newQuoteData.leadId || !newQuoteData.apartmentId) return
                                  setCreatingQuote(true)
                                  try {
                                    const res = await fetch('/api/quotes', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify(newQuoteData),
                                    })
                                    if (res.ok) {
                                      setShowNewQuote(false)
                                      setNewQuoteData({ leadId: '', apartmentId: '', discount: 0, paymentPlan: 'Contado', notes: '', validDays: 30 })
                                      void fetchQuotes()
                                    }
                                  } catch {
                                    // silently fail
                                  }
                                  setCreatingQuote(false)
                                }
                                void handleCreate()
                              }}
                              disabled={creatingQuote || !newQuoteData.leadId || !newQuoteData.apartmentId}
                              className="flex items-center gap-1.5 text-[10px] tracking-wider uppercase bg-[#8B6B4B] text-[#F5F1EA] px-6 py-2.5 hover:bg-[#7A5C3E] transition-colors disabled:opacity-50"
                            >
                              {creatingQuote ? (
                                <div className="w-3 h-3 border border-[#F5F1EA] border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <FileText className="w-3 h-3" />
                              )}
                              Crear Cotización
                            </button>
                            <button
                              onClick={() => setShowNewQuote(false)}
                              className="text-[10px] tracking-wider uppercase border border-[#D8D1C8]/15 text-[#D8D1C8]/40 px-4 py-2.5 hover:text-[#D8D1C8] transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Quotes Table */}
                  {quotes.length === 0 ? (
                    <div className="bg-[#111111] border border-[#D8D1C8]/5 p-12 text-center">
                      <FileText className="w-8 h-8 mx-auto text-[#D8D1C8]/10 mb-3" />
                      <p className="text-[11px] text-[#D8D1C8]/20">No hay cotizaciones registradas</p>
                      <p className="text-[10px] text-[#D8D1C8]/10 mt-1">Crea una nueva cotización para comenzar</p>
                    </div>
                  ) : (
                    <div className="bg-[#111111] border border-[#D8D1C8]/5 overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-[#D8D1C8]/10">
                            {['Número', 'Cliente', 'Apartamento', 'Precio Final', 'Plan', 'Estado', 'Fecha', 'Acciones'].map((h) => (
                              <th key={h} className="text-left text-[9px] tracking-[0.15em] uppercase text-[#8B6B4B] p-3 whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {quotes.map((quote) => (
                            <tr key={quote.id} className="border-b border-[#D8D1C8]/5 hover:bg-[#1A1A1A] transition-colors">
                              <td className="text-[11px] text-[#8B6B4B] p-3 whitespace-nowrap font-medium">{quote.number}</td>
                              <td className="text-[11px] text-[#F5F1EA] p-3">{quote.leadName || '—'}</td>
                              <td className="text-[11px] text-[#D8D1C8]/60 p-3">{quote.apartmentName || '—'}</td>
                              <td className="text-[11px] text-[#4B5646] p-3 font-medium">${((quote.finalPrice || 0) / 1000000).toFixed(0)}M</td>
                              <td className="text-[10px] text-[#D8D1C8]/40 p-3">{quote.paymentPlan}</td>
                              <td className="p-3">
                                <select
                                  value={quote.status}
                                  onChange={async (e) => {
                                    try {
                                      await fetch('/api/quotes', {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ id: quote.id, status: e.target.value }),
                                      })
                                      void fetchQuotes()
                                    } catch {
                                      // silently fail
                                    }
                                  }}
                                  className={`text-[8px] tracking-wider uppercase border-none focus:outline-none cursor-pointer px-1.5 py-0.5 ${quoteStatusColors[quote.status]}`}
                                >
                                  <option value="draft" className="bg-[#111111]">Borrador</option>
                                  <option value="sent" className="bg-[#111111]">Enviada</option>
                                  <option value="accepted" className="bg-[#111111]">Aceptada</option>
                                  <option value="rejected" className="bg-[#111111]">Rechazada</option>
                                  <option value="expired" className="bg-[#111111]">Expirada</option>
                                </select>
                              </td>
                              <td className="text-[10px] text-[#D8D1C8]/30 p-3">{new Date(quote.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}</td>
                              <td className="p-3">
                                <div className="flex items-center gap-1">
                                  <a
                                    href={`/api/quotes/${quote.id}/pdf`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-[9px] tracking-wider uppercase text-[#8B6B4B]/50 hover:text-[#8B6B4B] transition-colors"
                                  >
                                    <FileText className="w-3 h-3" /> PDF
                                  </a>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </motion.div>
              )}

            </AnimatePresence>
          )}
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #111111; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #8B6B4B33; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #8B6B4B66; }
      `}</style>
    </div>
  )
}
