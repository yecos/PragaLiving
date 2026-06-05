import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding PRAGA Living database...");

  // Clear existing data
  await prisma.apartment.deleteMany();
  await prisma.amenity.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.adminUser.deleteMany();

  // ==========================================
  // APARTMENTS - Complete Building Inventory
  // ==========================================

  const apartments: any[] = [];

  // Helper: generate unit code
  const unitCode = (floor: number, unit: number) =>
    `P${floor}-${String(unit).padStart(2, "0")}`;

  // --- Studios 33m² (Pisos 1-4, 6 units each) ---
  const studioViews: string[] = [
    "Atrio",
    "Exterior",
    "Atrio",
    "Exterior",
    "Atrio",
    "Exterior",
  ];
  const studioAreas: number[] = [33.05, 33.75, 33.05, 33.75, 33.05, 33.75];

  for (let floor = 1; floor <= 4; floor++) {
    for (let unit = 1; unit <= 6; unit++) {
      const basePrice = 280_000_000;
      const floorPremium = (floor - 1) * 8_000_000;
      const unitPremium = (unit - 1) * 1_500_000;
      apartments.push({
        name: `Studio 33 ${unitCode(floor, unit)}`,
        area: studioAreas[unit - 1],
        bedrooms: 0,
        bathrooms: 1,
        floor,
        view: studioViews[unit - 1],
        typology: "Studio",
        status: "available",
        price: basePrice + floorPremium + unitPremium,
        image: "/images/renders/studio-33.jpg",
        plan360Url: null,
        features: JSON.stringify([
          "Cocina integral",
          "Baño completo",
          "Zona de ropas",
          "Balconcito",
          "Acabados premium",
        ]),
      });
    }
  }

  // --- Studios Plus 35m² (Pisos 3-4, some units) ---
  // 3 units on floor 3, 3 units on floor 4
  const studioPlusViews: string[] = ["Exterior", "Atrio", "Exterior"];
  const studioPlusAreas: number[] = [35.6, 35.8, 35.6];

  for (let floor = 3; floor <= 4; floor++) {
    for (let unit = 1; unit <= 3; unit++) {
      const basePrice = 310_000_000;
      const floorPremium = (floor - 3) * 12_000_000;
      const unitPremium = (unit - 1) * 2_000_000;
      apartments.push({
        name: `Studio Plus 35 ${unitCode(floor, unit + 6)}`,
        area: studioPlusAreas[unit - 1],
        bedrooms: 0,
        bathrooms: 1,
        floor,
        view: studioPlusViews[unit - 1],
        typology: "Studio Plus",
        status: "available",
        price: basePrice + floorPremium + unitPremium,
        image: "/images/renders/studio-33.jpg",
        plan360Url: null,
        features: JSON.stringify([
          "Cocina integral ampliada",
          "Baño completo con ducha escocesa",
          "Zona de ropas",
          "Balcón",
          "Acabados premium",
          "Espacio para estudio",
        ]),
      });
    }
  }

  // --- Apartamento 2H 57m² (Pisos 5-8, 5 units each) ---
  const apto2hViews: string[] = [
    "Atrio",
    "Exterior",
    "Atrio",
    "Exterior",
    "Panorámica",
  ];
  const apto2hAreas: number[] = [57.05, 57.09, 57.05, 57.09, 57.05];

  for (let floor = 5; floor <= 8; floor++) {
    for (let unit = 1; unit <= 5; unit++) {
      const basePrice = 420_000_000;
      const floorPremium = (floor - 5) * 12_000_000;
      const unitPremium = (unit - 1) * 2_500_000;
      apartments.push({
        name: `Apto 2H 57 ${unitCode(floor, unit)}`,
        area: apto2hAreas[unit - 1],
        bedrooms: 2,
        bathrooms: 1,
        floor,
        view: apto2hViews[unit - 1],
        typology: "Apartamento 2H",
        status: "available",
        price: basePrice + floorPremium + unitPremium,
        image: "/images/renders/apto-57.jpg",
        plan360Url: null,
        features: JSON.stringify([
          "2 alcobas",
          "Baño completo",
          "Baño de visitas",
          "Cocina integral",
          "Zona de ropas",
          "Balcón",
          "Acabados premium",
        ]),
      });
    }
  }

  // --- Apartamento Premium 2H 74m² (Pisos 5-8 some units; Pisos 9-12, 4 units) ---
  // 2 units on floors 5-8, 4 units on floors 9-12
  const premiumViews5to8: string[] = ["Exterior", "Panorámica"];

  for (let floor = 5; floor <= 8; floor++) {
    for (let unit = 1; unit <= 2; unit++) {
      const basePrice = 560_000_000;
      const floorPremium = (floor - 5) * 15_000_000;
      const unitPremium = (unit - 1) * 4_000_000;
      apartments.push({
        name: `Apto Premium 2H 74 ${unitCode(floor, unit + 5)}`,
        area: 74.73,
        bedrooms: 2,
        bathrooms: 2,
        floor,
        view: premiumViews5to8[unit - 1],
        typology: "Apartamento Premium 2H",
        status: "available",
        price: basePrice + floorPremium + unitPremium,
        image: "/images/renders/apto-74.jpg",
        plan360Url: null,
        features: JSON.stringify([
          "2 alcobas con walk-in closet",
          "2 baños completos",
          "Cocina integral con isla",
          "Zona de ropas",
          "Balcón amplio",
          "Acabados premium",
          "Piso porcelánico",
        ]),
      });
    }
  }

  const premiumViews9to12: string[] = [
    "Atrio",
    "Exterior",
    "Panorámica",
    "Exterior",
  ];

  for (let floor = 9; floor <= 12; floor++) {
    for (let unit = 1; unit <= 4; unit++) {
      const basePrice = 600_000_000;
      const floorPremium = (floor - 9) * 8_000_000;
      const unitPremium = (unit - 1) * 3_000_000;
      apartments.push({
        name: `Apto Premium 2H 74 ${unitCode(floor, unit)}`,
        area: 74.73,
        bedrooms: 2,
        bathrooms: 2,
        floor,
        view: premiumViews9to12[unit - 1],
        typology: "Apartamento Premium 2H",
        status: "available",
        price: basePrice + floorPremium + unitPremium,
        image: "/images/renders/apto-74.jpg",
        plan360Url: null,
        features: JSON.stringify([
          "2 alcobas con walk-in closet",
          "2 baños completos",
          "Cocina integral con isla",
          "Zona de ropas",
          "Balcón amplio",
          "Acabados premium",
          "Piso porcelánico",
        ]),
      });
    }
  }

  // --- Penthouse 3H 97m² (Pisos 11-12, 2 units) ---
  const penthouseViews: string[] = ["Panorámica", "Panorámica"];

  for (let unit = 1; unit <= 1; unit++) {
    // Floor 11
    apartments.push({
      name: `Penthouse 3H 97 ${unitCode(11, 5)}`,
      area: 97.45,
      bedrooms: 3,
      bathrooms: 2,
      floor: 11,
      view: "Panorámica",
      typology: "Penthouse 3H",
      status: "available",
      price: 780_000_000,
      image: "/images/renders/apto-97.jpg",
      plan360Url: null,
      features: JSON.stringify([
        "3 alcobas con walk-in closet",
        "2 baños completos + baño de visitas",
        "Cocina integral con isla",
        "Zona de ropas",
        "Terraza panorámica",
        "Acabados premium",
        "Piso porcelánico",
        "Doble altura en sala",
      ]),
    });

    // Floor 12
    apartments.push({
      name: `Penthouse 3H 97 ${unitCode(12, 5)}`,
      area: 97.45,
      bedrooms: 3,
      bathrooms: 2,
      floor: 12,
      view: "Panorámica",
      typology: "Penthouse 3H",
      status: "available",
      price: 920_000_000,
      image: "/images/renders/apto-97.jpg",
      plan360Url: null,
      features: JSON.stringify([
        "3 alcobas con walk-in closet",
        "2 baños completos + baño de visitas",
        "Cocina integral con isla",
        "Zona de ropas",
        "Terraza panorámica",
        "Acabados premium",
        "Piso porcelánico",
        "Doble altura en sala",
        "Roof garden privado",
      ]),
    });
  }

  // Mark some units as reserved/sold for realism
  // 2 Studios on floor 1 sold
  apartments[0].status = "sold";
  apartments[3].status = "sold";
  // 3 Studios reserved across floors
  apartments[6].status = "reserved";
  apartments[14].status = "reserved";
  apartments[19].status = "reserved";
  // 1 Apto 2H sold
  apartments[31].status = "sold";
  // 2 Apto 2H reserved
  apartments[35].status = "reserved";
  apartments[42].status = "reserved";
  // 1 Premium reserved
  apartments[53].status = "reserved";
  // 1 Penthouse reserved
  apartments[apartments.length - 2].status = "reserved";

  console.log(`Creating ${apartments.length} apartments...`);
  for (const apt of apartments) {
    await prisma.apartment.create({ data: apt });
  }

  // ==========================================
  // AMENITIES
  // ==========================================

  const amenities = [
    {
      name: "Coworking",
      description:
        "Espacio de trabajo colaborativo con estaciones individuales, salas de reuniones y conectividad de alta velocidad. Diseñado para profesionales que buscan productividad sin salir de casa.",
      icon: "Laptop",
      category: "work",
      image: "/images/renders/coworking.jpg",
      active: true,
      order: 1,
    },
    {
      name: "Gimnasio",
      description:
        "Gimnasio equipado con máquinas de última generación, zona de pesos libres y área de entrenamiento funcional. Tu bienestar físico a un paso de tu puerta.",
      icon: "Dumbbell",
      category: "wellness",
      image: "/images/renders/gimnasio.jpg",
      active: true,
      order: 2,
    },
    {
      name: "Salón Social",
      description:
        "Espacio elegante para reuniones, celebraciones y eventos. Con cocina de apoyo, terraza y capacidad para 40 personas. El lugar perfecto para compartir.",
      icon: "Wine",
      category: "social",
      image: "/images/renders/salon-social.jpg",
      active: true,
      order: 3,
    },
    {
      name: "Ludoteca",
      description:
        "Zona de juego y aprendizaje para los más pequeños. Segura, divertida y diseñada para estimular la creatividad infantil bajo supervisión.",
      icon: "Gamepad2",
      category: "leisure",
      image: "/images/renders/atrio.jpg",
      active: true,
      order: 4,
    },
    {
      name: "Sauna",
      description:
        "Sauna seco con maderas aromáticas para la relajación profunda. Un ritual de bienestar que renueva cuerpo y mente.",
      icon: "Thermometer",
      category: "wellness",
      image: "/images/renders/vitality-pool.jpg",
      active: true,
      order: 5,
    },
    {
      name: "Baño Turco",
      description:
        "Baño turco con aromaterapia para purificar y relajar. La tradición milenaria del hammam en tu edificio.",
      icon: "Cloud",
      category: "wellness",
      image: "/images/renders/vitality-pool.jpg",
      active: true,
      order: 6,
    },
    {
      name: "Vitality Pool",
      description:
        "Piscina de vitalidad con hidromasaje y cromoterapia. Un oasis de relajación en el corazón del edificio con vistas al atrio.",
      icon: "Waves",
      category: "wellness",
      image: "/images/renders/vitality-pool.jpg",
      active: true,
      order: 7,
    },
    {
      name: "Hidromasaje",
      description:
        "Jacuzzi exterior con vistas panorámicas. Relájate mientras contemplas la ciudad desde las alturas.",
      icon: "Droplets",
      category: "wellness",
      image: "/images/renders/vitality-pool.jpg",
      active: true,
      order: 8,
    },
    {
      name: "Hidroterapia",
      description:
        "Circuito de hidroterapia con chorros a diferentes presiones y temperaturas. Recuperación y bienestar en cada sesión.",
      icon: "HeartPulse",
      category: "wellness",
      image: "/images/renders/vitality-pool.jpg",
      active: true,
      order: 9,
    },
    {
      name: "Zona Descanso",
      description:
        "Espacio de calma y desconexión con camas de descanso, música ambiental y iluminación suave. El refugio perfecto después de un largo día.",
      icon: "Moon",
      category: "wellness",
      image: "/images/renders/atrio.jpg",
      active: true,
      order: 10,
    },
  ];

  console.log(`Creating ${amenities.length} amenities...`);
  for (const amenity of amenities) {
    await prisma.amenity.create({ data: amenity });
  }

  // ==========================================
  // ADMIN USER (default)
  // ==========================================

  // Note: In production, use bcrypt. This is a placeholder.
  await prisma.adminUser.create({
    data: {
      username: "admin",
      password: "praga2024", // Change in production!
      name: "Administrador PRAGA",
      role: "admin",
    },
  });

  console.log("Seed completed successfully!");
  console.log(
    `  - ${apartments.length} apartments created`
  );
  console.log(`  - ${amenities.length} amenities created`);
  console.log(`  - 1 admin user created`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
