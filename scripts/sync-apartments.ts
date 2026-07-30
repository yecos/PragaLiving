import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
import floorPlansJson from '../src/data/floor-plans.json'

function priceFor(typology: string, floor: number): number {
  const floorPremium = (floor - 1) * 3_000_000
  let base = 120_000_000
  if (typology === 'Tipo A') base = 230_000_000
  else if (typology === 'Tipo A+') base = 310_000_000
  else if (typology === 'Tipo B') base = 160_000_000
  return base + floorPremium
}

async function main() {
  console.log('=== SINCRONIZANDO APARTMENTS DESDE floor-plans.json ===\n')
  const floors = floorPlansJson.floors.filter((f: any) => f.isResidential)
  console.log(`Pisos residenciales: ${floors.length}`)
  
  const deleted = await prisma.apartment.deleteMany({})
  console.log(`Eliminados: ${deleted.count} apartamentos viejos\n`)
  
  let created = 0
  for (const floor of floors) {
    const floorNum = parseInt(floor.id.replace('piso-', ''))
    if (isNaN(floorNum)) continue
    
    for (const apt of floor.apartments) {
      const bedrooms = apt.typology === 'Tipo A' || apt.typology === 'Tipo A+' ? 3
                     : apt.typology === 'Tipo B' ? 2 : 1
      const bathrooms = apt.typology === 'Tipo A' || apt.typology === 'Tipo A+' ? 2 : 1
      
      await prisma.apartment.create({
        data: {
          name: apt.name,
          area: apt.area,
          bedrooms,
          bathrooms,
          floor: floorNum,
          view: apt.view,
          typology: apt.typology,
          status: apt.status,
          price: priceFor(apt.typology, floorNum),
          image: apt.typology === 'Tipo A' || apt.typology === 'Tipo A+' ? '/images/renders/apto-74.png'
               : apt.typology === 'Tipo B' ? '/images/renders/apto-57.png'
               : '/images/renders/studio-33.png',
          features: JSON.stringify(
            bedrooms >= 3
              ? ['3 alcobas', '2 baños completos', 'Sala-comedor', 'Cocina integral', 'Balcón', 'Zona de ropas', 'Acabados premium']
              : bedrooms === 2
              ? ['2 alcobas', 'Baño completo', 'Sala-comedor', 'Cocina integral', 'Balcón', 'Zona de ropas', 'Acabados premium']
              : ['1 alcoba', 'Baño completo', 'Sala-comedor', 'Cocina integral', 'Zona de ropas', 'Acabados premium']
          ),
        },
      })
      created++
    }
    console.log(`  ✓ Piso ${floorNum}: ${floor.apartments.length} apartamentos`)
  }
  
  console.log(`\n✓ Total creados: ${created}`)
  const final = await prisma.apartment.count()
  console.log(`\n=== RESULTADO ===`)
  console.log(`Apartments: ${final}`)
  const byTyp = await prisma.apartment.groupBy({ by: ['typology'], _count: true })
  console.log('Tipologías:', byTyp.map(t => `${t.typology}=${t._count}`).join(' '))
  const byStatus = await prisma.apartment.groupBy({ by: ['status'], _count: true })
  console.log('Estados:', byStatus.map(s => `${s.status}=${s._count}`).join(' '))
}
main().then(() => prisma.$disconnect()).catch(e => { console.error(e); process.exit(1) })
