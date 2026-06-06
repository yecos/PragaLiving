/* eslint-disable react-hooks/immutability */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

// ─── Types ───
type SectionKey =
  | 'general' | 'hero' | 'manifiesto' | 'arquitectura' | 'edificio'
  | 'atrio' | 'amenidades' | 'tipologias' | 'recorridos' | 'ubicacion'
  | 'galeria' | 'inversion' | 'contacto' | 'footer' | 'chat' | 'navigation' | 'seo'

interface SubTab {
  id: SectionKey
  label: string
}

// ─── Sub-tab groups ───
const contenidoTabs: SubTab[] = [
  { id: 'hero', label: 'Hero' },
  { id: 'manifiesto', label: 'Manifiesto' },
  { id: 'arquitectura', label: 'Arquitectura' },
  { id: 'edificio', label: 'Edificio' },
  { id: 'atrio', label: 'Atrio' },
  { id: 'amenidades', label: 'Amenidades' },
  { id: 'tipologias', label: 'Tipologías' },
  { id: 'recorridos', label: 'Recorridos 360°' },
  { id: 'galeria', label: 'Galería' },
  { id: 'inversion', label: 'Inversión' },
]

const ubicacionTabs: SubTab[] = [
  { id: 'ubicacion', label: 'Ubicación' },
]

const configuracionTabs: SubTab[] = [
  { id: 'general', label: 'General' },
  { id: 'contacto', label: 'Contacto' },
  { id: 'footer', label: 'Footer' },
  { id: 'chat', label: 'Chat IA' },
  { id: 'navigation', label: 'Navegación' },
  { id: 'seo', label: 'SEO & Social' },
]

// ─── Helper: Image upload ───
async function uploadImage(file: File, category?: string): Promise<string | null> {
  try {
    const formData = new FormData()
    formData.append('file', file)
    if (category) formData.append('category', category)
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })
    const data = await res.json()
    return data.url || null
  } catch {
    return null
  }
}

// ─── Reusable Field Components ───
function TextField({ label, value, onChange, multiline = false, placeholder = '' }: {
  label: string; value: string; onChange: (v: string) => void; multiline?: boolean; placeholder?: string
}) {
  const cls = "w-full bg-[#0A0A0A] border border-[#D8D1C8]/15 px-3 py-2.5 text-[12px] text-[#F5F1EA] font-[family-name:var(--font-inter)] focus:border-[#8B6B4B] focus:outline-none transition-colors placeholder:text-[#D8D1C8]/15 resize-none"
  return (
    <div>
      <label className="text-[10px] tracking-[0.15em] uppercase text-[#D8D1C8]/40 block mb-1.5">{label}</label>
      {multiline ? (
        <textarea value={value || ''} onChange={e => onChange(e.target.value)} className={cls} rows={3} placeholder={placeholder} />
      ) : (
        <input type="text" value={value || ''} onChange={e => onChange(e.target.value)} className={cls} placeholder={placeholder} />
      )}
    </div>
  )
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="text-[10px] tracking-[0.15em] uppercase text-[#D8D1C8]/40 block mb-1.5">{label}</label>
      <input type="number" value={value || ''} onChange={e => onChange(Number(e.target.value))} className="w-full bg-[#0A0A0A] border border-[#D8D1C8]/15 px-3 py-2.5 text-[12px] text-[#F5F1EA] font-[family-name:var(--font-inter)] focus:border-[#8B6B4B] focus:outline-none transition-colors" />
    </div>
  )
}

function ImageField({ label, value, onChange, category }: { label: string; value: string; onChange: (v: string) => void; category?: string }) {
  const [uploading, setUploading] = useState(false)
  return (
    <div>
      <label className="text-[10px] tracking-[0.15em] uppercase text-[#D8D1C8]/40 block mb-1.5">{label}</label>
      <div className="flex items-center gap-3">
        {value && (
          <div className="w-16 h-12 bg-[#0A0A0A] border border-[#D8D1C8]/10 overflow-hidden flex-shrink-0">
            <img src={value} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <input type="text" value={value || ''} onChange={e => onChange(e.target.value)} className="flex-1 bg-[#0A0A0A] border border-[#D8D1C8]/15 px-3 py-2 text-[11px] text-[#F5F1EA] focus:border-[#8B6B4B] focus:outline-none transition-colors" placeholder="/images/..." />
        <label className={`text-[9px] tracking-wider uppercase border border-[#8B6B4B]/30 text-[#8B6B4B] px-3 py-2 hover:bg-[#8B6B4B]/10 transition-colors cursor-pointer flex-shrink-0 ${uploading ? 'opacity-50' : ''}`}>
          {uploading ? '...' : 'Subir'}
          <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={async (e) => {
            const file = e.target.files?.[0]
            if (!file) return
            setUploading(true)
            const url = await uploadImage(file, category)
            if (url) onChange(url)
            setUploading(false)
          }} />
        </label>
      </div>
    </div>
  )
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-[10px] tracking-[0.15em] uppercase text-[#D8D1C8]/40 block mb-1.5">{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={value || '#8B6B4B'} onChange={e => onChange(e.target.value)} className="w-8 h-8 border border-[#D8D1C8]/10 bg-transparent cursor-pointer" />
        <input type="text" value={value || ''} onChange={e => onChange(e.target.value)} className="flex-1 bg-[#0A0A0A] border border-[#D8D1C8]/15 px-3 py-2 text-[11px] text-[#F5F1EA] focus:border-[#8B6B4B] focus:outline-none transition-colors" />
      </div>
    </div>
  )
}

// ─── Array Item Wrapper ───
function ArrayEditor<T extends Record<string, unknown>>({
  items, onChange, renderItem, addLabel, createNew
}: {
  items: T[]; onChange: (items: T[]) => void
  renderItem: (item: T, index: number, update: (idx: number, val: T) => void, remove: (idx: number) => void) => React.ReactNode
  addLabel: string; createNew: () => T
}) {
  const updateItem = (idx: number, val: T) => {
    const next = [...items]
    next[idx] = val
    onChange(next)
  }
  const removeItem = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx))
  }
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="border border-[#D8D1C8]/5 p-4 bg-[#0A0A0A]/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] tracking-[0.15em] uppercase text-[#8B6B4B]">#{i + 1}</span>
            <button onClick={() => removeItem(i)} className="text-[9px] tracking-wider uppercase text-red-400/50 hover:text-red-400 transition-colors">Eliminar</button>
          </div>
          {renderItem(item, i, updateItem, removeItem)}
        </div>
      ))}
      <button onClick={() => onChange([...items, createNew()])} className="w-full text-[10px] tracking-[0.15em] uppercase border border-dashed border-[#8B6B4B]/20 text-[#8B6B4B]/50 hover:border-[#8B6B4B]/40 hover:text-[#8B6B4B] py-3 transition-colors">
        + {addLabel}
      </button>
    </div>
  )
}

