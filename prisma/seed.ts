import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding PRAGA Living database...");

  // Clear existing data
  await prisma.apartment.deleteMany();
  await prisma.amenity.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.adminUser.deleteMany();

  // ==========================================
  // APARTMENTS — official commercial inventory (Levels 05–16)
  // ==========================================
  const unitTemplates = [
    { unit: 1, area: 78.51, bedrooms: 3, bathrooms: 2, typology: "78.51 m²", pricePerM2: 7_000_000, image: "/images/renders/apto-74.png" },
    { unit: 2, area: 60, bedrooms: 2, bathrooms: 1, typology: "60 m²", pricePerM2: 7_000_000, image: "/images/renders/apto-57.png" },
    { unit: 3, area: 60, bedrooms: 2, bathrooms: 1, typology: "60 m²", pricePerM2: 7_000_000, image: "/images/renders/apto-57.png" },
    { unit: 4, area: 104, bedrooms: 3, bathrooms: 2, typology: "104 m²", pricePerM2: 7_000_000, image: "/images/renders/apto-97.png" },
    { unit: 5, area: 34.28, bedrooms: 1, bathrooms: 1, typology: "34.28 m²", pricePerM2: 7_500_000, image: "/images/renders/studio-33.png" },
    { unit: 6, area: 35.6, bedrooms: 1, bathrooms: 1, typology: "35.6 m²", pricePerM2: 7_500_000, image: "/images/renders/studio-33.png" },
    { unit: 7, area: 35.8, bedrooms: 1, bathrooms: 1, typology: "35.8 m²", pricePerM2: 7_500_000, image: "/images/renders/studio-33.png" },
    { unit: 8, area: 33.75, bedrooms: 1, bathrooms: 1, typology: "33.75 m²", pricePerM2: 7_500_000, image: "/images/renders/studio-33.png" },
    { unit: 9, area: 33.05, bedrooms: 1, bathrooms: 1, typology: "33.05 m²", pricePerM2: 7_500_000, image: "/images/renders/studio-33.png" },
    { unit: 10, area: 33.75, bedrooms: 1, bathrooms: 1, typology: "33.75 m²", pricePerM2: 7_500_000, image: "/images/renders/studio-33.png" },
  ];

  const apartments: any[] = [];
  for (let level = 5; level <= 16; level++) {
    const heightPremium = level <= 8 ? 0 : (level - 8) * 1_000_000;
    for (const template of unitTemplates) {
      apartments.push({
        name: `Apto ${String(template.unit).padStart(2, "0")}`,
        area: template.area,
        bedrooms: template.bedrooms,
        bathrooms: template.bathrooms,
        floor: level,
        view: "Por definir",
        typology: template.typology,
        status: "consult",
        price: Math.round(template.area * template.pricePerM2 + heightPremium),
        image: template.image,
        plan360Url: null,
        features: JSON.stringify([
          `Nivel ${String(level).padStart(2, "0")}`,
          `Apartamento ${String(template.unit).padStart(2, "0")}`,
          `Prima de altura incluida: $${heightPremium.toLocaleString("es-CO")}`,
        ]),
      });
    }
  }

  console.log(`Creating ${apartments.length} commercial apartments...`);
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
  // SECURITY: password is bcrypt-hashed (cost factor 12) before storing.
  // Default password is "praga2024" — CHANGE IT IMMEDIATELY in production
  // by re-running scripts/hash-password.ts with your real password and
  // re-seeding, or by updating the admin user via the admin panel.

  const defaultPasswordHash = bcrypt.hashSync(
    process.env.ADMIN_SEED_PASSWORD || "praga2024",
    12
  );

  await prisma.adminUser.create({
    data: {
      username: "admin",
      password: defaultPasswordHash,
      name: "Administrador PRAGA",
      role: "admin",
    },
  });

  // ==========================================
  // SITE CONFIG — load from JSON
  // ==========================================
  // Read the bundled site-config.json so the admin panel has defaults
  try {
    const siteConfig = await import("../src/data/site-config.json");
    const config = (siteConfig.default || siteConfig) as Record<string, unknown>;
    let sectionCount = 0;
    for (const [section, data] of Object.entries(config)) {
      await prisma.siteConfig.upsert({
        where: { section },
        create: { section, data: data as any },
        update: { data: data as any },
      });
      sectionCount++;
    }
    console.log(`  - ${sectionCount} site config sections created`);
  } catch (err) {
    console.warn("  - Could not load site-config.json:", err);
  }

  // ==========================================
  // FLOOR PLANS — empty placeholders for each residential floor
  // ==========================================
  for (let floor = 1; floor <= 11; floor++) {
    await prisma.floorPlan.upsert({
      where: { floorNumber: floor },
      create: {
        floorNumber: floor,
        floorName: `Piso ${floor}`,
        image: '/images/planos/planta-tipo.jpg',
        apartments: [],
      },
      update: {},
    });
  }
  // Non-residential floors
  const nonResidential = [
    { num: -3, name: 'Sótano 3' },
    { num: -2, name: 'Sótano 2' },
    { num: -1, name: 'Sótano 1' },
    { num: 0, name: 'Acceso / Lobby' },
    { num: 13, name: 'Zona Social' },
    { num: 14, name: 'Cubierta' },
  ];
  for (const { num, name } of nonResidential) {
    await prisma.floorPlan.upsert({
      where: { floorNumber: num },
      create: {
        floorNumber: num,
        floorName: name,
        image: '',
        apartments: [],
      },
      update: {},
    });
  }
  console.log(`  - ${11 + nonResidential.length} floor plans created`);

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
