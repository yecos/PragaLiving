#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PRAGA Living — Auditoria Completa de la Aplicacion
Genera PDF profesional con ReportLab
"""

import os, sys, hashlib
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, mm, cm
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY, TA_RIGHT
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, CondPageBreak, HRFlowable
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# ── SKILL DIR ──
PDF_SKILL_DIR = os.path.join(os.path.dirname(__file__), 'skills', 'pdf')
sys.path.insert(0, os.path.join(PDF_SKILL_DIR, 'scripts'))

# ── FONTS ──
pdfmetrics.registerFont(TTFont('LibertySerif', '/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf'))
pdfmetrics.registerFont(TTFont('LibertySans', '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans-Bold', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf'))
pdfmetrics.registerFont(TTFont('FreeSans', '/usr/share/fonts/truetype/freefont/FreeSans.ttf'))

registerFontFamily('LibertySerif', normal='LibertySerif', bold='LibertySerif')
registerFontFamily('LibertySans', normal='LibertySans', bold='LibertySans')
registerFontFamily('DejaVuSans', normal='DejaVuSans', bold='DejaVuSans-Bold')
registerFontFamily('FreeSans', normal='FreeSans', bold='FreeSans')

# ── PALETTE ──
ACCENT       = colors.HexColor('#197898')
TEXT_PRIMARY  = colors.HexColor('#232527')
TEXT_MUTED    = colors.HexColor('#7a8187')
BG_SURFACE   = colors.HexColor('#dde2e6')
BG_PAGE      = colors.HexColor('#f0f2f3')

TABLE_HEADER_COLOR = ACCENT
TABLE_HEADER_TEXT  = colors.white
TABLE_ROW_EVEN     = colors.white
TABLE_ROW_ODD      = BG_SURFACE

# Severity colors
COLOR_CRITICO = colors.HexColor('#c0392b')
COLOR_ALTO    = colors.HexColor('#d35400')
COLOR_MEDIO   = colors.HexColor('#f39c12')
COLOR_BAJO    = colors.HexColor('#27ae60')

# ── STYLES ──
BODY_FONT = 'LibertySerif'
HEADING_FONT = 'LibertySerif'

styles = getSampleStyleSheet()

style_body = ParagraphStyle(
    'AuditBody', fontName=BODY_FONT, fontSize=10.5, leading=17,
    alignment=TA_JUSTIFY, textColor=TEXT_PRIMARY, spaceAfter=6,
    firstLineIndent=0
)

style_body_left = ParagraphStyle(
    'AuditBodyLeft', parent=style_body, alignment=TA_LEFT,
)

style_h1 = ParagraphStyle(
    'AuditH1', fontName=HEADING_FONT, fontSize=20, leading=26,
    textColor=ACCENT, spaceBefore=18, spaceAfter=10,
)

style_h2 = ParagraphStyle(
    'AuditH2', fontName=HEADING_FONT, fontSize=15, leading=20,
    textColor=TEXT_PRIMARY, spaceBefore=14, spaceAfter=8,
)

style_h3 = ParagraphStyle(
    'AuditH3', fontName=HEADING_FONT, fontSize=12, leading=16,
    textColor=TEXT_PRIMARY, spaceBefore=10, spaceAfter=6,
)

style_bullet = ParagraphStyle(
    'AuditBullet', parent=style_body_left, leftIndent=24, bulletIndent=12,
    spaceAfter=4
)

style_code = ParagraphStyle(
    'AuditCode', fontName='DejaVuSans', fontSize=8.5, leading=12,
    textColor=colors.HexColor('#2c3e50'), backColor=colors.HexColor('#f4f6f7'),
    leftIndent=12, rightIndent=12, spaceBefore=4, spaceAfter=4,
    borderPadding=6
)

style_caption = ParagraphStyle(
    'AuditCaption', fontName=BODY_FONT, fontSize=9, leading=13,
    textColor=TEXT_MUTED, alignment=TA_CENTER, spaceBefore=3, spaceAfter=6,
)

style_toc_h1 = ParagraphStyle(
    'TOCH1', fontName=HEADING_FONT, fontSize=13, leftIndent=20,
    leading=22, textColor=TEXT_PRIMARY
)
style_toc_h2 = ParagraphStyle(
    'TOCH2', fontName=HEADING_FONT, fontSize=11, leftIndent=40,
    leading=18, textColor=TEXT_MUTED
)

header_cell_style = ParagraphStyle(
    'HeaderCell', fontName=BODY_FONT, fontSize=10,
    textColor=TABLE_HEADER_TEXT, alignment=TA_CENTER,
)
cell_style = ParagraphStyle(
    'TableCell', fontName=BODY_FONT, fontSize=9.5,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT, leading=13,
)
cell_center = ParagraphStyle(
    'TableCellCenter', parent=cell_style, alignment=TA_CENTER,
)

# ── PAGE DIMENSIONS ──
PAGE_W, PAGE_H = A4
MARGIN_L = 1.0 * inch
MARGIN_R = 1.0 * inch
MARGIN_T = 1.0 * inch
MARGIN_B = 1.0 * inch
AVAILABLE_W = PAGE_W - MARGIN_L - MARGIN_R

# ── TOC DOC TEMPLATE ──
class TocDocTemplate(SimpleDocTemplate):
    def afterFlowable(self, flowable):
        if hasattr(flowable, 'bookmark_name'):
            level = getattr(flowable, 'bookmark_level', 0)
            text = getattr(flowable, 'bookmark_text', '')
            key = getattr(flowable, 'bookmark_key', '')
            self.notify('TOCEntry', (level, text, self.page, key))

# ── HELPERS ──
def add_heading(text, style, level=0):
    key = 'h_%s' % hashlib.md5(text.encode()).hexdigest()[:8]
    p = Paragraph('<a name="%s"/>%s' % (key, text), style)
    p.bookmark_name = text
    p.bookmark_level = level
    p.bookmark_text = text
    p.bookmark_key = key
    return p

H1_ORPHAN_THRESHOLD = (PAGE_H - MARGIN_T - MARGIN_B) * 0.15

def add_major_section(text, style):
    return [
        CondPageBreak(H1_ORPHAN_THRESHOLD),
        add_heading(text, style, level=0),
    ]

def make_table(data, col_widths, caption=None):
    """Create a centered, styled table with optional caption."""
    t = Table(data, colWidths=col_widths, hAlign='CENTER')
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, TEXT_MUTED),
    ]
    # Alternating row colors
    for i in range(1, len(data)):
        bg = TABLE_ROW_EVEN if i % 2 == 1 else TABLE_ROW_ODD
        style_cmds.append(('BACKGROUND', (0, i), (-1, i), bg))
    t.setStyle(TableStyle(style_cmds))
    elements = [Spacer(1, 18), t]
    if caption:
        elements.append(Spacer(1, 6))
        elements.append(Paragraph(caption, style_caption))
    elements.append(Spacer(1, 18))
    return elements

def severity_badge(severity):
    color_map = {
        'CRITICO': COLOR_CRITICO,
        'ALTO': COLOR_ALTO,
        'MEDIO': COLOR_MEDIO,
        'BAJO': COLOR_BAJO,
    }
    c = color_map.get(severity, TEXT_MUTED)
    return f'<font color="{c.hexval()}">{severity}</font>'

def finding_table(findings, caption):
    """Build a table of findings with severity, title, location, description."""
    col_w = [AVAILABLE_W * r for r in [0.12, 0.25, 0.28, 0.35]]
    data = [[
        Paragraph('<b>Severidad</b>', header_cell_style),
        Paragraph('<b>Titulo</b>', header_cell_style),
        Paragraph('<b>Ubicacion</b>', header_cell_style),
        Paragraph('<b>Descripcion</b>', header_cell_style),
    ]]
    for f in findings:
        data.append([
            Paragraph(severity_badge(f['severity']), cell_center),
            Paragraph(f['title'], cell_style),
            Paragraph(f['location'], cell_style),
            Paragraph(f['description'], cell_style),
        ])
    return make_table(data, col_w, caption)

# ── BUILD DOCUMENT ──
OUTPUT = '/home/z/my-project/download/Auditoria_PRAGA_Living.pdf'

doc = TocDocTemplate(
    OUTPUT, pagesize=A4,
    leftMargin=MARGIN_L, rightMargin=MARGIN_R,
    topMargin=MARGIN_T, bottomMargin=MARGIN_B,
)

story = []

# ── TABLE OF CONTENTS ──
toc = TableOfContents()
toc.levelStyles = [style_toc_h1, style_toc_h2]

story.append(Paragraph('<b>Tabla de Contenidos</b>', style_h1))
story.append(toc)
story.append(PageBreak())

# ════════════════════════════════════════════════════════════════
# 1. RESUMEN EJECUTIVO
# ════════════════════════════════════════════════════════════════
story.extend(add_major_section('1. Resumen Ejecutivo', style_h1))

story.append(Paragraph(
    'Esta auditoria revisa de forma exhaustiva la totalidad del codigo fuente de la plataforma <b>PRAGA Living</b>, '
    'un proyecto inmobiliario premium construido con Next.js 16 (App Router), React 19, TypeScript, TailwindCSS 4, '
    'Supabase, NextAuth, Framer Motion, Three.js y jsPDF. La aplicacion sirve como pagina de aterrizaje de lujo '
    'y panel administrativo para un edificio residencial de 12 pisos en Caldas, Antioquia, Colombia.',
    style_body
))

story.append(Paragraph(
    'El analisis cubre las siguientes areas: seguridad, errores funcionales (bugs), rendimiento, calidad del codigo, '
    'experiencia de usuario y mantenibilidad. Se identificaron un total de <b>47 hallazgos</b> distribuidos en 4 niveles '
    'de severidad: 8 criticos, 12 altos, 15 medios y 12 bajos. Los hallazgos criticos se concentran en seguridad '
    '(contrasenas en texto plano, secretos expuestos, falta de proteccion CSRF) y en la arquitectura de datos '
    '(almacenamiento en memoria volatil, perdida de datos en reinicios de servidor).',
    style_body
))

# Summary table
summary_data = [
    [Paragraph('<b>Severidad</b>', header_cell_style),
     Paragraph('<b>Cantidad</b>', header_cell_style),
     Paragraph('<b>Accion Requerida</b>', header_cell_style)],
    [Paragraph(severity_badge('CRITICO'), cell_center),
     Paragraph('8', cell_center),
     Paragraph('Correccion inmediata (bloqueante para produccion)', cell_style)],
    [Paragraph(severity_badge('ALTO'), cell_center),
     Paragraph('12', cell_center),
     Paragraph('Correccion prioritaria (esta semana)', cell_style)],
    [Paragraph(severity_badge('MEDIO'), cell_center),
     Paragraph('15', cell_center),
     Paragraph('Correccion planificada (este sprint)', cell_style)],
    [Paragraph(severity_badge('BAJO'), cell_center),
     Paragraph('12', cell_center),
     Paragraph('Mejora continua (backlog)', cell_style)],
]
story.extend(make_table(summary_data, [AVAILABLE_W*0.20, AVAILABLE_W*0.15, AVAILABLE_W*0.65],
    'Tabla 1: Resumen de hallazgos por severidad'))

story.append(Paragraph(
    'Los hallazgos mas urgentes son: (1) las credenciales de administrador estan almacenadas en texto plano tanto '
    'en el codigo fuente como en la base de datos, (2) la clave de servicio (service role key) de Supabase esta '
    'expuesta en el repositorio, (3) las cotizaciones, leads y override de apartamentos se almacenan en memoria '
    'volatil y se pierden con cada reinicio del servidor, y (4) la configuracion TypeScript ignora errores de '
    'compilacion, lo que oculta bugs potenciales. A continuacion se detallan todos los hallazgos con ubicaciones '
    'exactas en el codigo y recomendaciones de correccion.',
    style_body
))

# ════════════════════════════════════════════════════════════════
# 2. HALLAZGOS CRITICOS — SEGURIDAD
# ════════════════════════════════════════════════════════════════
story.extend(add_major_section('2. Hallazgos Criticos — Seguridad', style_h1))

critical_findings = [
    {
        'severity': 'CRITICO',
        'title': 'Contrasenas en texto plano',
        'location': 'src/lib/data.ts (ADMIN_CREDENTIALS), src/lib/auth-config.ts, src/app/api/auth/[...nextauth]/route.ts',
        'description': 'Las credenciales admin (admin/praga2024) estan hardcodeadas en texto plano en el codigo fuente. '
                       'La verificacion en verifyAdmin() compara directamente password === password sin hashing. '
                       'En Supabase, la tabla admin_users almacena contrasenas en texto plano. '
                       'Solucion: usar bcrypt/argon2 para hashing y eliminar credenciales del codigo.'
    },
    {
        'severity': 'CRITICO',
        'title': 'Clave de servicio Supabase expuesta',
        'location': 'src/lib/supabase.ts (SUPABASE_SERVICE_ROLE_KEY)',
        'description': 'La service role key de Supabase (que bypassa TODAS las politicas RLS) esta referenciada como '
                       'variable de entorno pero fue compartida en el chat de desarrollo. Si se incluye en .env.local '
                       'y este se sube al repositorio, queda publica. Solucion: rotar la clave inmediatamente, '
                       'usar Vercel Environment Variables (no archivos .env), y nunca compartir service keys por chat.'
    },
    {
        'severity': 'CRITICO',
        'title': 'NEXTAUTH_SECRET con fallback debil',
        'location': 'src/app/api/auth/[...nextauth]/route.ts (linea secret)',
        'description': 'El secreto de NextAuth tiene un fallback hardcodeado: "praga-living-dev-secret-change-in-production". '
                       'Si NEXTAUTH_SECRET no esta configurado en produccion, cualquier persona que conozca este string '
                       'puede forjar tokens JWT validos. Solucion: eliminar el fallback y fallar si la variable no esta definida.'
    },
    {
        'severity': 'CRITICO',
        'title': 'Duplicacion de configuracion NextAuth',
        'location': 'src/app/api/auth/[...nextauth]/route.ts vs src/lib/auth-config.ts',
        'description': 'Existen DOS configuraciones NextAuth diferentes: una inline en el route handler y otra exportada '
                       'en auth-config.ts. Tienen diferencias: una tiene fallback en secret, la otra no. '
                       'Solucion: eliminar la configuracion inline y usar exclusivamente auth-config.ts.'
    },
    {
        'severity': 'CRITICO',
        'title': 'API admin sin verificacion de auth',
        'location': 'src/app/api/admin/route.ts',
        'description': 'El endpoint POST /api/admin acepta credenciales y las verifica, pero no requiere que el usuario '
                       'ya este autenticado via NextAuth. Cualquier visitante puede intentar fuerza bruta contra este endpoint. '
                       'Solucion: agregar rate limiting y/o requerir session NextAuth activa.'
    },
    {
        'severity': 'CRITICO',
        'title': 'Almacenamiento volatil de datos criticos',
        'location': 'src/lib/data.ts (fallbackLeads, fallbackApartmentOverrides), src/lib/quotes-store.ts (quotesStore)',
        'description': 'Las cotizaciones (quotes), leads y cambios de estado de apartamentos se almacenan en variables '
                       'en memoria (arrays/Maps). En Vercel (serverless), cada cold start reinicia estas variables, '
                       'perdiendose TODOS los datos. Incluso en el servidor local, un reinicio elimina todo. '
                       'Solucion: migrar quotes a Supabase (tabla quotes ya existe), y eliminar fallback en memoria.'
    },
    {
        'severity': 'CRITICO',
        'title': 'Sin rate limiting en endpoints API',
        'location': 'src/app/api/chat/route.ts, src/app/api/leads/route.ts, src/app/api/admin/route.ts',
        'description': 'Los endpoints POST no tienen proteccion contra abuso. El endpoint de chat puede ser usado '
                       'para consumir tokens de la API de IA sin limites. El endpoint de leads puede ser spameado. '
                       'Solucion: implementar rate limiting con upstash/redis o un middleware de throttling.'
    },
    {
        'severity': 'CRITICO',
        'title': 'API de medios expone estructura de archivos',
        'location': 'src/app/api/media/route.ts',
        'description': 'El endpoint GET /api/media lee el sistema de archivos del servidor y devuelve nombres, URLs '
                       'y tamanos de todos los archivos en public/images/. Esto expone la estructura interna del proyecto. '
                       'Solucion: agregar autenticacion al endpoint y limitar la informacion retornada.'
    },
]
story.extend(finding_table(critical_findings, 'Tabla 2: Hallazgos criticos de seguridad'))

# ════════════════════════════════════════════════════════════════
# 3. HALLAZGOS ALTOS — BUGS FUNCIONALES
# ════════════════════════════════════════════════════════════════
story.extend(add_major_section('3. Hallazgos Altos — Bugs Funcionales', style_h1))

high_findings = [
    {
        'severity': 'ALTO',
        'title': 'Imagenes duplicadas en Amenidades',
        'location': 'src/lib/data.ts (generateFallbackAmenidades)',
        'description': 'Sauna (fa-5), Bano Turco (fa-6) y Vestieres (fa-7) usan imagenes incorrectas: los dos primeros '
                       'usan /images/renders/vitality-pool.png y el ultimo usa /images/renders/coworking.png. '
                       'Solucion: asignar imagenes unicas para cada amenidad.'
    },
    {
        'severity': 'ALTO',
        'title': 'Style jsx causa warnings de hydration',
        'location': 'src/components/praga/Hero.tsx',
        'description': 'El componente Hero usa estilos JSX inline (styled-jsx) que no son compatibles con Next.js App Router y generan '
                       'warnings de hydration mismatch en cada renderizado. Solucion: migrar a TailwindCSS o CSS Modules.'
    },
    {
        'severity': 'ALTO',
        'title': 'Tooltip de PlantaInteractiva se rompe en mobile',
        'location': 'src/components/praga/PlantaInteractiva.tsx',
        'description': 'El tooltip del mapa de plantas usa posicion fija relativa al viewport, lo que causa que se '
                       'desplace fuera de la pantalla en dispositivos moviles o al hacer scroll. '
                       'Solucion: usar un panel lateral glassmorfico que reemplace el tooltip, como se recomendo anteriormente.'
    },
    {
        'severity': 'ALTO',
        'title': 'Doble instancia de PrismaClient',
        'location': 'src/lib/data.ts vs src/lib/db.ts',
        'description': 'data.ts instancia new PrismaClient() a nivel de modulo, mientras db.ts exporta otro PrismaClient '
                       'con patron singleton. No comparten la misma conexion y pueden causar pool exhaustion. '
                       'Solucion: usar exclusivamente db.ts en data.ts.'
    },
    {
        'severity': 'ALTO',
        'title': 'generateFallbackApartments() se ejecuta en cada request',
        'location': 'src/lib/data.ts (funcion getApartments)',
        'description': 'La funcion genera 110 objetos de apartamento cada vez que el fallback se activa. Esto es costoso '
                       'en CPU y memoria, especialmente en serverless. Solucion: cachear el resultado en una variable '
                       'de modulo y solo generarlo una vez.'
    },
    {
        'severity': 'ALTO',
        'title': 'Cache de disponibilidad Supabase nunca se invalida',
        'location': 'src/lib/data.ts (supabaseChecked)',
        'description': 'Una vez que supabaseChecked = true, el estado de disponibilidad se cachea por toda la vida del '
                       'proceso. Si Supabase cae temporalmente, la app no se recupera automaticamente. '
                       'Solucion: agregar TTL al cache (ej. 5 minutos) o invalidar en caso de error.'
    },
    {
        'severity': 'ALTO',
        'title': 'TypeScript ignoreBuildErrors activado',
        'location': 'next.config.ts',
        'description': 'La opcion ignoreBuildErrors: true permite que el build proceda con errores de tipo. Esto oculta '
                       'bugs reales que serian detectados en compilacion. Solucion: corregir todos los errores de tipo '
                       'y desactivar esta opcion.'
    },
    {
        'severity': 'ALTO',
        'title': 'noImplicitAny desactivado',
        'location': 'tsconfig.json',
        'description': 'La opcion noImplicitAny: false permite parametros y variables con tipo any implicito, reduciendo '
                       'drasticamente la seguridad de tipos. Solucion: activar noImplicitAny y corregir los errores resultantes.'
    },
    {
        'severity': 'ALTO',
        'title': 'reactStrictMode desactivado',
        'location': 'next.config.ts',
        'description': 'Con reactStrictMode: false se pierden las advertencias sobre efectos secundarios, dependencias '
                       'obsoletas de API y problemas de concurrencia que React StrictMode detectaria. '
                       'Solucion: activar StrictMode y corregir los warnings resultantes.'
    },
    {
        'severity': 'ALTO',
        'title': 'Sin imagen de plano para pisos 1-11',
        'location': 'src/app/api/floor-images/route.ts (fallback)',
        'description': 'Los pisos residenciales 1-11 solo tienen una imagen generica /images/planos/planta-tipo.jpg '
                       'como fallback. No existen planos arquitectonicos individuales. Solucion: proporcionar las '
                       'imagenes DWG convertidas a PNG/JPG para cada tipo de planta.'
    },
    {
        'severity': 'ALTO',
        'title': 'generateQuoteNumber() duplicado',
        'location': 'src/lib/quotes-store.ts vs src/lib/pdf-quote.ts',
        'description': 'Existen dos implementaciones diferentes de generateQuoteNumber(): una usa un contador global '
                       '(COT-2026-0001) y otra usa random (COT-202606-XXXX). Esto puede generar numeros duplicados. '
                       'Solucion: unificar en una sola implementacion.'
    },
    {
        'severity': 'ALTO',
        'title': 'Email desde dominio de prueba Resend',
        'location': 'src/lib/email.ts (from field)',
        'description': 'Los correos se envian desde onboarding@resend.dev que solo funciona en modo prueba y solo puede '
                       'enviar al email de la cuenta. En produccion, los correos a clientes reales fallaran. '
                       'Solucion: configurar dominio personalizado en Resend (pragaliving.com) y usar ventas@pragaliving.com.'
    },
]
story.extend(finding_table(high_findings, 'Tabla 3: Hallazgos altos — bugs funcionales'))

# ════════════════════════════════════════════════════════════════
# 4. HALLAZGOS MEDIOS — RENDIMIENTO
# ════════════════════════════════════════════════════════════════
story.extend(add_major_section('4. Hallazgos Medios — Rendimiento', style_h1))

story.append(Paragraph(
    'Los problemas de rendimiento identificados afectan principalmente el tiempo de carga inicial de la pagina '
    'y la eficiencia del uso de recursos en el servidor. Si bien no bloquean la funcionalidad, degradan la '
    'experiencia del usuario y aumentan los costos de hosting, especialmente en un entorno serverless como Vercel '
    'donde cada milisegundo de ejecucion se factura.',
    style_body
))

medium_perf = [
    {
        'severity': 'MEDIO',
        'title': 'Sin optimizacion de imagenes',
        'location': 'src/components/praga/Hero.tsx, Galeria.tsx, Amenidades.tsx, etc.',
        'description': 'Las imagenes se sirven directamente desde public/images/ sin usar el componente Image de Next.js. '
                       'No hay lazy loading, no hay formatos modernos (WebP/AVIF), no hay resize responsivo. '
                       'Solucion: migrar a next/image con sizes y priority apropiados.'
    },
    {
        'severity': 'MEDIO',
        'title': 'Bundle Three.js muy pesado',
        'location': 'src/components/praga/BuildingScene.tsx (966 lineas)',
        'description': 'El componente BuildingScene importa @react-three/fiber, @react-three/drei y three, anadiendo '
                       '~500KB al bundle JavaScript. Este payload se carga en la pagina principal. '
                       'Solucion: usar next/dynamic con ssr: false y loading skeleton.'
    },
    {
        'severity': 'MEDIO',
        'title': 'Sin lazy loading para componentes pesados',
        'location': 'src/app/page.tsx',
        'description': 'Recorridos360 (~973 lineas), BuildingScene (966 lineas), AdminPanel (~800+ lineas) y otros '
                       'componentes pesados se importan directamente sin next/dynamic. '
                       'Solucion: envolver en dynamic() con ssr: false donde sea posible.'
    },
    {
        'severity': 'MEDIO',
        'title': 'site-config.json leido en build time con fs.readFileSync',
        'location': 'src/app/layout.tsx',
        'description': 'El layout lee site-config.json sincronicamente con fs.readFileSync al nivel del modulo. '
                       'Esto funciona en build pero rompe si el archivo falta, y no se actualiza dinamicamente. '
                       'Solucion: usar import dinamico o mover la lectura a un contexto client-side.'
    },
    {
        'severity': 'MEDIO',
        'title': 'Sin headers de cache en respuestas API',
        'location': 'Todos los API routes',
        'description': 'Ningun endpoint API establece headers de cache (Cache-Control, ETag, etc.). Cada carga de pagina '
                       'realiza fetch fresco a /api/site-config, /api/floor-plans, /api/apartments, etc. '
                       'Solucion: agregar Cache-Control: s-maxage=60 en endpoints de lectura.'
    },
    {
        'severity': 'MEDIO',
        'title': 'Componentes monoliticos de gran tamano',
        'location': 'AdminPanel.tsx, Recorridos360.tsx, FloorPlanEditor.tsx, BuildingScene.tsx',
        'description': 'Cuatro componentes superan las 800 lineas, dificultando el mantenimiento, testing y code splitting. '
                       'Solucion: dividir en sub-componentes mas pequenos con responsabilidad unica.'
    },
    {
        'severity': 'MEDIO',
        'title': 'Lenis expuesto como variable global',
        'location': 'src/app/page.tsx (window.__lenis)',
        'description': 'La instancia de Lenis smooth scroll se expone como window.__lenis, lo que contamina el scope '
                       'global y puede causar conflictos. Solucion: usar un React Context o useRef.'
    },
]
story.extend(finding_table(medium_perf, 'Tabla 4: Hallazgos medios — rendimiento'))

# ════════════════════════════════════════════════════════════════
# 5. HALLAZGOS MEDIOS — CALIDAD DE CODIGO
# ════════════════════════════════════════════════════════════════
story.extend(add_major_section('5. Hallazgos Medios — Calidad de Codigo', style_h1))

story.append(Paragraph(
    'Los problemas de calidad del codigo afectan la mantenibilidad a largo plazo del proyecto. Si bien no causan '
    'fallos inmediatos, incrementan la deuda tecnica y dificultan la incorporacion de nuevos desarrolladores al equipo. '
    'La ausencia total de tests automatizados es el hallazgo mas preocupante en esta categoria.',
    style_body
))

medium_code = [
    {
        'severity': 'MEDIO',
        'title': 'Patron triple fallback repetido en todas las funciones',
        'location': 'src/lib/data.ts (cada funcion exportada)',
        'description': 'Cada funcion repite el mismo patron Supabase > Prisma > Fallback con try/catch anidados. '
                       'Esto genera ~500 lineas de codigo repetitivo. Solucion: crear una utilidad generica '
                       'withFallback<T>(supabaseFn, prismaFn, fallbackFn) que encapsule el patron.'
    },
    {
        'severity': 'MEDIO',
        'title': 'Catch blocks vacios sin logging',
        'location': 'src/lib/data.ts, todos los API routes',
        'description': 'Todos los bloques catch usan catch {} o catch { // fall through } sin registrar el error. '
                       'Esto hace imposible diagnosticar problemas en produccion. Solucion: agregar console.error '
                       'o un sistema de logging estructurado en cada catch.'
    },
    {
        'severity': 'MEDIO',
        'title': 'Numeros magicos sin explicacion',
        'location': 'src/lib/data.ts (precios, indices sold/reserved)',
        'description': 'Los precios base ($120M, $230M, $310M), premios por piso ($3M, $5M, $8M) e indices de '
                       'apartamentos vendidos/reservados estan hardcodeados sin comentarios. Solucion: extraer '
                       'a constantes nombradas y agregar comentarios explicativos.'
    },
    {
        'severity': 'MEDIO',
        'title': 'Sin interfaces TypeScript para respuestas API',
        'location': 'Todos los API routes',
        'description': 'Las respuestas de la API son objetos planos sin tipado. Los componentes clientes consumen '
                       'datos como any. Solucion: definir interfaces compartidas en src/types/ y usarlas en ambas capas.'
    },
    {
        'severity': 'MEDIO',
        'title': 'Cero cobertura de tests',
        'location': 'Todo el proyecto',
        'description': 'No existe ningun archivo de test. No hay tests unitarios, de integracion ni e2e. Cualquier '
                       'cambio puede romper funcionalidad existente sin deteccion. Solucion: agregar Vitest + Playwright '
                       'y crear tests criticos para data.ts, API routes y flujos de usuario principales.'
    },
    {
        'severity': 'MEDIO',
        'title': 'Sin migraciones Prisma (solo db push)',
        'location': 'package.json, prisma/',
        'description': 'El proyecto usa prisma db push en lugar de migrate. Esto es adecuado para prototipos pero '
                       'peligroso en produccion: no hay historial de cambios, no hay rollbacks. '
                       'Solucion: adoptar prisma migrate dev y mantener un directorio de migraciones.'
    },
    {
        'severity': 'MEDIO',
        'title': 'Dependencias potencialmente no utilizadas',
        'location': 'package.json',
        'description': 'Paquetes como @mdxeditor/editor, @reactuses/core, react-markdown, react-syntax-highlighter, '
                       'sharp pueden no estar en uso activo. Cada dependencia incrementa el bundle y la superficie '
                       'de ataque. Solucion: auditar con depcheck y eliminar las no utilizadas.'
    },
    {
        'severity': 'MEDIO',
        'title': 'Tailwind content paths incorrectos',
        'location': 'tailwind.config.ts',
        'description': 'Las rutas de content referencian ./components/ y ./pages/ pero el codigo esta en ./src/components/ '
                       'y ./src/app/. Tailwind v4 con @import "tailwindcss" auto-detecta, pero las rutas explicitas '
                       'son incorrectas. Solucion: corregir las rutas a ./src/**/*.{js,ts,jsx,tsx,mdx}.'
    },
]
story.extend(finding_table(medium_code, 'Tabla 5: Hallazgos medios — calidad de codigo'))

# ════════════════════════════════════════════════════════════════
# 6. HALLAZGOS BAJOS — UX Y MEJORAS
# ════════════════════════════════════════════════════════════════
story.extend(add_major_section('6. Hallazgos Bajos — UX y Mejoras', style_h1))

story.append(Paragraph(
    'Los hallazgos de severidad baja representan oportunidades de mejora que no afectan la funcionalidad core '
    'pero que incrementarian la calidad percibida de la plataforma, mejorarian el SEO y la accesibilidad, '
    'y proporcionarian una experiencia mas pulida para los usuarios finales.',
    style_body
))

low_ux = [
    {
        'severity': 'BAJO',
        'title': 'Numero de WhatsApp placeholder',
        'location': 'src/app/api/chat/route.ts, src/components/praga/WhatsAppButton.tsx',
        'description': 'El chat IA referencia +57 300 123 4567 y la ficha PDF usa +57 601 234 5678. Ambos son '
                       'numeros de prueba. Solucion: unificar con el numero real del proyecto.'
    },
    {
        'severity': 'BAJO',
        'title': 'Inconsistencia en datos de contacto',
        'location': 'Multiples archivos (chat, ficha, PDF cotizacion, email template)',
        'description': 'Diferentes componentes usan diferentes numeros de telefono y emails: info@pragaliving.com, '
                       'ventas@pragaliving.com, +57 604 444 0000, +57 601 234 5678. Solucion: centralizar en site-config.'
    },
    {
        'severity': 'BAJO',
        'title': 'Sin pagina 404 personalizada',
        'location': 'src/app/ (falta not-found.tsx)',
        'description': 'No existe una pagina 404 con el branding PRAGA. Los usuarios que navegan a URLs inexistentes '
                       'ven la pagina generica de Next.js. Solucion: crear src/app/not-found.tsx con diseno PRAGA.'
    },
    {
        'severity': 'BAJO',
        'title': 'SEO incompleto',
        'location': 'src/app/layout.tsx, falta sitemap/robots',
        'description': 'Faltan: OpenGraph images, datos estructurados (JSON-LD para RealEstateListing), sitemap.xml, '
                       'robots.txt. Solucion: agregar generateMetadata dinamico y archivos estaticos.'
    },
    {
        'severity': 'BAJO',
        'title': 'Accesibilidad limitada en componentes 3D/360',
        'location': 'src/components/praga/BuildingScene.tsx, Recorridos360.tsx',
        'description': 'El canvas de Three.js y el visor 360 no son accesibles para lectores de pantalla ni navegacion '
                       'por teclado. Solucion: agregar aria-labels, descripciones alternativas y controles por teclado.'
    },
    {
        'severity': 'BAJO',
        'title': 'Sin soporte PWA',
        'location': 'Raiz del proyecto',
        'description': 'No existen manifest.json ni service worker. En un contexto inmobiliario donde los usuarios '
                       'pueden querer acceso offline a las fichas. Solucion: agregar next-pwa con manifest basico.'
    },
    {
        'severity': 'BAJO',
        'title': 'Respuesta fallback del chat IA generica',
        'location': 'src/app/api/chat/route.ts',
        'description': 'Cuando la API de IA falla, solo hay una respuesta fallback generica. No se provee informacion '
                       'util al usuario. Solucion: agregar respuestas contextuales por tema (tipologias, precios, ubicacion).'
    },
    {
        'severity': 'BAJO',
        'title': 'Falta de estados de carga en algunos componentes',
        'location': 'src/components/praga/PlantaInteractiva.tsx, Galeria.tsx',
        'description': 'Algunos componentes no muestran indicador de carga mientras obtienen datos, causando parpadeos. '
                       'Solucion: agregar Skeleton loaders o spinners durante las peticiones.'
    },
    {
        'severity': 'BAJO',
        'title': 'Google Analytics sin Measurement ID',
        'location': 'src/components/praga/GoogleAnalytics.tsx',
        'description': 'El componente GA4 esta implementado pero NEXT_PUBLIC_GA_MEASUREMENT_ID no esta configurado. '
                       'Solucion: obtener el ID de GA4 y configurar en Vercel Environment Variables.'
    },
    {
        'severity': 'BAJO',
        'title': 'Mezcla de idiomas en el codigo',
        'location': 'Todo el proyecto',
        'description': 'Los comentarios y nombres de variables mezclan espanol e ingles sin consistencia (ej. "fallback" '
                       'vs "repuesto", "lead" vs "prospecto"). Solucion: adoptar ingles para codigo y espanol para UI.'
    },
    {
        'severity': 'BAJO',
        'title': 'Link en email template apunta a localhost',
        'location': 'src/lib/email.ts (href en template HTML)',
        'description': 'El boton "Ver en Admin" en el email de nuevo lead apunta a http://localhost:3000/admin. '
                       'En produccion, este link no funcionara. Solucion: usar variable de entorno NEXT_PUBLIC_URL.'
    },
    {
        'severity': 'BAJO',
        'title': 'Sin favicon SVG optimizado',
        'location': 'public/favicon.png',
        'description': 'El favicon es un PNG en lugar de SVG. Los favicons SVG son mas pequenos, escalables y '
                       'soportan modo oscuro. Solucion: convertir a SVG con tema PRAGA.'
    },
]
story.extend(finding_table(low_ux, 'Tabla 6: Hallazgos bajos — UX y mejoras'))

# ════════════════════════════════════════════════════════════════
# 7. ANALISIS DE ARQUITECTURA
# ════════════════════════════════════════════════════════════════
story.extend(add_major_section('7. Analisis de Arquitectura', style_h1))

story.append(Paragraph(
    'La arquitectura de PRAGA Living sigue un patron de triple fallback (Supabase > Prisma/SQLite > Hardcoded) que '
    'garantiza disponibilidad pero introduce complejidad significativa. Este patron se repite en cada funcion de '
    'datos sin abstraccion, resultando en codigo duplicado y dificil de mantener. A continuacion se analiza la '
    'arquitectura por capas, identificando fortalezas y debilidades de cada una.',
    style_body
))

story.append(add_heading('7.1 Capa de Datos', style_h2))

story.append(Paragraph(
    'La capa de datos centralizada en <b>src/lib/data.ts</b> (782 lineas) es el nucleo de la aplicacion. Su diseno '
    'de triple fallback proporciona resiliencia: si Supabase no esta disponible, intenta Prisma; si Prisma falla, '
    'usa datos hardcodeados. Sin embargo, esta resiliencia tiene un costo alto: el codigo es repetitivo (~500 lineas '
    'de patron repetido), los datos en memoria se pierden entre reinicios, y la logica de negocio esta acoplada a la '
    'logica de resiliencia. La funcion generateFallbackApartments() se ejecuta en cada request al fallback, creando '
    '110 objetos cada vez sin cacheo. Ademas, el cache de disponibilidad de Supabase (supabaseChecked) nunca se '
    'invalida, lo que puede dejar la app en un estado inconsistente si Supabase cambia de estado.',
    style_body
))

story.append(Paragraph(
    '<b>Recomendacion:</b> Refactorizar data.ts con un patron de repositorio que encapsule la logica de fallback '
    'en una clase generica, cachear los datos fallback en una variable de modulo, y agregar TTL al cache de '
    'disponibilidad de Supabase. Migrar quotes y leads a Supabase como fuente primaria, eliminando los stores '
    'en memoria.',
    style_body
))

story.append(add_heading('7.2 Capa de Autenticacion', style_h2))

story.append(Paragraph(
    'La autenticacion tiene dos implementaciones paralelas: <b>src/lib/auth-config.ts</b> (exporta authOptions) y '
    '<b>src/app/api/auth/[...nextauth]/route.ts</b> (define su propio handler inline). Ambas usan el proveedor '
    'Credentials de NextAuth v4 con estrategia JWT. El problema principal es que las contrasenas se almacenan y '
    'comparan en texto plano, sin hashing. Ademas, el fallback a credenciales hardcodeadas significa que incluso '
    'si se compromete Supabase, las credenciales de emergencia estan en el codigo fuente accesible. El middleware '
    'protege /admin/* con withAuth, pero los API endpoints no verifican session, permitiendo acceso no autenticado.',
    style_body
))

story.append(Paragraph(
    '<b>Recomendacion:</b> Unificar en auth-config.ts, implementar hashing con bcrypt, agregar verificacion de '
    'session en API endpoints sensibles, y eliminar credenciales hardcodeadas en favor de variables de entorno '
    'con valores generados aleatoriamente.',
    style_body
))

story.append(add_heading('7.3 Capa de Presentacion', style_h2))

story.append(Paragraph(
    'La capa de presentacion utiliza un diseno de Single Page Application con scroll suave (Lenis), animaciones '
    'ricas (Framer Motion) y un modelo 3D interactivo (Three.js/R3F). Los componentes estan bien separados por '
    'seccion de la landing page, pero algunos son excesivamente grandes (AdminPanel ~800+, Recorridos360 ~973+, '
    'FloorPlanEditor ~992+ lineas). La carga de datos se centraliza en el hook useSiteConfig que consulta /api/site-config '
    'en cada montaje de componente, sin cache ni deduplicacion de peticiones. Esto genera multiples requests '
    'identicos en la carga inicial.',
    style_body
))

story.append(Paragraph(
    '<b>Recomendacion:</b> Implementar React Query o SWR para cache y deduplicacion de peticiones, dividir '
    'componentes grandes en sub-componentes, y usar next/dynamic para componentes pesados como BuildingScene '
    'y Recorridos360.',
    style_body
))

# ════════════════════════════════════════════════════════════════
# 8. PLAN DE ACCION PRIORIZADO
# ════════════════════════════════════════════════════════════════
story.extend(add_major_section('8. Plan de Accion Priorizado', style_h1))

story.append(Paragraph(
    'A continuacion se presenta un plan de accion organizado por sprints de una semana, priorizando los hallazgos '
    'criticos y altos en los primeros dos sprints. Cada tarea incluye estimacion de esfuerzo y dependencias.',
    style_body
))

sprint_data = [
    [Paragraph('<b>Sprint</b>', header_cell_style),
     Paragraph('<b>Tarea</b>', header_cell_style),
     Paragraph('<b>Esfuerzo</b>', header_cell_style),
     Paragraph('<b>Prioridad</b>', header_cell_style)],
    [Paragraph('1', cell_center),
     Paragraph('Hashear contrasenas con bcrypt, eliminar credenciales hardcodeadas', cell_style),
     Paragraph('4h', cell_center),
     Paragraph(severity_badge('CRITICO'), cell_center)],
    [Paragraph('1', cell_center),
     Paragraph('Rotar service role key Supabase, configurar en Vercel Env Vars', cell_style),
     Paragraph('1h', cell_center),
     Paragraph(severity_badge('CRITICO'), cell_center)],
    [Paragraph('1', cell_center),
     Paragraph('Eliminar fallback NEXTAUTH_SECRET, fallar si no esta definido', cell_style),
     Paragraph('1h', cell_center),
     Paragraph(severity_badge('CRITICO'), cell_center)],
    [Paragraph('1', cell_center),
     Paragraph('Unificar NextAuth en auth-config.ts, eliminar handler inline', cell_style),
     Paragraph('2h', cell_center),
     Paragraph(severity_badge('CRITICO'), cell_center)],
    [Paragraph('1', cell_center),
     Paragraph('Migrar quotes y leads a Supabase, eliminar stores en memoria', cell_style),
     Paragraph('6h', cell_center),
     Paragraph(severity_badge('CRITICO'), cell_center)],
    [Paragraph('2', cell_center),
     Paragraph('Agregar rate limiting a endpoints API (chat, leads, admin)', cell_style),
     Paragraph('4h', cell_center),
     Paragraph(severity_badge('CRITICO'), cell_center)],
    [Paragraph('2', cell_center),
     Paragraph('Proteger API admin con verificacion de session NextAuth', cell_style),
     Paragraph('2h', cell_center),
     Paragraph(severity_badge('CRITICO'), cell_center)],
    [Paragraph('2', cell_center),
     Paragraph('Corregir imagenes duplicadas en Amenidades', cell_style),
     Paragraph('1h', cell_center),
     Paragraph(severity_badge('ALTO'), cell_center)],
    [Paragraph('2', cell_center),
     Paragraph('Eliminar style jsx en Hero.tsx, migrar a TailwindCSS', cell_style),
     Paragraph('2h', cell_center),
     Paragraph(severity_badge('ALTO'), cell_center)],
    [Paragraph('2', cell_center),
     Paragraph('Reemplazar tooltip en PlantaInteractiva con panel lateral', cell_style),
     Paragraph('3h', cell_center),
     Paragraph(severity_badge('ALTO'), cell_center)],
    [Paragraph('3', cell_center),
     Paragraph('Unificar PrismaClient usando db.ts, eliminar instancia en data.ts', cell_style),
     Paragraph('1h', cell_center),
     Paragraph(severity_badge('ALTO'), cell_center)],
    [Paragraph('3', cell_center),
     Paragraph('Activar ignoreBuildErrors: false y corregir errores de tipo', cell_style),
     Paragraph('4h', cell_center),
     Paragraph(severity_badge('ALTO'), cell_center)],
    [Paragraph('3', cell_center),
     Paragraph('Cachear generateFallbackApartments(), agregar TTL a supabaseChecked', cell_style),
     Paragraph('2h', cell_center),
     Paragraph(severity_badge('ALTO'), cell_center)],
    [Paragraph('3', cell_center),
     Paragraph('Unificar generateQuoteNumber() en un solo archivo', cell_style),
     Paragraph('1h', cell_center),
     Paragraph(severity_badge('ALTO'), cell_center)],
    [Paragraph('4', cell_center),
     Paragraph('Migrar imagenes a next/image con lazy loading y WebP', cell_style),
     Paragraph('6h', cell_center),
     Paragraph(severity_badge('MEDIO'), cell_center)],
    [Paragraph('4', cell_center),
     Paragraph('Lazy loading con next/dynamic para Three.js, Recorridos360', cell_style),
     Paragraph('2h', cell_center),
     Paragraph(severity_badge('MEDIO'), cell_center)],
    [Paragraph('4', cell_center),
     Paragraph('Refactorizar data.ts: patron generico withFallback', cell_style),
     Paragraph('4h', cell_center),
     Paragraph(severity_badge('MEDIO'), cell_center)],
    [Paragraph('5', cell_center),
     Paragraph('Agregar logging en catch blocks, crear src/types/ compartido', cell_style),
     Paragraph('3h', cell_center),
     Paragraph(severity_badge('MEDIO'), cell_center)],
    [Paragraph('5', cell_center),
     Paragraph('Configurar Vitest + tests unitarios para data.ts', cell_style),
     Paragraph('6h', cell_center),
     Paragraph(severity_badge('MEDIO'), cell_center)],
    [Paragraph('5', cell_center),
     Paragraph('SEO: sitemap.xml, robots.txt, JSON-LD, OpenGraph images', cell_style),
     Paragraph('4h', cell_center),
     Paragraph(severity_badge('BAJO'), cell_center)],
]

sprint_col_w = [AVAILABLE_W * 0.08, AVAILABLE_W * 0.52, AVAILABLE_W * 0.12, AVAILABLE_W * 0.28]
story.extend(make_table(sprint_data, sprint_col_w, 'Tabla 7: Plan de accion por sprints'))

# ════════════════════════════════════════════════════════════════
# 9. DEPENDENCIAS Y SUPERFICIE DE ATAQUE
# ════════════════════════════════════════════════════════════════
story.extend(add_major_section('9. Dependencias y Superficie de Ataque', style_h1))

story.append(Paragraph(
    'El proyecto tiene 45+ dependencias directas en package.json, muchas de las cuales pueden no ser necesarias. '
    'Cada dependencia incrementa la superficie de ataque y el tamano del bundle. A continuacion se listan las '
    'dependencias que requieren atencion, clasificadas por riesgo.',
    style_body
))

dep_data = [
    [Paragraph('<b>Paquete</b>', header_cell_style),
     Paragraph('<b>Riesgo</b>', header_cell_style),
     Paragraph('<b>Razon</b>', header_cell_style)],
    [Paragraph('@prisma/client', cell_style),
     Paragraph(severity_badge('MEDIO'), cell_center),
     Paragraph('Posiblemente innecesario si Supabase es la fuente primaria. Prisma agrega ~30MB al bundle.', cell_style)],
    [Paragraph('@mdxeditor/editor', cell_style),
     Paragraph(severity_badge('MEDIO'), cell_center),
     Paragraph('No se detecta uso activo. Editor MDX pesado que incrementa significativamente el bundle.', cell_style)],
    [Paragraph('react-syntax-highlighter', cell_style),
     Paragraph(severity_badge('BAJO'), cell_center),
     Paragraph('No se detecta uso activo. Si se necesita highlight de codigo, usar Prism ligero.', cell_style)],
    [Paragraph('sharp', cell_style),
     Paragraph(severity_badge('BAJO'), cell_center),
     Paragraph('Procesamiento de imagenes en servidor. Next.js ya incluye sharp internamente.', cell_style)],
    [Paragraph('html2canvas', cell_style),
     Paragraph(severity_badge('BAJO'), cell_center),
     Paragraph('Uso limitado. Considerar reemplazar con la API nativa de Canvas del navegador.', cell_style)],
    [Paragraph('z-ai-web-dev-sdk', cell_style),
     Paragraph(severity_badge('MEDIO'), cell_center),
     Paragraph('Usado solo en /api/chat. Deberia estar en devDependencies si es solo para servidor.', cell_style)],
]
dep_col_w = [AVAILABLE_W * 0.25, AVAILABLE_W * 0.15, AVAILABLE_W * 0.60]
story.extend(make_table(dep_data, dep_col_w, 'Tabla 8: Dependencias con riesgo potencial'))

# ════════════════════════════════════════════════════════════════
# 10. CONCLUSION
# ════════════════════════════════════════════════════════════════
story.extend(add_major_section('10. Conclusion', style_h1))

story.append(Paragraph(
    'PRAGA Living es una plataforma inmobiliaria con un diseno visual excepcional y una experiencia de usuario '
    'sofisticada. El nivel de detalle en las animaciones, el modelo 3D interactivo y los recorridos 360 grados '
    'elevan la presentacion del proyecto por encima de los estandares del sector. Sin embargo, la solidez visual '
    'contrasta con debilidades estructurales significativas en seguridad, persistencia de datos y calidad del codigo.',
    style_body
))

story.append(Paragraph(
    'Los <b>8 hallazgos criticos</b> requieren atencion inmediata, especialmente los relacionados con seguridad '
    '(contrasenas en texto plano, secretos expuestos) y persistencia de datos (stores en memoria volatil). Estos '
    'problemas no son teoricos: representan riesgos reales que podrian resultar en perdida de datos de clientes, '
    'acceso no autorizado al panel administrativo, o comprometimiento de la base de datos Supabase.',
    style_body
))

story.append(Paragraph(
    'Los <b>12 hallazgos altos</b> representan bugs funcionales y problemas de configuracion que afectan la '
    'confiabilidad de la plataforma: imagenes incorrectas en amenidades, warnings de hydration, tooltips rotos '
    'en mobile, y errores de TypeScript ocultos por ignoreBuildErrors. Estos deben resolverse en los proximos '
    'dos sprints para garantizar una experiencia consistente.',
    style_body
))

story.append(Paragraph(
    'La arquitectura de triple fallback es una solucion pragmatica para garantizar disponibilidad, pero su '
    'implementacion actual es costosa en terminos de mantenimiento y oculta problemas reales (datos que se pierden, '
    'errores silenciados). La refactorizacion sugerida en el plan de accion reducira la complejidad y mejorara '
    'la observabilidad del sistema. Con las correcciones propuestas en los primeros 3 sprints, PRAGA Living '
    'estara en condiciones de operar de forma segura y confiable en produccion.',
    style_body
))

# ── BUILD ──
doc.multiBuild(story)
print(f'PDF generado: {OUTPUT}')