// ─── Save Button ───
function SaveButton({ onSave, saving }: { onSave: () => void; saving: boolean }) {
  return (
    <div className="flex justify-end pt-4 border-t border-[#D8D1C8]/5 mt-6">
      <button onClick={onSave} disabled={saving} className="text-[11px] tracking-[0.2em] uppercase bg-[#8B6B4B] text-[#F5F1EA] px-8 py-3 hover:bg-[#7A5C3E] transition-all duration-300 disabled:opacity-50">
        {saving ? 'Guardando...' : 'Guardar Cambios'}
      </button>
    </div>
  )
}

// ─── Main Component ───
interface SiteConfigEditorProps {
  mode: 'contenido' | 'ubicacion' | 'configuracion'
}

export default function SiteConfigEditor({ mode }: SiteConfigEditorProps) {
  const [config, setConfig] = useState<Record<string, any> | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const tabs = mode === 'contenido' ? contenidoTabs : mode === 'ubicacion' ? ubicacionTabs : configuracionTabs
  const [activeSubTab, setActiveSubTab] = useState<SectionKey | null>(tabs.length > 0 ? tabs[0].id : null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/site-config')
        const data = await res.json()
        if (!cancelled) setConfig(data)
      } catch {
        // silently fail
      }
      if (!cancelled) setLoading(false)
    }
    void load()
    return () => { cancelled = true }
  }, [])

  const saveSection = async (section: string) => {
    if (!config) return
    setSaving(true)
    try {
      const res = await fetch('/api/site-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _section: section, _data: config[section] }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Sección guardada', {
          description: `La sección "${section}" se guardó correctamente.`,
          duration: 3000,
          style: { background: '#111111', border: '1px solid #8B6B4B33', color: '#F5F1EA', fontSize: '13px' },
        })
      } else {
        toast.error('Error al guardar', {
          style: { background: '#111111', border: '1px solid #ff444433', color: '#F5F1EA', fontSize: '13px' },
        })
      }
    } catch {
      toast.error('Error de conexión', {
        style: { background: '#111111', border: '1px solid #ff444433', color: '#F5F1EA', fontSize: '13px' },
      })
    }
    setSaving(false)
  }

  const updateSection = (section: string, data: any) => {
    setConfig(prev => prev ? { ...prev, [section]: data } : null)
  }

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#8B6B4B] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      {/* Sub-tabs */}
      {tabs.length > 1 && (
        <div className="flex gap-1 overflow-x-auto mb-6 pb-2" style={{ scrollbarWidth: 'none' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`whitespace-nowrap px-4 py-2 text-[10px] tracking-[0.12em] uppercase transition-all duration-300 border ${
                activeSubTab === tab.id
                  ? 'border-[#8B6B4B] bg-[#8B6B4B]/10 text-[#8B6B4B]'
                  : 'border-[#D8D1C8]/10 text-[#D8D1C8]/30 hover:border-[#8B6B4B]/30 hover:text-[#D8D1C8]/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Section editor */}
      <AnimatePresence mode="wait">
        {activeSubTab && (
          <motion.div key={activeSubTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
            {activeSubTab === 'general' && <GeneralEditor data={config.general} onChange={(d) => updateSection('general', d)} onSave={() => void saveSection('general')} saving={saving} />}
            {activeSubTab === 'hero' && <HeroEditor data={config.hero} onChange={(d) => updateSection('hero', d)} onSave={() => void saveSection('hero')} saving={saving} />}
            {activeSubTab === 'manifiesto' && <ManifiestoEditor data={config.manifiesto} onChange={(d) => updateSection('manifiesto', d)} onSave={() => void saveSection('manifiesto')} saving={saving} />}
            {activeSubTab === 'arquitectura' && <ArquitecturaEditor data={config.arquitectura} onChange={(d) => updateSection('arquitectura', d)} onSave={() => void saveSection('arquitectura')} saving={saving} />}
            {activeSubTab === 'edificio' && <EdificioEditor data={config.edificio} onChange={(d) => updateSection('edificio', d)} onSave={() => void saveSection('edificio')} saving={saving} />}
            {activeSubTab === 'atrio' && <AtrioEditor data={config.atrio} onChange={(d) => updateSection('atrio', d)} onSave={() => void saveSection('atrio')} saving={saving} />}
            {activeSubTab === 'amenidades' && <AmenidadesEditor data={config.amenidades} onChange={(d) => updateSection('amenidades', d)} onSave={() => void saveSection('amenidades')} saving={saving} />}
            {activeSubTab === 'tipologias' && <TipologiasEditor data={config.tipologias} onChange={(d) => updateSection('tipologias', d)} onSave={() => void saveSection('tipologias')} saving={saving} />}
            {activeSubTab === 'recorridos' && <RecorridosEditor data={config.recorridos} onChange={(d) => updateSection('recorridos', d)} onSave={() => void saveSection('recorridos')} saving={saving} />}
            {activeSubTab === 'ubicacion' && <UbicacionEditor data={config.ubicacion} onChange={(d) => updateSection('ubicacion', d)} onSave={() => void saveSection('ubicacion')} saving={saving} />}
            {activeSubTab === 'galeria' && <GaleriaEditor data={config.galeria} onChange={(d) => updateSection('galeria', d)} onSave={() => void saveSection('galeria')} saving={saving} />}
            {activeSubTab === 'inversion' && <InversionEditor data={config.inversion} onChange={(d) => updateSection('inversion', d)} onSave={() => void saveSection('inversion')} saving={saving} />}
            {activeSubTab === 'contacto' && <ContactoEditor data={config.contacto} onChange={(d) => updateSection('contacto', d)} onSave={() => void saveSection('contacto')} saving={saving} />}
            {activeSubTab === 'footer' && <FooterEditor data={config.footer} onChange={(d) => updateSection('footer', d)} onSave={() => void saveSection('footer')} saving={saving} />}
            {activeSubTab === 'chat' && <ChatEditor data={config.chat} onChange={(d) => updateSection('chat', d)} onSave={() => void saveSection('chat')} saving={saving} />}
            {activeSubTab === 'navigation' && <NavigationEditor data={config.navigation} onChange={(d) => updateSection('navigation', d)} onSave={() => void saveSection('navigation')} saving={saving} />}
            {activeSubTab === 'seo' && <SeoEditor data={config.seo} onChange={(d) => updateSection('seo', d)} onSave={() => void saveSection('seo')} saving={saving} />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── GENERAL EDITOR ───
function GeneralEditor({ data, onChange, onSave, saving }: { data: any; onChange: (d: any) => void; onSave: () => void; saving: boolean }) {
  const upd = (field: string, value: any) => onChange({ ...data, [field]: value })
  return (
    <div className="space-y-4">
      <h3 className="font-[family-name:var(--font-cormorant)] text-xl text-[#F5F1EA] mb-4">General</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextField label="Nombre del Proyecto" value={data.projectName} onChange={v => upd('projectName', v)} />
        <TextField label="Eslogan" value={data.tagline} onChange={v => upd('tagline', v)} />
        <TextField label="Teléfono" value={data.phone} onChange={v => upd('phone', v)} />
        <TextField label="WhatsApp" value={data.whatsapp} onChange={v => upd('whatsapp', v)} />
        <TextField label="Email" value={data.email} onChange={v => upd('email', v)} />
        <TextField label="Dirección" value={data.address} onChange={v => upd('address', v)} />
        <TextField label="Altitud" value={data.altitude} onChange={v => upd('altitude', v)} />
      </div>
      <div className="border-t border-[#D8D1C8]/10 pt-4 mt-4">
        <p className="text-[10px] tracking-[0.15em] uppercase text-[#8B6B4B] mb-3">Integraciones</p>
        <TextField label="Google Analytics Measurement ID" value={data.gaMeasurementId || ''} onChange={v => upd('gaMeasurementId', v)} placeholder="G-XXXXXXXXXX" />
      </div>
      <ImageField label="Logo" value={data.logo} onChange={v => upd('logo', v)} category="logos" />
      <div className="grid grid-cols-2 gap-4">
        <NumberField label="Latitud" value={data.coordinates?.[0] || 0} onChange={v => onChange({ ...data, coordinates: [v, data.coordinates?.[1] || 0] })} />
        <NumberField label="Longitud" value={data.coordinates?.[1] || 0} onChange={v => onChange({ ...data, coordinates: [data.coordinates?.[0] || 0, v] })} />
      </div>
      <SaveButton onSave={onSave} saving={saving} />
    </div>
  )
}

// ─── HERO EDITOR ───
function HeroEditor({ data, onChange, onSave, saving }: { data: any; onChange: (d: any) => void; onSave: () => void; saving: boolean }) {
  const d = { ...data }
  return (
    <div className="space-y-4">
      <h3 className="font-[family-name:var(--font-cormorant)] text-xl text-[#F5F1EA] mb-4">Hero</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextField label="Subtítulo" value={d.subtitle} onChange={v => { d.subtitle = v; onChange(d) }} />
        <TextField label="Título" value={d.title} onChange={v => { d.title = v; onChange(d) }} />
        <TextField label="Título Acento" value={d.titleAccent} onChange={v => { d.titleAccent = v; onChange(d) }} />
        <TextField label="Eslogan" value={d.tagline} onChange={v => { d.tagline = v; onChange(d) }} />
        <NumberField label="Intervalo (ms)" value={d.slideInterval || 6000} onChange={v => { d.slideInterval = v; onChange(d) }} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextField label="CTA Primario - Texto" value={d.ctaPrimary?.text} onChange={v => { d.ctaPrimary = { ...d.ctaPrimary, text: v }; onChange(d) }} />
        <TextField label="CTA Primario - Link" value={d.ctaPrimary?.link} onChange={v => { d.ctaPrimary = { ...d.ctaPrimary, link: v }; onChange(d) }} />
        <TextField label="CTA Secundario - Texto" value={d.ctaSecondary?.text} onChange={v => { d.ctaSecondary = { ...d.ctaSecondary, text: v }; onChange(d) }} />
        <TextField label="CTA Secundario - Link" value={d.ctaSecondary?.link} onChange={v => { d.ctaSecondary = { ...d.ctaSecondary, link: v }; onChange(d) }} />
      </div>
      <div>
        <p className="text-[10px] tracking-[0.15em] uppercase text-[#D8D1C8]/40 mb-3">Imágenes Hero</p>
        <ArrayEditor
          items={d.images || []}
          onChange={v => { d.images = v; onChange(d) }}
          addLabel="Agregar Imagen"
          createNew={() => ({ src: '', alt: '', label: '' })}
          renderItem={(item, i, update, remove) => (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <ImageField label="Imagen" value={item.src} onChange={v => update(i, { ...item, src: v })} category="renders" />
              <TextField label="Alt" value={item.alt} onChange={v => update(i, { ...item, alt: v })} />
              <TextField label="Etiqueta" value={item.label} onChange={v => update(i, { ...item, label: v })} />
            </div>
          )}
        />
      </div>
      <SaveButton onSave={onSave} saving={saving} />
    </div>
  )
}

// ─── MANIFIESTO EDITOR ───
function ManifiestoEditor({ data, onChange, onSave, saving }: { data: any; onChange: (d: any) => void; onSave: () => void; saving: boolean }) {
  const d = { ...data }
  return (
    <div className="space-y-4">
      <h3 className="font-[family-name:var(--font-cormorant)] text-xl text-[#F5F1EA] mb-4">Manifiesto</h3>
      <TextField label="Etiqueta" value={d.label} onChange={v => { d.label = v; onChange(d) }} />
      <TextField label="Encabezado 1" value={d.heading1} onChange={v => { d.heading1 = v; onChange(d) }} />
      <TextField label="Encabezado 2 (Acento)" value={d.heading2Accent} onChange={v => { d.heading2Accent = v; onChange(d) }} />
      <TextField label="Párrafo" value={d.paragraph} onChange={v => { d.paragraph = v; onChange(d) }} multiline placeholder="Texto del manifiesto..." />
      <div>
        <p className="text-[10px] tracking-[0.15em] uppercase text-[#D8D1C8]/40 mb-3">Palabras Clave</p>
        <ArrayEditor
          items={(d.keywords || []).map((k: string) => ({ value: k }))}
          onChange={v => { d.keywords = v.map((x: { value: string }) => x.value); onChange(d) }}
          addLabel="Agregar Palabra"
          createNew={() => ({ value: '' })}
          renderItem={(item, i, update, remove) => (
            <TextField label={`Palabra ${i + 1}`} value={item.value} onChange={v => update(i, { value: v })} />
          )}
        />
      </div>
      <SaveButton onSave={onSave} saving={saving} />
    </div>
  )
}

// ─── ARQUITECTURA EDITOR ───
function ArquitecturaEditor({ data, onChange, onSave, saving }: { data: any; onChange: (d: any) => void; onSave: () => void; saving: boolean }) {
  const d = { ...data }
  return (
    <div className="space-y-4">
      <h3 className="font-[family-name:var(--font-cormorant)] text-xl text-[#F5F1EA] mb-4">Arquitectura</h3>
      <ImageField label="Imagen" value={d.image} onChange={v => { d.image = v; onChange(d) }} category="renders" />
      <TextField label="Etiqueta" value={d.label} onChange={v => { d.label = v; onChange(d) }} />
      <TextField label="Encabezado 1" value={d.heading1} onChange={v => { d.heading1 = v; onChange(d) }} />
      <TextField label="Encabezado 2 (Acento)" value={d.heading2Accent} onChange={v => { d.heading2Accent = v; onChange(d) }} />
      <TextField label="Párrafo 1" value={d.paragraph1} onChange={v => { d.paragraph1 = v; onChange(d) }} multiline />
      <TextField label="Párrafo 2" value={d.paragraph2} onChange={v => { d.paragraph2 = v; onChange(d) }} multiline />
      <div>
        <p className="text-[10px] tracking-[0.15em] uppercase text-[#D8D1C8]/40 mb-3">Estadísticas</p>
        <ArrayEditor
          items={d.stats || []}
          onChange={v => { d.stats = v; onChange(d) }}
          addLabel="Agregar Estadística"
          createNew={() => ({ number: '', label: '' })}
          renderItem={(item, i, update) => (
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Número" value={item.number} onChange={v => update(i, { ...item, number: v })} />
              <TextField label="Etiqueta" value={item.label} onChange={v => update(i, { ...item, label: v })} />
            </div>
          )}
        />
      </div>
      <SaveButton onSave={onSave} saving={saving} />
    </div>
  )
}

// ─── EDIFICIO EDITOR ───
function EdificioEditor({ data, onChange, onSave, saving }: { data: any; onChange: (d: any) => void; onSave: () => void; saving: boolean }) {
  const d = { ...data }
  return (
    <div className="space-y-4">
      <h3 className="font-[family-name:var(--font-cormorant)] text-xl text-[#F5F1EA] mb-4">Edificio</h3>
      <TextField label="Etiqueta" value={d.label} onChange={v => { d.label = v; onChange(d) }} />
      <TextField label="Título" value={d.title} onChange={v => { d.title = v; onChange(d) }} />
      <TextField label="Descripción" value={d.description} onChange={v => { d.description = v; onChange(d) }} multiline />
      
      <div>
        <p className="text-[10px] tracking-[0.15em] uppercase text-[#D8D1C8]/40 mb-3">Niveles</p>
        <ArrayEditor
          items={d.levels || []}
          onChange={v => { d.levels = v; onChange(d) }}
          addLabel="Agregar Nivel"
          createNew={() => ({ id: `nivel-${Date.now()}`, name: '', type: '', icon: '◇', description: '', features: [] as string[], image: '' })}
          renderItem={(item, i, update) => (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <TextField label="Nombre" value={item.name} onChange={v => update(i, { ...item, name: v })} />
                <TextField label="Tipo" value={item.type} onChange={v => update(i, { ...item, type: v })} />
              </div>
              <TextField label="Descripción" value={item.description} onChange={v => update(i, { ...item, description: v })} multiline />
              <ImageField label="Imagen" value={item.image} onChange={v => update(i, { ...item, image: v })} category="renders" />
              <div>
                <p className="text-[9px] tracking-[0.1em] uppercase text-[#D8D1C8]/30 mb-2">Características</p>
                <ArrayEditor
                  items={(item.features || []).map((f: string) => ({ value: f }))}
                  onChange={v => update(i, { ...item, features: v.map((x: { value: string }) => x.value) })}
                  addLabel="Agregar Característica"
                  createNew={() => ({ value: '' })}
                  renderItem={(feat, fi, fu) => (
                    <TextField label={`Característica ${fi + 1}`} value={feat.value} onChange={v => fu(fi, { value: v })} />
                  )}
                />
              </div>
            </div>
          )}
        />
      </div>

      <div>
        <p className="text-[10px] tracking-[0.15em] uppercase text-[#D8D1C8]/40 mb-3">Modos de Vista</p>
        <ArrayEditor
          items={d.viewModes || []}
          onChange={v => { d.viewModes = v; onChange(d) }}
          addLabel="Agregar Modo"
          createNew={() => ({ id: `mode-${Date.now()}`, name: '', icon: '⬒' })}
          renderItem={(item, i, update) => (
            <div className="grid grid-cols-3 gap-3">
              <TextField label="ID" value={item.id} onChange={v => update(i, { ...item, id: v })} />
              <TextField label="Nombre" value={item.name} onChange={v => update(i, { ...item, name: v })} />
              <TextField label="Icono" value={item.icon} onChange={v => update(i, { ...item, icon: v })} />
            </div>
          )}
        />
      </div>

      <div>
        <p className="text-[10px] tracking-[0.15em] uppercase text-[#D8D1C8]/40 mb-3">Estadísticas</p>
        <ArrayEditor
          items={d.stats || []}
          onChange={v => { d.stats = v; onChange(d) }}
          addLabel="Agregar Estadística"
          createNew={() => ({ label: '', value: '' })}
          renderItem={(item, i, update) => (
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Etiqueta" value={item.label} onChange={v => update(i, { ...item, label: v })} />
              <TextField label="Valor" value={item.value} onChange={v => update(i, { ...item, value: v })} />
            </div>
          )}
        />
      </div>
      <SaveButton onSave={onSave} saving={saving} />
    </div>
  )
}

// ─── ATRIO EDITOR ───
function AtrioEditor({ data, onChange, onSave, saving }: { data: any; onChange: (d: any) => void; onSave: () => void; saving: boolean }) {
  const d = { ...data }
  return (
    <div className="space-y-4">
      <h3 className="font-[family-name:var(--font-cormorant)] text-xl text-[#F5F1EA] mb-4">Atrio</h3>
      <ImageField label="Imagen Principal" value={d.image} onChange={v => { d.image = v; onChange(d) }} category="renders" />
      <TextField label="Etiqueta" value={d.label} onChange={v => { d.label = v; onChange(d) }} />
      <TextField label="Encabezado 1" value={d.heading1} onChange={v => { d.heading1 = v; onChange(d) }} />
      <TextField label="Encabezado 2 (Acento)" value={d.heading2Accent} onChange={v => { d.heading2Accent = v; onChange(d) }} />
      <TextField label="Párrafo" value={d.paragraph} onChange={v => { d.paragraph = v; onChange(d) }} multiline />
      <div className="grid grid-cols-2 gap-4">
        <TextField label="CTA Texto" value={d.ctaText} onChange={v => { d.ctaText = v; onChange(d) }} />
        <TextField label="CTA Link" value={d.ctaLink} onChange={v => { d.ctaLink = v; onChange(d) }} />
      </div>
      <div>
        <p className="text-[10px] tracking-[0.15em] uppercase text-[#D8D1C8]/40 mb-3">Tarjetas de Detalle</p>
        <ArrayEditor
          items={d.cards || []}
          onChange={v => { d.cards = v; onChange(d) }}
          addLabel="Agregar Tarjeta"
          createNew={() => ({ image: '', title: '', description: '' })}
          renderItem={(item, i, update) => (
            <div className="space-y-3">
              <ImageField label="Imagen" value={item.image} onChange={v => update(i, { ...item, image: v })} category="renders" />
              <TextField label="Título" value={item.title} onChange={v => update(i, { ...item, title: v })} />
              <TextField label="Descripción" value={item.description} onChange={v => update(i, { ...item, description: v })} multiline />
            </div>
          )}
        />
      </div>
      <SaveButton onSave={onSave} saving={saving} />
    </div>
  )
}

// ─── AMENIDADES EDITOR ───
function AmenidadesEditor({ data, onChange, onSave, saving }: { data: any; onChange: (d: any) => void; onSave: () => void; saving: boolean }) {
  const d = { ...data }
  return (
    <div className="space-y-4">
      <h3 className="font-[family-name:var(--font-cormorant)] text-xl text-[#F5F1EA] mb-4">Amenidades</h3>
      <TextField label="Etiqueta" value={d.label} onChange={v => { d.label = v; onChange(d) }} />
      <TextField label="Título" value={d.title} onChange={v => { d.title = v; onChange(d) }} />
      <div>
        <p className="text-[10px] tracking-[0.15em] uppercase text-[#D8D1C8]/40 mb-3">Items</p>
        <ArrayEditor
          items={d.items || []}
          onChange={v => { d.items = v; onChange(d) }}
          addLabel="Agregar Amenidad"
          createNew={() => ({ id: `amen-${Date.now()}`, name: '', description: '', image: '', benefits: [] as string[] })}
          renderItem={(item, i, update) => (
            <div className="space-y-3">
              <TextField label="Nombre" value={item.name} onChange={v => update(i, { ...item, name: v })} />
              <TextField label="Descripción" value={item.description} onChange={v => update(i, { ...item, description: v })} multiline />
              <ImageField label="Imagen" value={item.image} onChange={v => update(i, { ...item, image: v })} category="renders" />
              <div>
                <p className="text-[9px] tracking-[0.1em] uppercase text-[#D8D1C8]/30 mb-2">Beneficios</p>
                <ArrayEditor
                  items={(item.benefits || []).map((b: string) => ({ value: b }))}
                  onChange={v => update(i, { ...item, benefits: v.map((x: { value: string }) => x.value) })}
                  addLabel="Agregar Beneficio"
                  createNew={() => ({ value: '' })}
                  renderItem={(ben, bi, bu) => (
                    <TextField label={`Beneficio ${bi + 1}`} value={ben.value} onChange={v => bu(bi, { value: v })} />
                  )}
                />
              </div>
            </div>
          )}
        />
      </div>
      <SaveButton onSave={onSave} saving={saving} />
    </div>
  )
}

// ─── TIPOLOGIAS EDITOR ───
function TipologiasEditor({ data, onChange, onSave, saving }: { data: any; onChange: (d: any) => void; onSave: () => void; saving: boolean }) {
  const d = { ...data }
  return (
    <div className="space-y-4">
      <h3 className="font-[family-name:var(--font-cormorant)] text-xl text-[#F5F1EA] mb-4">Tipologías</h3>
      <TextField label="Etiqueta" value={d.label} onChange={v => { d.label = v; onChange(d) }} />
      <TextField label="Título" value={d.title} onChange={v => { d.title = v; onChange(d) }} />
      <div className="grid grid-cols-2 gap-4">
        <TextField label="CTA Texto" value={d.ctaText} onChange={v => { d.ctaText = v; onChange(d) }} />
        <TextField label="CTA Link" value={d.ctaLink} onChange={v => { d.ctaLink = v; onChange(d) }} />
      </div>
      <div>
        <p className="text-[10px] tracking-[0.15em] uppercase text-[#D8D1C8]/40 mb-3">Tipologías</p>
        <ArrayEditor
          items={d.items || []}
          onChange={v => { d.items = v; onChange(d) }}
          addLabel="Agregar Tipología"
          createNew={() => ({ id: `tipo-${Date.now()}`, name: '', area: '', bedrooms: '', bathrooms: '', image: '', description: '', features: [] as string[], status: 'Disponible' })}
          renderItem={(item, i, update) => (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <TextField label="Nombre" value={item.name} onChange={v => update(i, { ...item, name: v })} />
                <TextField label="Área (m²)" value={item.area} onChange={v => update(i, { ...item, area: v })} />
                <TextField label="Habitaciones" value={item.bedrooms} onChange={v => update(i, { ...item, bedrooms: v })} />
                <TextField label="Baños" value={item.bathrooms} onChange={v => update(i, { ...item, bathrooms: v })} />
              </div>
              <TextField label="Estado" value={item.status} onChange={v => update(i, { ...item, status: v })} />
              <TextField label="Descripción" value={item.description} onChange={v => update(i, { ...item, description: v })} multiline />
              <ImageField label="Imagen" value={item.image} onChange={v => update(i, { ...item, image: v })} category="renders" />
              <div>
                <p className="text-[9px] tracking-[0.1em] uppercase text-[#D8D1C8]/30 mb-2">Características</p>
                <ArrayEditor
                  items={(item.features || []).map((f: string) => ({ value: f }))}
                  onChange={v => update(i, { ...item, features: v.map((x: { value: string }) => x.value) })}
                  addLabel="Agregar Característica"
                  createNew={() => ({ value: '' })}
                  renderItem={(feat, fi, fu) => (
                    <TextField label={`Característica ${fi + 1}`} value={feat.value} onChange={v => fu(fi, { value: v })} />
                  )}
                />
              </div>
            </div>
          )}
        />
      </div>
      <SaveButton onSave={onSave} saving={saving} />
    </div>
  )
}

// ─── RECORRIDOS EDITOR ───
function RecorridosEditor({ data, onChange, onSave, saving }: { data: any; onChange: (d: any) => void; onSave: () => void; saving: boolean }) {
  const d = { ...data }
  return (
    <div className="space-y-4">
      <h3 className="font-[family-name:var(--font-cormorant)] text-xl text-[#F5F1EA] mb-4">Recorridos 360°</h3>
      <TextField label="Etiqueta" value={d.label} onChange={v => { d.label = v; onChange(d) }} />
      <TextField label="Título" value={d.title} onChange={v => { d.title = v; onChange(d) }} />
      <div>
        <p className="text-[10px] tracking-[0.15em] uppercase text-[#D8D1C8]/40 mb-3">Espacios</p>
        <ArrayEditor
          items={d.spaces || []}
          onChange={v => { d.spaces = v; onChange(d) }}
          addLabel="Agregar Espacio"
          createNew={() => ({ id: `space-${Date.now()}`, name: '', image: '', hotspots: [] as any[] })}
          renderItem={(item, i, update) => (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <TextField label="ID" value={item.id} onChange={v => update(i, { ...item, id: v })} />
                <TextField label="Nombre" value={item.name} onChange={v => update(i, { ...item, name: v })} />
              </div>
              <ImageField label="Imagen" value={item.image} onChange={v => update(i, { ...item, image: v })} category="renders" />
              <div>
                <p className="text-[9px] tracking-[0.1em] uppercase text-[#D8D1C8]/30 mb-2">Hotspots</p>
                <ArrayEditor
                  items={item.hotspots || []}
                  onChange={v => update(i, { ...item, hotspots: v })}
                  addLabel="Agregar Hotspot"
                  createNew={() => ({ id: `hs-${Date.now()}`, yaw: 0, pitch: 0, label: '', description: '', linkTo: '' })}
                  renderItem={(hs, hi, hu) => (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <TextField label="ID" value={hs.id} onChange={v => hu(hi, { ...hs, id: v })} />
                        <NumberField label="Yaw" value={hs.yaw || 0} onChange={v => hu(hi, { ...hs, yaw: v })} />
                        <NumberField label="Pitch" value={hs.pitch || 0} onChange={v => hu(hi, { ...hs, pitch: v })} />
                        <TextField label="Link To" value={hs.linkTo || ''} onChange={v => hu(hi, { ...hs, linkTo: v || undefined })} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <TextField label="Etiqueta" value={hs.label} onChange={v => hu(hi, { ...hs, label: v })} />
                        <TextField label="Descripción" value={hs.description} onChange={v => hu(hi, { ...hs, description: v })} />
                      </div>
                    </div>
                  )}
                />
              </div>
            </div>
          )}
        />
      </div>
      <SaveButton onSave={onSave} saving={saving} />
    </div>
  )
}

// ─── UBICACION EDITOR ───
function UbicacionEditor({ data, onChange, onSave, saving }: { data: any; onChange: (d: any) => void; onSave: () => void; saving: boolean }) {
  const d = { ...data }
  return (
    <div className="space-y-4">
      <h3 className="font-[family-name:var(--font-cormorant)] text-xl text-[#F5F1EA] mb-4">Ubicación</h3>
      <TextField label="Etiqueta" value={d.label} onChange={v => { d.label = v; onChange(d) }} />
      <TextField label="Título" value={d.title} onChange={v => { d.title = v; onChange(d) }} />
      <div>
        <p className="text-[10px] tracking-[0.15em] uppercase text-[#D8D1C8]/40 mb-3">Capas de Ubicación</p>
        <ArrayEditor
          items={d.layers || []}
          onChange={v => { d.layers = v; onChange(d) }}
          addLabel="Agregar Capa"
          createNew={() => ({ id: `layer-${Date.now()}`, name: '', icon: '◇', color: '#8B6B4B', points: [] as any[] })}
          renderItem={(layer, li, lu) => (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <TextField label="ID" value={layer.id} onChange={v => lu(li, { ...layer, id: v })} />
                <TextField label="Nombre" value={layer.name} onChange={v => lu(li, { ...layer, name: v })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <TextField label="Icono" value={layer.icon} onChange={v => lu(li, { ...layer, icon: v })} />
                <ColorField label="Color" value={layer.color} onChange={v => lu(li, { ...layer, color: v })} />
              </div>
              <div>
                <p className="text-[9px] tracking-[0.1em] uppercase text-[#D8D1C8]/30 mb-2">Puntos de Interés</p>
                <ArrayEditor
                  items={layer.points || []}
                  onChange={v => lu(li, { ...layer, points: v })}
                  addLabel="Agregar POI"
                  createNew={() => ({ name: '', distance: '', time: '', description: '', lat: 6.089, lng: -75.636 })}
                  renderItem={(poi, pi, pu) => (
                    <div className="space-y-2">
                      <TextField label="Nombre" value={poi.name} onChange={v => pu(pi, { ...poi, name: v })} />
                      <div className="grid grid-cols-2 gap-2">
                        <TextField label="Distancia" value={poi.distance} onChange={v => pu(pi, { ...poi, distance: v })} />
                        <TextField label="Tiempo" value={poi.time} onChange={v => pu(pi, { ...poi, time: v })} />
                      </div>
                      <TextField label="Descripción" value={poi.description} onChange={v => pu(pi, { ...poi, description: v })} />
                      <div className="grid grid-cols-2 gap-2">
                        <NumberField label="Latitud" value={poi.lat || 0} onChange={v => pu(pi, { ...poi, lat: v })} />
                        <NumberField label="Longitud" value={poi.lng || 0} onChange={v => pu(pi, { ...poi, lng: v })} />
                      </div>
                    </div>
                  )}
                />
              </div>
            </div>
          )}
        />
      </div>
      <SaveButton onSave={onSave} saving={saving} />
    </div>
  )
}

// ─── GALERIA EDITOR ───
function GaleriaEditor({ data, onChange, onSave, saving }: { data: any; onChange: (d: any) => void; onSave: () => void; saving: boolean }) {
  const d = { ...data }
  return (
    <div className="space-y-4">
      <h3 className="font-[family-name:var(--font-cormorant)] text-xl text-[#F5F1EA] mb-4">Galería</h3>
      <TextField label="Etiqueta" value={d.label} onChange={v => { d.label = v; onChange(d) }} />
      <TextField label="Título" value={d.title} onChange={v => { d.title = v; onChange(d) }} />
      <div>
        <p className="text-[10px] tracking-[0.15em] uppercase text-[#D8D1C8]/40 mb-3">Categorías</p>
        <ArrayEditor
          items={(d.categories || []).map((c: string) => ({ value: c }))}
          onChange={v => { d.categories = v.map((x: { value: string }) => x.value); onChange(d) }}
          addLabel="Agregar Categoría"
          createNew={() => ({ value: '' })}
          renderItem={(cat, ci, cu) => (
            <TextField label={`Categoría ${ci + 1}`} value={cat.value} onChange={v => cu(ci, { value: v })} />
          )}
        />
      </div>
      <div>
        <p className="text-[10px] tracking-[0.15em] uppercase text-[#D8D1C8]/40 mb-3">Items</p>
        <ArrayEditor
          items={d.items || []}
          onChange={v => { d.items = v; onChange(d) }}
          addLabel="Agregar Item"
          createNew={() => ({ id: Date.now(), category: '', src: '', title: '' })}
          renderItem={(item, i, update) => (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <TextField label="Categoría" value={item.category} onChange={v => update(i, { ...item, category: v })} />
                <TextField label="Título" value={item.title} onChange={v => update(i, { ...item, title: v })} />
              </div>
              <ImageField label="Imagen" value={item.src} onChange={v => update(i, { ...item, src: v })} category="galeria" />
            </div>
          )}
        />
      </div>
      <SaveButton onSave={onSave} saving={saving} />
    </div>
  )
}

// ─── INVERSION EDITOR ───
function InversionEditor({ data, onChange, onSave, saving }: { data: any; onChange: (d: any) => void; onSave: () => void; saving: boolean }) {
  const d = { ...data }
  return (
    <div className="space-y-4">
      <h3 className="font-[family-name:var(--font-cormorant)] text-xl text-[#F5F1EA] mb-4">Inversión</h3>
      <TextField label="Etiqueta" value={d.label} onChange={v => { d.label = v; onChange(d) }} />
      <TextField label="Título" value={d.title} onChange={v => { d.title = v; onChange(d) }} />
      <div className="grid grid-cols-2 gap-4">
        <TextField label="CTA Texto" value={d.ctaText} onChange={v => { d.ctaText = v; onChange(d) }} />
        <TextField label="CTA Link" value={d.ctaLink} onChange={v => { d.ctaLink = v; onChange(d) }} />
      </div>
      <div>
        <p className="text-[10px] tracking-[0.15em] uppercase text-[#D8D1C8]/40 mb-3">Indicadores</p>
        <ArrayEditor
          items={d.indicators || []}
          onChange={v => { d.indicators = v; onChange(d) }}
          addLabel="Agregar Indicador"
          createNew={() => ({ label: '', value: '', description: '' })}
          renderItem={(item, i, update) => (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <TextField label="Etiqueta" value={item.label} onChange={v => update(i, { ...item, label: v })} />
                <TextField label="Valor" value={item.value} onChange={v => update(i, { ...item, value: v })} />
              </div>
              <TextField label="Descripción" value={item.description} onChange={v => update(i, { ...item, description: v })} multiline />
            </div>
          )}
        />
      </div>
      <div>
        <p className="text-[10px] tracking-[0.15em] uppercase text-[#D8D1C8]/40 mb-3">Secciones</p>
        <ArrayEditor
          items={d.sections || []}
          onChange={v => { d.sections = v; onChange(d) }}
          addLabel="Agregar Sección"
          createNew={() => ({ title: '', description: '' })}
          renderItem={(item, i, update) => (
            <div className="space-y-2">
              <TextField label="Título" value={item.title} onChange={v => update(i, { ...item, title: v })} />
              <TextField label="Descripción" value={item.description} onChange={v => update(i, { ...item, description: v })} multiline />
            </div>
          )}
        />
      </div>
      <SaveButton onSave={onSave} saving={saving} />
    </div>
  )
}

// ─── CONTACTO EDITOR ───
function ContactoEditor({ data, onChange, onSave, saving }: { data: any; onChange: (d: any) => void; onSave: () => void; saving: boolean }) {
  const d = { ...data }
  return (
    <div className="space-y-4">
      <h3 className="font-[family-name:var(--font-cormorant)] text-xl text-[#F5F1EA] mb-4">Contacto</h3>
      <TextField label="Etiqueta" value={d.label} onChange={v => { d.label = v; onChange(d) }} />
      <TextField label="Título" value={d.title} onChange={v => { d.title = v; onChange(d) }} />
      <TextField label="Email de Notificaciones" value={d.notificationEmail} onChange={v => { d.notificationEmail = v; onChange(d) }} placeholder="Email donde recibir notificaciones de nuevos leads" />
      <TextField label="Introducción" value={d.intro} onChange={v => { d.intro = v; onChange(d) }} multiline />
      <TextField label="Mensaje WhatsApp" value={d.whatsappMessage} onChange={v => { d.whatsappMessage = v; onChange(d) }} />
      <div>
        <p className="text-[10px] tracking-[0.15em] uppercase text-[#D8D1C8]/40 mb-3">Métodos de Contacto</p>
        <ArrayEditor
          items={d.methods || []}
          onChange={v => { d.methods = v; onChange(d) }}
          addLabel="Agregar Método"
          createNew={() => ({ label: '', value: '', href: '', icon: 'phone' })}
          renderItem={(item, i, update) => (
            <div className="grid grid-cols-2 gap-2">
              <TextField label="Etiqueta" value={item.label} onChange={v => update(i, { ...item, label: v })} />
              <TextField label="Valor" value={item.value} onChange={v => update(i, { ...item, value: v })} />
              <TextField label="Href" value={item.href} onChange={v => update(i, { ...item, href: v })} />
              <TextField label="Icono" value={item.icon} onChange={v => update(i, { ...item, icon: v })} />
            </div>
          )}
        />
      </div>
      <div>
        <p className="text-[10px] tracking-[0.15em] uppercase text-[#D8D1C8]/40 mb-3">Horario</p>
        <ArrayEditor
          items={d.schedule || []}
          onChange={v => { d.schedule = v; onChange(d) }}
          addLabel="Agregar Horario"
          createNew={() => ({ days: '', hours: '' })}
          renderItem={(item, i, update) => (
            <div className="grid grid-cols-2 gap-2">
              <TextField label="Días" value={item.days} onChange={v => update(i, { ...item, days: v })} />
              <TextField label="Horas" value={item.hours} onChange={v => update(i, { ...item, hours: v })} />
            </div>
          )}
        />
      </div>
      <div>
        <p className="text-[10px] tracking-[0.15em] uppercase text-[#D8D1C8]/40 mb-3">Opciones de Interés</p>
        <ArrayEditor
          items={(d.interestOptions || []).map((o: string) => ({ value: o }))}
          onChange={v => { d.interestOptions = v.map((x: { value: string }) => x.value); onChange(d) }}
          addLabel="Agregar Opción"
          createNew={() => ({ value: '' })}
          renderItem={(opt, oi, ou) => (
            <TextField label={`Opción ${oi + 1}`} value={opt.value} onChange={v => ou(oi, { value: v })} />
          )}
        />
      </div>
      <SaveButton onSave={onSave} saving={saving} />
    </div>
  )
}

// ─── FOOTER EDITOR ───
function FooterEditor({ data, onChange, onSave, saving }: { data: any; onChange: (d: any) => void; onSave: () => void; saving: boolean }) {
  const d = { ...data }
  return (
    <div className="space-y-4">
      <h3 className="font-[family-name:var(--font-cormorant)] text-xl text-[#F5F1EA] mb-4">Footer</h3>
      <TextField label="Eslogan" value={d.tagline} onChange={v => { d.tagline = v; onChange(d) }} multiline />
      <TextField label="Copyright" value={d.copyright} onChange={v => { d.copyright = v; onChange(d) }} />
      <div>
        <p className="text-[10px] tracking-[0.15em] uppercase text-[#D8D1C8]/40 mb-3">Grupos de Enlaces</p>
        <ArrayEditor
          items={d.linkGroups || []}
          onChange={v => { d.linkGroups = v; onChange(d) }}
          addLabel="Agregar Grupo"
          createNew={() => ({ title: '', links: [] as { label: string; href: string }[] })}
          renderItem={(group, gi, gu) => (
            <div className="space-y-2">
              <TextField label="Título del Grupo" value={group.title} onChange={v => gu(gi, { ...group, title: v })} />
              <div>
                <p className="text-[9px] tracking-[0.1em] uppercase text-[#D8D1C8]/30 mb-2">Enlaces</p>
                <ArrayEditor
                  items={group.links || []}
                  onChange={v => gu(gi, { ...group, links: v })}
                  addLabel="Agregar Enlace"
                  createNew={() => ({ label: '', href: '' })}
                  renderItem={(link, li, lu) => (
                    <div className="grid grid-cols-2 gap-2">
                      <TextField label="Etiqueta" value={link.label} onChange={v => lu(li, { ...link, label: v })} />
                      <TextField label="Href" value={link.href} onChange={v => lu(li, { ...link, href: v })} />
                    </div>
                  )}
                />
              </div>
            </div>
          )}
        />
      </div>
      <div>
        <p className="text-[10px] tracking-[0.15em] uppercase text-[#D8D1C8]/40 mb-3">Enlaces Legales</p>
        <ArrayEditor
          items={(d.legalLinks || []).map((l: string) => ({ value: l }))}
          onChange={v => { d.legalLinks = v.map((x: { value: string }) => x.value); onChange(d) }}
          addLabel="Agregar Enlace Legal"
          createNew={() => ({ value: '' })}
          renderItem={(link, li, lu) => (
            <TextField label={`Enlace ${li + 1}`} value={link.value} onChange={v => lu(li, { value: v })} />
          )}
        />
      </div>
      <SaveButton onSave={onSave} saving={saving} />
    </div>
  )
}

// ─── CHAT EDITOR ───
function ChatEditor({ data, onChange, onSave, saving }: { data: any; onChange: (d: any) => void; onSave: () => void; saving: boolean }) {
  const d = { ...data }
  return (
    <div className="space-y-4">
      <h3 className="font-[family-name:var(--font-cormorant)] text-xl text-[#F5F1EA] mb-4">Chat IA</h3>
      <TextField label="Título" value={d.title} onChange={v => { d.title = v; onChange(d) }} />
      <TextField label="Mensaje de Bienvenida" value={d.welcomeMessage} onChange={v => { d.welcomeMessage = v; onChange(d) }} multiline />
      <div>
        <p className="text-[10px] tracking-[0.15em] uppercase text-[#D8D1C8]/40 mb-3">Preguntas Rápidas</p>
        <ArrayEditor
          items={(d.quickQuestions || []).map((q: string) => ({ value: q }))}
          onChange={v => { d.quickQuestions = v.map((x: { value: string }) => x.value); onChange(d) }}
          addLabel="Agregar Pregunta"
          createNew={() => ({ value: '' })}
          renderItem={(q, qi, qu) => (
            <TextField label={`Pregunta ${qi + 1}`} value={q.value} onChange={v => qu(qi, { value: v })} />
          )}
        />
      </div>
      <div>
        <p className="text-[10px] tracking-[0.15em] uppercase text-[#D8D1C8]/40 mb-3">Respuestas de Fallback</p>
        {Object.entries(d.fallbackResponses || {}).map(([key, val]) => (
          <div key={key} className="mb-3 p-3 border border-[#D8D1C8]/5 bg-[#0A0A0A]/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] tracking-[0.1em] uppercase text-[#8B6B4B]">{key}</span>
              <button onClick={() => {
                const next = { ...d.fallbackResponses }
                delete next[key]
                d.fallbackResponses = next
                onChange(d)
              }} className="text-[9px] text-red-400/50 hover:text-red-400">Eliminar</button>
            </div>
            <textarea value={val as string} onChange={e => {
              d.fallbackResponses = { ...d.fallbackResponses, [key]: e.target.value }
              onChange(d)
            }} className="w-full bg-[#0A0A0A] border border-[#D8D1C8]/10 px-3 py-2 text-[11px] text-[#F5F1EA] resize-none h-16 focus:border-[#8B6B4B] focus:outline-none" />
          </div>
        ))}
        <div className="flex gap-2">
          <input type="text" placeholder="Nueva clave (ej: horario)" className="flex-1 bg-[#0A0A0A] border border-[#D8D1C8]/15 px-3 py-2 text-[11px] text-[#F5F1EA] focus:border-[#8B6B4B] focus:outline-none" id="new-fallback-key" />
          <button onClick={() => {
            const input = document.getElementById('new-fallback-key') as HTMLInputElement
            const key = input?.value?.trim()
            if (key && !d.fallbackResponses?.[key]) {
              d.fallbackResponses = { ...d.fallbackResponses, [key]: '' }
              onChange(d)
              input.value = ''
            }
          }} className="text-[9px] tracking-wider uppercase border border-[#8B6B4B]/30 text-[#8B6B4B] px-4 py-2 hover:bg-[#8B6B4B]/10 transition-colors">
            Agregar
          </button>
        </div>
      </div>
      <SaveButton onSave={onSave} saving={saving} />
    </div>
  )
}

// ─── NAVIGATION EDITOR ───
function NavigationEditor({ data, onChange, onSave, saving }: { data: any; onChange: (d: any) => void; onSave: () => void; saving: boolean }) {
  const d = { ...data }
  return (
    <div className="space-y-4">
      <h3 className="font-[family-name:var(--font-cormorant)] text-xl text-[#F5F1EA] mb-4">Navegación</h3>
      <div className="grid grid-cols-2 gap-4">
        <TextField label="CTA Texto" value={d.ctaText} onChange={v => { d.ctaText = v; onChange(d) }} />
        <TextField label="CTA Link" value={d.ctaLink} onChange={v => { d.ctaLink = v; onChange(d) }} />
      </div>
      <div>
        <p className="text-[10px] tracking-[0.15em] uppercase text-[#D8D1C8]/40 mb-3">Items de Navegación</p>
        <ArrayEditor
          items={d.items || []}
          onChange={v => { d.items = v; onChange(d) }}
          addLabel="Agregar Item"
          createNew={() => ({ label: '', href: '#' })}
          renderItem={(item, i, update) => (
            <div className="grid grid-cols-2 gap-2">
              <TextField label="Etiqueta" value={item.label} onChange={v => update(i, { ...item, label: v })} />
              <TextField label="Href" value={item.href} onChange={v => update(i, { ...item, href: v })} />
            </div>
          )}
        />
      </div>
      <SaveButton onSave={onSave} saving={saving} />
    </div>
  )
}

// ─── SEO EDITOR ───
function SeoEditor({ data, onChange, onSave, saving }: { data: any; onChange: (d: any) => void; onSave: () => void; saving: boolean }) {
  const d = { ...data }
  return (
    <div className="space-y-4">
      <h3 className="font-[family-name:var(--font-cormorant)] text-xl text-[#F5F1EA] mb-4">SEO & Social</h3>
      <TextField label="Meta Title" value={d.metaTitle} onChange={v => { d.metaTitle = v; onChange(d) }} placeholder="Título que aparece en Google..." />
      <TextField label="Meta Description" value={d.metaDescription} onChange={v => { d.metaDescription = v; onChange(d) }} multiline placeholder="Descripción que aparece en los resultados de búsqueda..." />
      <ImageField label="OG Image (imagen para redes sociales)" value={d.ogImage} onChange={v => { d.ogImage = v; onChange(d) }} category="renders" />
      <div className="border-t border-[#D8D1C8]/5 pt-4 mt-4">
        <p className="text-[10px] tracking-[0.15em] uppercase text-[#8B6B4B] mb-4">Redes Sociales</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField label="Instagram" value={d.instagram} onChange={v => { d.instagram = v; onChange(d) }} placeholder="https://instagram.com/..." />
          <TextField label="Facebook" value={d.facebook} onChange={v => { d.facebook = v; onChange(d) }} placeholder="https://facebook.com/..." />
          <TextField label="LinkedIn" value={d.linkedin} onChange={v => { d.linkedin = v; onChange(d) }} placeholder="https://linkedin.com/..." />
        </div>
      </div>
      <SaveButton onSave={onSave} saving={saving} />
    </div>
  )
}
