'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RTooltip } from 'recharts'
import { Download } from 'lucide-react'

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

const PIE_COLORS = ['#4B5646', '#8B6B4B', '#D8D1C8']

export default function AdminPanel() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loginData, setLoginData] = useState({ user: '', pass: '' })
  const [loginError, setLoginError] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginData.user, password: loginData.pass }),
      })
      const data = await res.json()
      if (data.success) {
        setIsLoggedIn(true)
        void fetchData()
      } else {
        setLoginError(data.error || 'Credenciales inválidas')
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

  // Login screen
  if (!isLoggedIn) {
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
    { id: 'leads', label: 'Leads' },
    { id: 'amenities', label: 'Amenidades' },
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
          <button onClick={() => void fetchData()} className="text-[10px] tracking-wider uppercase text-[#D8D1C8]/30 hover:text-[#8B6B4B] transition-colors">
            Actualizar
          </button>
          <button onClick={() => setIsLoggedIn(false)} className="text-[10px] tracking-wider uppercase text-[#D8D1C8]/30 hover:text-[#8B6B4B] transition-colors">
            Cerrar Sesión
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-56 bg-[#111111] border-r border-[#D8D1C8]/5 min-h-[calc(100vh-56px)] p-4 hidden md:block">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full text-left px-4 py-2.5 text-[11px] tracking-[0.1em] uppercase transition-all duration-300 ${activeTab === tab.id ? 'bg-[#8B6B4B]/10 text-[#8B6B4B] border-l-2 border-[#8B6B4B]' : 'text-[#D8D1C8]/30 hover:text-[#D8D1C8]/50 border-l-2 border-transparent'}`}>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Mobile tabs */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#111111] border-t border-[#D8D1C8]/5 z-50 flex">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 py-3 text-[9px] tracking-wider uppercase ${activeTab === tab.id ? 'text-[#8B6B4B]' : 'text-[#D8D1C8]/30'}`}>
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
