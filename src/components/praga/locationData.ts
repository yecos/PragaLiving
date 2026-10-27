// ─── Types ───────────────────────────────────────────────
export interface POIPoint {
  name: string
  distance?: string
  time?: string
  description: string
  address?: string
  phone?: string
  lat: number
  lng: number
}

export interface LocationLayer {
  id: string
  name: string
  icon: string
  color: string
  points: POIPoint[]
}

// ─── PRAGA center (Caldas, Antioquia) ─────────────────
export const DEFAULT_PRAGA_CENTER: [number, number] = [6.08895, -75.63514]

// Coordinates published in the business listing, checked 2026-10-27:
// https://www.aiyellow.com/optikalejandria/
// Its Google Maps directions link uses destination=6.091295300000001,-75.6375736.
export const OPTIKALEJANDRIA: POIPoint = {
  name: 'Optikalejandría S.A.S',
  description: 'Óptica en Caldas, Antioquia.',
  address: 'Cra 52 #130 Sur-40, Caldas, Antioquia',
  phone: '302 373 1382',
  lat: 6.0912953,
  lng: -75.6375736,
}

// ─── Layer definitions with real Caldas, Antioquia POIs ──────
export const locationLayers: LocationLayer[] = [
  {
    id: 'movilidad',
    name: 'Movilidad',
    icon: '→',
    color: '#6B8FB5',
    points: [
      { name: 'Parada Bus Urbano', distance: '84m', time: '1 min', description: 'Parada de rutas urbanas con conexión al centro de Caldas y municipios cercanos', lat: 6.08975, lng: -75.63610 },
      { name: 'Parada Rutas Veredales', distance: '120m', time: '2 min', description: 'Conexión con rutas veredales y transporte rural de la zona sur del Valle de Aburrá', lat: 6.09007, lng: -75.63607 },
      { name: 'Estación La Estrella (Metro)', distance: '7.2 km', time: '25 min en vehículo', description: 'Estación del Metro de Medellín Línea A, accesible mediante conexión vial o transporte público por Carrera 50', lat: 6.15278, lng: -75.62633 },
    ]
  },
  {
    id: 'gastronomia',
    name: 'Gastronomía',
    icon: '◆',
    color: '#B56B8F',
    points: [
      { name: 'Zona Gastronómica Caldas', distance: '200m', time: '3 min', description: 'Concentración de restaurantes típicos antioqueños y cafés en el centro de Caldas', lat: 6.09080, lng: -75.63650 },
      { name: 'Café Especialidad', distance: '150m', time: '2 min', description: 'Café de especialidad y repostería artesanal en el parque principal', lat: 6.09100, lng: -75.63500 },
      { name: 'Pasaje Alejandrino', distance: '242m', time: '3 min', description: 'Pasaje gastronómico con variedad de opciones locales y internacionales', lat: 6.09066, lng: -75.63650 },
    ]
  },
  {
    id: 'comercio',
    name: 'Comercio',
    icon: '□',
    color: '#8B6B4B',
    points: [
      OPTIKALEJANDRIA,
      { name: 'San Gabriel', distance: '201m', time: '3 min', description: 'Centro comercial local con supermercado, farmacia y tiendas de servicios', lat: 6.09051, lng: -75.63662 },
      { name: 'Bancolombia', distance: '273m', time: '4 min', description: 'Sucursal bancaria con servicios completos y cajero 24h', lat: 6.09138, lng: -75.63549 },
      { name: 'Locería Colombiana', distance: '500m', time: '7 min', description: 'Fábrica histórica de Corona con outlet de cerámica y materiales', lat: 6.09200, lng: -75.63800 },
    ]
  },
  {
    id: 'educacion',
    name: 'Educación',
    icon: '△',
    color: '#6B8F6B',
    points: [
      { name: 'IE María Auxiliadora', distance: '152m', time: '2 min', description: 'Institución educativa de prestigio con programas de preescolar a media técnica', lat: 6.09024, lng: -75.63559 },
      { name: 'Colegio Tercer Milenio', distance: '288m', time: '4 min', description: 'Colegio privado con currículo bilingüe y énfasis en tecnología', lat: 6.09110, lng: -75.63753 },
      { name: 'IE Ciencias Aplicadas', distance: '390m', time: '5 min', description: 'Institución técnica con programas de formación profesional', lat: 6.09249, lng: -75.63563 },
    ]
  },
  {
    id: 'salud',
    name: 'Salud',
    icon: '○',
    color: '#6BB5A0',
    points: [
      { name: 'Policlínico Sur', distance: '145m', time: '2 min', description: 'Clínica médica con consultas especializadas y servicios de urgencias', lat: 6.09002, lng: -75.63439 },
      { name: 'Hospital San Vicente de Paúl', distance: '540m', time: '7 min', description: 'Hospital principal de Caldas con servicios de alta complejidad', lat: 6.08720, lng: -75.63620 },
      { name: 'Cruz Verde Farmacia', distance: '134m', time: '2 min', description: 'Farmacia chain con servicio de entrega a domicilio', lat: 6.08972, lng: -75.63607 },
    ]
  },
  {
    id: 'naturaleza',
    name: 'Naturaleza',
    icon: '◇',
    color: '#4B5646',
    points: [
      { name: 'Parque El Carrusel', distance: '201m', time: '3 min', description: 'Parque urbano con glorieta, zonas verdes y senderos peatonales', lat: 6.08978, lng: -75.63676 },
      { name: 'Parque de la Locería', distance: '488m', time: '6 min', description: 'Parque histórico recientemente renovado con áreas deportivas y culturales', lat: 6.09162, lng: -75.63865 },
      { name: 'Parque Santander', distance: '400m', time: '5 min', description: 'Parque principal del centro de Caldas frente a la Alcaldía', lat: 6.09200, lng: -75.63700 },
    ]
  },
]

function isOptikalejandria(point: POIPoint): boolean {
  return point.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes('optikalejandria')
}

// Keep CMS layers and POIs, while also supporting older CMS snapshots without the business.
// The verified business data wins over stale coordinates or unverified journey estimates.
export function resolveLocationLayers(configured?: LocationLayer[] | null): LocationLayer[] {
  const source = Array.isArray(configured) && configured.length ? configured : locationLayers
  const layers = source.map(layer => ({
    ...layer,
    points: (Array.isArray(layer.points) ? layer.points : [])
      .filter(point => !isOptikalejandria(point))
      .map(point => point.name === 'Estación La Estrella (Metro)' && point.time === '25 min'
        ? { ...point, time: '25 min en vehículo', description: 'Estación del Metro de Medellín Línea A, accesible mediante conexión vial o transporte público por Carrera 50' }
        : point),
  }))
  const commerce = layers.find(layer => layer.id === 'comercio')
  if (commerce) commerce.points.unshift({ ...OPTIKALEJANDRIA })
  else layers.push({ id: 'comercio', name: 'Comercio', icon: '□', color: '#8B6B4B', points: [{ ...OPTIKALEJANDRIA }] })
  return layers
}

export function poiMeta(point: POIPoint): string {
  return [point.distance, point.time].filter(Boolean).join(' · ')
}
