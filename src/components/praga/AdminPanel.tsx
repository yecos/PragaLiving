'use client'

import { useState, useCallback, useRef } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RTooltip } from 'recharts'
import { Download, Upload, Copy, Check, ImageIcon, ExternalLink, FileText, Plus, X, RefreshCw, LayoutDashboard, Building2, Layers3, Users, Sparkles, PanelsTopLeft, MapPin, Settings2, Images, ReceiptText, LogOut, ChevronRight, Menu } from 'lucide-react'
import FloorPlanEditor from './FloorPlanEditor'
import SiteConfigEditor from './SiteConfigEditor'
import ConfirmDialog from './ConfirmDialog'

// Format COP currency: 282000000 → "$282.000.000" or "$282M" for compact display
function formatCOP(value: number, compact = false): string {
  if (compact) {
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  }
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

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
    // Refresh data when switching to tabs that show real-time data
    // This ensures the admin always shows the latest data from Neon
    // (e.g. new leads created from the public site appear immediately)
    if (tab === 'medios') {
      void fetchMedia()
    } else if (tab === 'cotizaciones') {
      void fetchQuotes()
    } else if (tab === 'leads' || tab === 'apartments' || tab === 'amenities' || tab === 'dashboard') {
      void fetchData()
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
  const [aptPage, setAptPage] = useState(0)
  const APT_PAGE_SIZE = 15
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

  // Confirm dialog state for destructive actions
  const [confirmState, setConfirmState] = useState<{
    open: boolean
    title: string
    message: string
    confirmLabel?: string
    variant?: 'danger' | 'warning' | 'info'
    onConfirm: () => void
  }>({ open: false, title: '', message: '', onConfirm: () => {} })

  const askConfirm = useCallback((
    title: string,
    message: string,
    onConfirm: () => void,
    options?: { confirmLabel?: string; variant?: 'danger' | 'warning' | 'info' }
  ) => {
    setConfirmState({
      open: true,
      title,
      message,
      onConfirm,
      confirmLabel: options?.confirmLabel,
      variant: options?.variant || 'warning',
    })
  }, [])

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
      if (!aptRes.ok || !leadRes.ok || !amenRes.ok) {
        toast.error('Algunos datos no se pudieron cargar')
      }
    } catch (err) {
      console.error('[admin] fetchData error:', err)
      toast.error('Error de conexión al cargar datos')
    }
    setLoading(false)
  }, [])

  const fetchMedia = useCallback(async () => {
    setMediaLoading(true)
    try {
      const res = await fetch('/api/media')
      const data = await res.json()
      setMediaData(data)
    } catch (err) {
      console.error('[admin] fetchMedia error:', err)
      toast.error('No se pudo cargar la biblioteca de medios')
    }
    setMediaLoading(false)
  }, [])

  const fetchQuotes = useCallback(async () => {
    try {
      const res = await fetch('/api/quotes')
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      const data = await res.json()
      setQuotes(data.quotes || [])
    } catch (err) {
      console.error('[admin] fetchQuotes error:', err)
      toast.error('No se pudieron cargar las cotizaciones')
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
        toast.error('Credenciales inválidas')
      } else if (result?.ok) {
        toast.success('Bienvenido al panel administrativo')
        void fetchData()
      }
    } catch (err) {
      console.error('[admin] login error:', err)
      setLoginError('Error de conexión')
      toast.error('Error de conexión al iniciar sesión')
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
      const res = await fetch('/api/apartments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `HTTP ${res.status}`)
      }
      setApartments(prev => prev.map(a => {
        if (a.id !== editingAptId) return a
        if (editingField === 'status') return { ...a, status: editValue }
        if (editingField === 'price') return { ...a, price: parseFloat(editValue) }
        return a
      }))
      toast.success(`Apartamento actualizado: ${editingField === 'status' ? 'estado' : 'precio'}`)
    } catch (err) {
      console.error('[admin] saveEdit error:', err)
      toast.error('No se pudo actualizar el apartamento', { description: err instanceof Error ? err.message : undefined })
    }
    setEditingAptId(null)
    setEditingField(null)
    setEditValue('')
  }

  const updateLeadStatus = async (leadId: string, status: string) => {
    // Ask confirmation for destructive status changes
    if (status === 'lost') {
      const lead = leads.find(l => l.id === leadId)
      askConfirm(
        'Marcar como perdido',
        `¿Marcar el lead "${lead?.name || ''}" como perdido? Este lead se archivará y no aparecerá en el pipeline activo.`,
        () => void doUpdateLeadStatus(leadId, status),
        { confirmLabel: 'Marcar perdido', variant: 'danger' }
      )
      return
    }
    void doUpdateLeadStatus(leadId, status)
  }

  const doUpdateLeadStatus = async (leadId: string, status: string) => {
    try {
      const res = await fetch('/api/leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leadId, status }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `HTTP ${res.status}`)
      }
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status } : l))
      toast.success(`Lead marcado como: ${leadStatusLabels[status] || status}`)
    } catch (err) {
      console.error('[admin] updateLeadStatus error:', err)
      toast.error('No se pudo actualizar el estado del lead')
    }
  }

  const saveLeadNotes = async (leadId: string) => {
    try {
      const res = await fetch('/api/leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leadId, notes: leadNotes }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `HTTP ${res.status}`)
      }
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, notes: leadNotes } : l))
      toast.success('Notas guardadas')
    } catch (err) {
      console.error('[admin] saveLeadNotes error:', err)
      toast.error('No se pudieron guardar las notas')
    }
  }

  const toggleAmenity = async (amenityId: string, active: boolean) => {
    try {
      const res = await fetch('/api/amenities', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: amenityId, active }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `HTTP ${res.status}`)
      }
      setAmenities(prev => prev.map(a => a.id === amenityId ? { ...a, active } : a))
      toast.success(`Amenidad ${active ? 'activada' : 'desactivada'}`)
    } catch (err) {
      console.error('[admin] toggleAmenity error:', err)
      toast.error('No se pudo cambiar el estado de la amenidad')
    }
  }

  const saveAmenity = async (amenityId: string) => {
    try {
      const res = await fetch('/api/amenities', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: amenityId, ...amenityEditData }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `HTTP ${res.status}`)
      }
      setAmenities(prev => prev.map(a => a.id === amenityId ? { ...a, ...amenityEditData } : a))
      setEditingAmenity(null)
      toast.success('Amenidad actualizada')
    } catch (err) {
      console.error('[admin] saveAmenity error:', err)
      toast.error('No se pudo guardar la amenidad')
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

  // Reset page when filters change
  const totalPages = Math.ceil(filteredApartments.length / APT_PAGE_SIZE) || 1
  const safePage = Math.min(aptPage, totalPages - 1)
  const paginatedApartments = filteredApartments.slice(safePage * APT_PAGE_SIZE, (safePage + 1) * APT_PAGE_SIZE)

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

  const doUpdateQuoteStatus = async (quoteId: string, newStatus: string, quoteNumber: string) => {
    try {
      const res = await fetch('/api/quotes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: quoteId, status: newStatus }),
      })
      if (res.ok) {
        toast.success(`Cotización ${quoteNumber} → ${quoteStatusLabels[newStatus] || newStatus}`)
        void fetchQuotes()
      } else {
        toast.error('No se pudo actualizar el estado')
      }
    } catch (err) {
      console.error('[admin] update quote status error:', err)
      toast.error('Error de red al actualizar cotización')
    }
  }

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
      <div className="relative min-h-screen overflow-hidden bg-[#0A0A09] flex items-center justify-center p-6">
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 15%, rgba(184,146,104,0.13), transparent 32%)' }} />
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-md rounded-[28px] border border-[#E9E0D3]/10 bg-[#10100F]/90 p-7 md:p-9 shadow-[0_35px_100px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="text-center mb-8">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#B89268]/20 bg-[#B89268]/5"><img src="/images/logo.png" alt="PRAGA" className="h-9 w-auto brightness-0 invert opacity-90" /></div>
            <h1 className="font-[family-name:var(--font-cormorant)] text-2xl font-light text-[#F7F1E8] tracking-wider">Panel Administrativo</h1>
            <p className="text-[10px] text-[#D8D1C8]/30 tracking-widest uppercase mt-2">Acceso restringido</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-[10px] tracking-[0.15em] uppercase text-[#D8D1C8]/40 block mb-2">Usuario</label>
              <input type="text" value={loginData.user} onChange={(e) => setLoginData({ ...loginData, user: e.target.value })} className="w-full rounded-xl bg-[#151513] border border-[#E9E0D3]/10 px-4 py-3.5 text-sm text-[#F7F1E8] focus:border-[#B89268]/60 focus:ring-2 focus:ring-[#B89268]/10 focus:outline-none transition-all" placeholder="admin" />
            </div>
            <div>
              <label className="text-[10px] tracking-[0.15em] uppercase text-[#D8D1C8]/40 block mb-2">Contraseña</label>
              <input type="password" value={loginData.pass} onChange={(e) => setLoginData({ ...loginData, pass: e.target.value })} className="w-full bg-transparent border border-[#D8D1C8]/20 px-4 py-3 text-sm text-[#F5F1EA] focus:border-[#B89268]/70 focus:ring-2 focus:ring-[#B89268]/10 focus:outline-none transition-colors" placeholder="••••••••" />
            </div>
            {loginError && <p className="text-[10px] text-red-400">{loginError}</p>}
            <button type="submit" className="w-full rounded-xl text-[10px] font-semibold tracking-[0.16em] uppercase bg-[#B89268] text-[#15120F] py-3.5 shadow-[0_14px_34px_rgba(184,146,104,0.2)] hover:bg-[#C6A47C] hover:-translate-y-0.5 transition-all">Iniciar Sesión</button>
          </form>
        </motion.div>
      </div>
    )
  }

  const tabs: { id: Tab; label: string; description: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Resumen', description: 'Pulso comercial del proyecto', icon: LayoutDashboard },
    { id: 'apartments', label: 'Residencias', description: 'Inventario, precio y estado', icon: Building2 },
    { id: 'plantas', label: 'Plantas', description: 'Disponibilidad interactiva', icon: Layers3 },
    { id: 'leads', label: 'Leads', description: 'Prospectos y seguimiento', icon: Users },
    { id: 'cotizaciones', label: 'Cotizaciones', description: 'Propuestas comerciales', icon: ReceiptText },
    { id: 'amenities', label: 'Amenidades', description: 'Operación de amenidades', icon: Sparkles },
    { id: 'contenido', label: 'Contenido web', description: 'Textos, imágenes y secciones', icon: PanelsTopLeft },
    { id: 'ubicacion', label: 'Ubicación', description: 'Mapa y puntos de interés', icon: MapPin },
    { id: 'medios', label: 'Biblioteca', description: 'Archivos e imágenes', icon: Images },
    { id: 'configuracion', label: 'Configuración', description: 'Contacto, SEO y sistema', icon: Settings2 },
  ]
  const activeTabMeta = tabs.find(tab => tab.id === activeTab) || tabs[0]

  return (
    <div className="min-h-screen bg-[#0A0A09] text-[#F6F0E7]">
      <div className="pointer-events-none fixed inset-0 opacity-60" style={{ background: 'radial-gradient(circle at 72% 0%, rgba(184,146,104,0.08), transparent 30%), radial-gradient(circle at 10% 90%, rgba(184,146,104,0.035), transparent 28%)' }} />
      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-[#0D0D0C]/90 backdrop-blur-xl border-b border-[#E9E0D3]/7 px-4 md:px-7 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#B89268]/20 bg-[#B89268]/5">
            <img src="/images/logo.png" alt="PRAGA" className="h-6 w-auto brightness-0 invert opacity-85" />
          </div>
          <div className="hidden sm:block">
            <p className="font-[family-name:var(--font-cormorant)] text-lg leading-none text-[#F7F1E8]">PRAGA Living</p>
            <span className="mt-1 block text-[8px] tracking-[0.28em] uppercase text-[#B89268]">Private Management Suite</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <a href="/" target="_blank" rel="noopener noreferrer" className="hidden sm:flex items-center gap-2 rounded-xl border border-[#E9E0D3]/8 bg-[#121210] px-3.5 py-2.5 text-[9px] font-medium tracking-[0.12em] uppercase text-[#CFC4B5]/55 hover:text-[#E8D8C5] hover:border-[#B89268]/25 transition-all">
            <ExternalLink className="w-3 h-3" />
            Abrir Sitio
          </a>
          <button onClick={() => void fetchData()} disabled={loading} className="flex items-center gap-2 rounded-xl border border-[#E9E0D3]/8 bg-[#121210] px-3.5 py-2.5 text-[9px] font-medium tracking-[0.12em] uppercase text-[#CFC4B5]/55 hover:text-[#E8D8C5] hover:border-[#B89268]/25 transition-all disabled:opacity-50">
            {loading ? (
              <div className="w-3 h-3 border border-[#8B6B4B] border-t-transparent rounded-full animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3" />
            )}
            {loading ? 'Cargando...' : 'Actualizar'}
          </button>
          <button onClick={() => void signOut()} title="Cerrar sesión" className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E9E0D3]/8 bg-[#121210] text-[#CFC4B5]/45 hover:text-[#D4B18A] hover:border-[#B89268]/25 transition-all">
            <LogOut className="h-4 w-4" />
          </button>
          </div>
        </main>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className="relative z-10 w-[280px] bg-[#0D0D0C]/75 border-r border-[#E9E0D3]/7 min-h-[calc(100vh-68px)] p-4 hidden lg:block">
          <div className="sticky top-[84px]">
            <div className="mb-5 px-3">
              <p className="text-[8px] font-semibold tracking-[0.22em] uppercase text-[#B89268]/75">Workspace</p>
              <p className="mt-2 text-xs leading-relaxed text-[#CFC4B5]/35">Gestiona ventas, contenido y operación desde un solo lugar.</p>
            </div>
          <nav className="space-y-1.5">
            {tabs.map((tab) => (
              (() => {
                const Icon = tab.icon
                const active = activeTab === tab.id
                return (
                  <button key={tab.id} onClick={() => handleTabSwitch(tab.id)} className={`group w-full rounded-xl border px-3.5 py-3 text-left transition-all duration-300 ${active ? 'border-[#B89268]/25 bg-[#B89268]/10 shadow-[0_12px_28px_rgba(0,0,0,0.12)]' : 'border-transparent text-[#CFC4B5]/45 hover:bg-[#151513] hover:border-[#E9E0D3]/7'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${active ? 'border-[#B89268]/25 bg-[#B89268]/10 text-[#D0AE86]' : 'border-[#E9E0D3]/7 bg-[#121210] text-[#CFC4B5]/35 group-hover:text-[#D0AE86]'}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-[10px] font-semibold tracking-[0.08em] uppercase ${active ? 'text-[#EEDDC9]' : 'text-[#D9CFC2]/55 group-hover:text-[#E7D8C6]/80'}`}>{tab.label}</p>
                        <p className="mt-1 truncate text-[9px] text-[#CFC4B5]/25">{tab.description}</p>
                      </div>
                      <ChevronRight className={`h-3.5 w-3.5 transition-all ${active ? 'translate-x-0 text-[#B89268]' : '-translate-x-1 text-transparent group-hover:translate-x-0 group-hover:text-[#B89268]/50'}`} />
                    </div>
                  </button>
                )
              })()
            ))}
          </nav>
          <div className="mt-6 rounded-2xl border border-[#B89268]/12 bg-gradient-to-br from-[#B89268]/8 to-transparent p-4">
            <p className="text-[8px] font-semibold tracking-[0.18em] uppercase text-[#B89268]/70">Estado del sitio</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.45)]" />
              <span className="text-[10px] text-[#D9CFC2]/60">Contenido sincronizado</span>
            </div>
          </div>
          </div>
        </aside>

        {/* Mobile tabs */}
        <div className="lg:hidden fixed bottom-3 left-3 right-3 z-50 overflow-x-auto rounded-2xl border border-[#E9E0D3]/10 bg-[#10100F]/95 p-2 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="flex min-w-max gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button key={tab.id} onClick={() => handleTabSwitch(tab.id)} className={`flex min-w-[82px] flex-col items-center gap-1.5 rounded-xl px-3 py-2 text-[8px] font-medium tracking-[0.08em] uppercase transition-all ${activeTab === tab.id ? 'bg-[#B89268]/12 text-[#D4B18A]' : 'text-[#CFC4B5]/35'}`}>
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Main content */}
        <main className="relative z-10 min-w-0 flex-1 p-4 pb-28 md:p-7 lg:pb-8">
          <div className="mx-auto max-w-[1540px]">
            <div className="mb-7 flex flex-col gap-4 rounded-[24px] border border-[#E9E0D3]/7 bg-gradient-to-r from-[#151513] to-[#10100F] p-5 md:flex-row md:items-end md:justify-between md:p-6 shadow-[0_18px_60px_rgba(0,0,0,0.16)]">
              <div>
                <p className="text-[8px] font-semibold tracking-[0.22em] uppercase text-[#B89268]/75">PRAGA Management Suite</p>
                <h1 className="mt-2 font-[family-name:var(--font-cormorant)] text-3xl font-light text-[#F7F1E8] md:text-4xl">{activeTabMeta.label}</h1>
                <p className="mt-1 text-xs text-[#CFC4B5]/38">{activeTabMeta.description}</p>
              </div>
              <div className="flex items-center gap-2 text-[9px] text-[#CFC4B5]/30">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Datos en vivo
              </div>
            </div>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-[#8B6B4B] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {/* ═══ DASHBOARD ═══ */}
              {activeTab === 'dashboard' && (
                <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="mb-7 grid grid-cols-2 gap-3 md:grid-cols-4">
                    {[
                      { label: 'Editar página', tab: 'contenido' as Tab, icon: PanelsTopLeft, note: 'Textos e imágenes' },
                      { label: 'Residencias', tab: 'apartments' as Tab, icon: Building2, note: 'Inventario y precios' },
                      { label: 'Leads', tab: 'leads' as Tab, icon: Users, note: `${leads.filter(l => l.status === 'new').length} nuevos` },
                      { label: 'Biblioteca', tab: 'medios' as Tab, icon: Images, note: 'Recursos visuales' },
                    ].map((action) => {
                      const Icon = action.icon
                      return (
                        <button key={action.tab} onClick={() => handleTabSwitch(action.tab)} className="group rounded-2xl border border-[#E9E0D3]/7 bg-[#121210] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#B89268]/25 hover:bg-[#161613]">
                          <div className="flex items-center justify-between">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#B89268]/15 bg-[#B89268]/5 text-[#B89268]">
                              <Icon className="h-4 w-4" />
                            </div>
                            <ChevronRight className="h-4 w-4 text-[#CFC4B5]/15 transition-all group-hover:translate-x-0.5 group-hover:text-[#B89268]/70" />
                          </div>
                          <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#E6DBCF]/75">{action.label}</p>
                          <p className="mt-1 text-[9px] text-[#CFC4B5]/28">{action.note}</p>
                        </button>
                      )
                    })}
                  </div>

                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                    {[
                      { label: 'Total Unidades', value: apartments.length, color: 'text-[#F5F1EA]' },
                      { label: 'Disponibles', value: available, color: 'text-[#4B5646]' },
                      { label: 'Reservadas', value: reserved, color: 'text-[#8B6B4B]' },
                      { label: 'Vendidas', value: sold, color: 'text-[#D8D1C8]' },
                      { label: '% Vendido', value: `${soldPct}%`, color: 'text-[#8B6B4B]' },
                    ].map((stat) => (
                      <div key={stat.label} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#171714] to-[#10100F] border border-[#E9E0D3]/7 p-5 shadow-[0_14px_40px_rgba(0,0,0,0.14)]">
                        <div className="absolute -right-5 -top-5 h-20 w-20 rounded-full bg-[#B89268]/[0.035]" />
                        <p className={`relative font-[family-name:var(--font-cormorant)] text-3xl md:text-4xl ${stat.color}`}>{stat.value}</p>
                        <p className="relative mt-2 text-[8px] font-semibold tracking-[0.16em] uppercase text-[#D8D1C8]/30">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Pie Chart */}
                    <div className="rounded-2xl bg-gradient-to-br from-[#151513] to-[#10100F] border border-[#E9E0D3]/7 p-5 shadow-[0_14px_40px_rgba(0,0,0,0.14)]">
                      <h3 className="text-[9px] font-semibold tracking-[0.18em] uppercase text-[#B89268] mb-4">Distribución por Estado</h3>
                      <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                              {pieData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <RTooltip contentStyle={{ background: '#111111', border: '1px solid #8B6B4B33', borderRadius: '12px', fontSize: '11px', color: '#F5F1EA' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex justify-center gap-4 mt-2">
                        {pieData.map((d, i) => (
                          <div key={d.name} className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                            <span className="text-[9px] text-[#D8D1C8]/50">{d.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Availability by Floor */}
                    <div className="rounded-2xl bg-gradient-to-br from-[#151513] to-[#10100F] border border-[#E9E0D3]/7 p-5 shadow-[0_14px_40px_rgba(0,0,0,0.14)]">
                      <h3 className="text-[9px] font-semibold tracking-[0.18em] uppercase text-[#B89268] mb-4">Disponibilidad por Piso</h3>
                      <div className="max-h-52 overflow-y-auto custom-scrollbar space-y-2">
                        {Object.entries(floorAvailability).sort((a, b) => {
                          const fa = parseInt(a[0].replace('Piso ', ''))
                          const fb = parseInt(b[0].replace('Piso ', ''))
                          return fa - fb
                        }).map(([floor, data]) => (
                          <div key={floor} className="flex items-center gap-3">
                            <span className="text-[10px] text-[#D8D1C8]/40 w-14 font-[family-name:var(--font-inter)]">{floor}</span>
                            <div className="flex h-2.5 flex-1 overflow-hidden rounded-full bg-[#1A1A18]">
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
                    <div className="rounded-2xl bg-gradient-to-br from-[#151513] to-[#10100F] border border-[#E9E0D3]/7 p-5 shadow-[0_14px_40px_rgba(0,0,0,0.14)] md:col-span-2">
                      <h3 className="text-[9px] font-semibold tracking-[0.18em] uppercase text-[#B89268] mb-4">Leads Recientes</h3>
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
                    <h2 className="font-[family-name:var(--font-cormorant)] text-2xl font-light text-[#F7F1E8]">Apartamentos</h2>
                    <div className="flex flex-wrap gap-3 items-center">
                      <input type="text" placeholder="Buscar nombre/piso..." value={aptSearch} onChange={e => { setAptSearch(e.target.value); setAptPage(0) }} className="rounded-xl bg-[#141412] border border-[#E9E0D3]/10 px-3 py-1.5 text-[11px] text-[#F5F1EA] w-40 focus:border-[#B89268]/70 focus:ring-2 focus:ring-[#B89268]/10 focus:outline-none" />
                      <select value={aptStatusFilter} onChange={e => { setAptStatusFilter(e.target.value); setAptPage(0) }} className="rounded-xl bg-[#141412] border border-[#E9E0D3]/10 px-3 py-1.5 text-[11px] text-[#F5F1EA] focus:border-[#B89268]/70 focus:ring-2 focus:ring-[#B89268]/10 focus:outline-none appearance-none">
                        <option value="" className="bg-[#111111]">Todos los estados</option>
                        <option value="available" className="bg-[#111111]">Disponible</option>
                        <option value="reserved" className="bg-[#111111]">Reservado</option>
                        <option value="sold" className="bg-[#111111]">Vendido</option>
                      </select>
                      <select value={aptTypologyFilter} onChange={e => { setAptTypologyFilter(e.target.value); setAptPage(0) }} className="rounded-xl bg-[#141412] border border-[#E9E0D3]/10 px-3 py-1.5 text-[11px] text-[#F5F1EA] focus:border-[#B89268]/70 focus:ring-2 focus:ring-[#B89268]/10 focus:outline-none appearance-none">
                        <option value="" className="bg-[#111111]">Todas las tipologías</option>
                        <option value="78.51 m²" className="bg-[#111111]">78.51 m²</option>
                        <option value="60 m²" className="bg-[#111111]">60 m²</option>
                        <option value="104 m²" className="bg-[#111111]">104 m²</option>
                        <option value="34.28 m²" className="bg-[#111111]">34.28 m²</option>
                        <option value="35.6 m²" className="bg-[#111111]">35.6 m²</option>
                        <option value="35.8 m²" className="bg-[#111111]">35.8 m²</option>
                        <option value="33.75 m²" className="bg-[#111111]">33.75 m²</option>
                        <option value="33.05 m²" className="bg-[#111111]">33.05 m²</option>
                      </select>
                      <span className="text-[10px] text-[#D8D1C8]/30">{filteredApartments.length} unidades</span>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-[#121210] border border-[#E9E0D3]/7 overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#D8D1C8]/10">
                          {['Nombre', 'Área', 'Hab', 'Baños', 'Piso', 'Vista', 'Tipología', 'Precio', 'Estado'].map((h) => (
                            <th key={h} className="text-left text-[9px] tracking-[0.15em] uppercase text-[#8B6B4B] p-3 whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedApartments.map((apt) => (
                          <tr key={apt.id} className="border-b border-[#E9E0D3]/6 hover:bg-[#1A1A1A] transition-colors">
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
                                <span className="text-[11px] text-[#8B6B4B] cursor-pointer hover:underline" onClick={() => startEdit(apt.id, 'price', apt.price.toString())} title={formatCOP(apt.price)}>
                                  {formatCOP(apt.price, true)}
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

                  {/* Pagination controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 px-1">
                      <span className="text-[9px] text-[#D8D1C8]/30 tracking-wider uppercase">
                        Página {safePage + 1} de {totalPages} · {filteredApartments.length} unidades
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setAptPage(Math.max(0, safePage - 1))}
                          disabled={safePage === 0}
                          className="text-[10px] tracking-wider uppercase border border-[#D8D1C8]/15 text-[#D8D1C8]/40 px-3 py-1.5 hover:text-[#8B6B4B] hover:border-[#8B6B4B]/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          ← Anterior
                        </button>
                        <button
                          onClick={() => setAptPage(Math.min(totalPages - 1, safePage + 1))}
                          disabled={safePage >= totalPages - 1}
                          className="text-[10px] tracking-wider uppercase border border-[#D8D1C8]/15 text-[#D8D1C8]/40 px-3 py-1.5 hover:text-[#8B6B4B] hover:border-[#8B6B4B]/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          Siguiente →
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ═══ LEADS ═══ */}
              {activeTab === 'leads' && (
                <motion.div key="leads" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                    <h2 className="font-[family-name:var(--font-cormorant)] text-2xl font-light text-[#F7F1E8]">Leads</h2>
                    <div className="flex items-center gap-3">
                      <select value={leadStatusFilter} onChange={e => setLeadStatusFilter(e.target.value)} className="rounded-xl bg-[#141412] border border-[#E9E0D3]/10 px-3 py-1.5 text-[11px] text-[#F5F1EA] focus:border-[#B89268]/70 focus:ring-2 focus:ring-[#B89268]/10 focus:outline-none appearance-none">
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
                    <div className="rounded-2xl bg-[#121210] border border-[#E9E0D3]/7 p-12 text-center">
                      <p className="text-[11px] text-[#D8D1C8]/20">No hay leads registrados aún</p>
                      <p className="text-[10px] text-[#D8D1C8]/10 mt-1">Los leads del formulario aparecerán aquí</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredLeads.map((lead) => (
                        <motion.div key={lead.id} layout className="rounded-2xl bg-[#121210] border border-[#E9E0D3]/7 p-4">
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
                                <textarea value={leadNotes} onChange={e => setLeadNotes(e.target.value)} className="w-full mt-2 bg-[#0A0A0A] border border-[#E9E0D3]/8 px-3 py-2 text-[10px] text-[#F5F1EA] resize-none h-16 focus:border-[#B89268]/70 focus:ring-2 focus:ring-[#B89268]/10 focus:outline-none" placeholder="Agregar notas..." />
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
                    <h2 className="font-[family-name:var(--font-cormorant)] text-2xl font-light text-[#F7F1E8]">Medios</h2>
                    <div className="flex items-center gap-3">
                      <select
                        value={uploadCategory}
                        onChange={e => setUploadCategory(e.target.value)}
                        className="rounded-xl bg-[#141412] border border-[#E9E0D3]/10 px-3 py-1.5 text-[11px] text-[#F5F1EA] focus:border-[#B89268]/70 focus:ring-2 focus:ring-[#B89268]/10 focus:outline-none appearance-none"
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
                              // Resize image client-side to avoid Vercel 4.5MB body limit (HTTP 413)
                              const { resizeImageForUpload } = await import('@/lib/image-resize')
                              const resizedFile = await resizeImageForUpload(file)

                              const formData = new FormData()
                              formData.append('file', resizedFile)
                              formData.append('category', uploadCategory)
                              const res = await fetch('/api/upload', { method: 'POST', body: formData })
                              const data = await res.json().catch(() => ({}))
                              if (res.ok) {
                                toast.success(`Imagen subida: ${resizedFile.name}`)
                                void fetchMedia()
                              } else {
                                toast.error('No se pudo subir la imagen', { description: data.error || `HTTP ${res.status}` })
                              }
                            } catch (err) {
                              console.error('[admin] upload error:', err)
                              toast.error('Error de red al subir imagen')
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
                            : 'bg-[#111111] text-[#D8D1C8]/40 border border-[#E9E0D3]/8 hover:text-[#D8D1C8]/60 hover:border-[#8B6B4B]/30'
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
                    <div className="rounded-2xl bg-[#121210] border border-[#E9E0D3]/7 p-12 text-center">
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
                            <h3 className="text-[9px] font-semibold tracking-[0.18em] uppercase text-[#B89268] mb-3 flex items-center gap-2">
                              {cat.charAt(0).toUpperCase() + cat.slice(1)}
                              <span className="text-[9px] text-[#D8D1C8]/20">({images.length})</span>
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                              {images.map((img) => (
                                <div
                                  key={img.url}
                                  className="group rounded-2xl bg-[#121210] border border-[#E9E0D3]/7 hover:border-[#8B6B4B]/30 transition-all duration-300 overflow-hidden"
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
                                      className="mt-2 w-full flex items-center justify-center gap-1 text-[9px] tracking-wider uppercase border border-[#E9E0D3]/8 text-[#D8D1C8]/40 hover:text-[#8B6B4B] hover:border-[#8B6B4B]/30 py-1.5 transition-colors"
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
                  <h2 className="font-[family-name:var(--font-cormorant)] text-2xl font-light text-[#F7F1E8] mb-6">Amenidades</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {amenities.map((amenity) => (
                      <div key={amenity.id} className="rounded-2xl bg-[#121210] border border-[#E9E0D3]/7 p-4">
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
                            <textarea value={amenityEditData.description} onChange={e => setAmenityEditData({ ...amenityEditData, description: e.target.value })} className="w-full bg-[#0A0A0A] border border-[#E9E0D3]/8 px-3 py-2 text-[10px] text-[#F5F1EA] resize-none h-16 focus:border-[#B89268]/70 focus:ring-2 focus:ring-[#B89268]/10 focus:outline-none" />
                            <select value={amenityEditData.category} onChange={e => setAmenityEditData({ ...amenityEditData, category: e.target.value })} className="bg-[#0A0A0A] border border-[#E9E0D3]/8 px-2 py-1 text-[10px] text-[#F5F1EA] focus:outline-none appearance-none">
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
                    <h2 className="font-[family-name:var(--font-cormorant)] text-2xl font-light text-[#F7F1E8]">Cotizaciones</h2>
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
                                className="w-full bg-[#0A0A0A] border border-[#D8D1C8]/15 px-3 py-2.5 text-[11px] text-[#F5F1EA] focus:border-[#B89268]/70 focus:ring-2 focus:ring-[#B89268]/10 focus:outline-none appearance-none"
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
                                className="w-full bg-[#0A0A0A] border border-[#D8D1C8]/15 px-3 py-2.5 text-[11px] text-[#F5F1EA] focus:border-[#B89268]/70 focus:ring-2 focus:ring-[#B89268]/10 focus:outline-none appearance-none"
                              >
                                <option value="" className="bg-[#111111]">Seleccionar apartamento...</option>
                                {apartments.filter(a => a.status === 'available').map(apt => (
                                  <option key={apt.id} value={apt.id} className="bg-[#111111]">{apt.name} — {apt.typology} — {formatCOP(apt.price, true)}</option>
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
                                className="w-full bg-[#0A0A0A] border border-[#D8D1C8]/15 px-3 py-2.5 text-[11px] text-[#F5F1EA] focus:border-[#B89268]/70 focus:ring-2 focus:ring-[#B89268]/10 focus:outline-none"
                                placeholder="0"
                              />
                            </div>
                            {/* Payment Plan */}
                            <div>
                              <label className="text-[10px] tracking-[0.15em] uppercase text-[#D8D1C8]/40 block mb-2">Plan de Pago</label>
                              <select
                                value={newQuoteData.paymentPlan}
                                onChange={e => setNewQuoteData({ ...newQuoteData, paymentPlan: e.target.value })}
                                className="w-full bg-[#0A0A0A] border border-[#D8D1C8]/15 px-3 py-2.5 text-[11px] text-[#F5F1EA] focus:border-[#B89268]/70 focus:ring-2 focus:ring-[#B89268]/10 focus:outline-none appearance-none"
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
                                className="w-full bg-[#0A0A0A] border border-[#D8D1C8]/15 px-3 py-2.5 text-[11px] text-[#F5F1EA] focus:border-[#B89268]/70 focus:ring-2 focus:ring-[#B89268]/10 focus:outline-none"
                                placeholder="30"
                              />
                            </div>
                            {/* Notes */}
                            <div className="md:col-span-2">
                              <label className="text-[10px] tracking-[0.15em] uppercase text-[#D8D1C8]/40 block mb-2">Notas</label>
                              <textarea
                                value={newQuoteData.notes}
                                onChange={e => setNewQuoteData({ ...newQuoteData, notes: e.target.value })}
                                className="w-full bg-[#0A0A0A] border border-[#D8D1C8]/15 px-3 py-2.5 text-[11px] text-[#F5F1EA] resize-none h-16 focus:border-[#B89268]/70 focus:ring-2 focus:ring-[#B89268]/10 focus:outline-none"
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
                                    <span className="text-[9px] text-[#D8D1C8]/30 line-through mr-2">{formatCOP(apt.price, true)}</span>
                                    <span className="font-[family-name:var(--font-cormorant)] text-xl text-[#4B5646]">{formatCOP(finalPrice, true)}</span>
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
                                    const data = await res.json().catch(() => ({}))
                                    if (res.ok) {
                                      toast.success(`Cotización creada: ${data.quote?.number || ''}`)
                                      setShowNewQuote(false)
                                      setNewQuoteData({ leadId: '', apartmentId: '', discount: 0, paymentPlan: 'Contado', notes: '', validDays: 30 })
                                      void fetchQuotes()
                                    } else {
                                      toast.error('No se pudo crear la cotización', { description: data.error || `HTTP ${res.status}` })
                                    }
                                  } catch (err) {
                                    console.error('[admin] create quote error:', err)
                                    toast.error('Error de red al crear cotización')
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
                    <div className="rounded-2xl bg-[#121210] border border-[#E9E0D3]/7 p-12 text-center">
                      <FileText className="w-8 h-8 mx-auto text-[#D8D1C8]/10 mb-3" />
                      <p className="text-[11px] text-[#D8D1C8]/20">No hay cotizaciones registradas</p>
                      <p className="text-[10px] text-[#D8D1C8]/10 mt-1">Crea una nueva cotización para comenzar</p>
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-[#121210] border border-[#E9E0D3]/7 overflow-x-auto">
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
                            <tr key={quote.id} className="border-b border-[#E9E0D3]/6 hover:bg-[#1A1A1A] transition-colors">
                              <td className="text-[11px] text-[#8B6B4B] p-3 whitespace-nowrap font-medium">{quote.number}</td>
                              <td className="text-[11px] text-[#F5F1EA] p-3">{quote.leadName || '—'}</td>
                              <td className="text-[11px] text-[#D8D1C8]/60 p-3">{quote.apartmentName || '—'}</td>
                              <td className="text-[11px] text-[#4B5646] p-3 font-medium" title={formatCOP(quote.finalPrice || 0)}>{formatCOP(quote.finalPrice || 0, true)}</td>
                              <td className="text-[10px] text-[#D8D1C8]/40 p-3">{quote.paymentPlan}</td>
                              <td className="p-3">
                                <select
                                  value={quote.status}
                                  onChange={async (e) => {
                                    const newStatus = e.target.value
                                    // Ask confirmation for destructive status changes
                                    if (newStatus === 'rejected') {
                                      askConfirm(
                                        'Rechazar cotización',
                                        `¿Rechazar la cotización ${quote.number}? Esta acción no se puede deshacer.`,
                                        () => void doUpdateQuoteStatus(quote.id, newStatus, quote.number),
                                        { confirmLabel: 'Rechazar', variant: 'danger' }
                                      )
                                      return
                                    }
                                    void doUpdateQuoteStatus(quote.id, newStatus, quote.number)
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

      {/* Confirm dialog for destructive actions */}
      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel}
        variant={confirmState.variant}
        onConfirm={() => {
          confirmState.onConfirm()
          setConfirmState({ ...confirmState, open: false })
        }}
        onCancel={() => setConfirmState({ ...confirmState, open: false })}
      />
    </div>
  )
}
