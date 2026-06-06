-- ============================================
-- PRAGA Living - Seed Data Only
-- ============================================
-- Use this if you already created tables via the dashboard
-- and just need to populate them with initial data

-- Run in: Supabase Dashboard → SQL Editor

-- Default admin user
INSERT INTO admin_users (id, username, password, name, role)
VALUES ('admin-1', 'admin', 'praga2024', 'Administrador PRAGA', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Apartments (132 units: 11 floors × 12 units)
INSERT INTO apartments (id, name, area, bedrooms, bathrooms, floor, view, typology, status, price, image, features)
SELECT
  'apt-p' || f || '-u' || u,
  'Apto ' || (f * 100 + u),
  CASE WHEN u <= 4 THEN
    (ARRAY[76.20, 74.85, 75.40, 73.90])[u]
  ELSE
    (ARRAY[47.50, 48.20, 49.10, 48.60, 47.80, 48.90, 47.30, 48.40])[u - 4]
  END,
  CASE WHEN u <= 4 THEN 3 ELSE 2 END,
  CASE WHEN u <= 4 THEN 2 ELSE 1 END,
  f,
  (ARRAY['Carrera 50', 'Calle 133 Sur', 'Atrio', 'Panorámica', 'Atrio', 'Carrera 50', 'Carrera 50', 'Calle 133 Sur', 'Calle 133 Sur', 'Atrio', 'Interior', 'Interior'])[u],
  CASE WHEN u <= 4 THEN 'Tipo A · 3 Alcobas' ELSE 'Tipo B · 2 Alcobas' END,
  CASE
    WHEN (f * 100 + u) IN (101, 106, 301, 501, 605, 805, 1005, 1201) THEN 'sold'
    WHEN (f * 100 + u) IN (104, 202, 313, 410, 510, 612, 807, 907, 1010, 1209) THEN 'reserved'
    ELSE 'available'
  END,
  CASE WHEN u <= 4 THEN
    260000000 + (f - 1) * 8000000 + (u - 1) * 1500000
  ELSE
    180000000 + (f - 1) * 5000000 + (u - 5) * 800000
  END,
  CASE WHEN u <= 4 THEN '/images/renders/apto-74.png' ELSE '/images/renders/apto-57.png' END,
  CASE WHEN u <= 4 THEN
    '["3 alcobas","2 baños completos","Sala-comedor","Cocina integral","Balcón con vegetación","Zona de ropas","Acabados premium","Unidad esquinera"]'::jsonb
  ELSE
    '["2 alcobas","Baño completo","Sala-comedor","Cocina integral","Zona de ropas","Acabados premium"]'::jsonb
  END
FROM generate_series(1, 11) AS f
CROSS JOIN generate_series(1, 12) AS u
ON CONFLICT (id) DO NOTHING;

-- Amenities
INSERT INTO amenities (id, name, description, icon, category, image, active, "order") VALUES
  ('fa-1', 'Ludoteca', 'Zona de juego y aprendizaje para los más pequeños.', 'Gamepad2', 'leisure', '/images/renders/atrio-main.png', true, 1),
  ('fa-2', 'Gimnasio', 'Gimnasio equipado con máquinas de última generación.', 'Dumbbell', 'wellness', '/images/renders/gimnasio.png', true, 2),
  ('fa-3', 'Vitality Pool', 'Piscina de vitalidad con hidromasaje y cromoterapia.', 'Waves', 'wellness', '/images/renders/vitality-pool.png', true, 3),
  ('fa-4', 'Salón Social', 'Espacio elegante para reuniones, celebraciones y eventos.', 'Wine', 'social', '/images/renders/salon-social.png', true, 4),
  ('fa-5', 'Sauna', 'Sauna seco con maderas aromáticas.', 'Thermometer', 'wellness', '/images/renders/vitality-pool.png', true, 5),
  ('fa-6', 'Baño Turco', 'Baño turco con aromaterapia.', 'Cloud', 'wellness', '/images/renders/vitality-pool.png', true, 6),
  ('fa-7', 'Vestieres', 'Vestieres completos con casilleros y duchas.', 'Shirt', 'wellness', '/images/renders/coworking.png', true, 7),
  ('fa-8', 'Sala Coworking', 'Espacio de trabajo compartido con internet de alta velocidad.', 'Laptop', 'service', '/images/renders/coworking.png', true, 8),
  ('fa-9', 'Lobby Doble Altura', 'Lobby de doble altura con recepción 24h.', 'DoorOpen', 'social', '/images/renders/lobby.png', true, 9),
  ('fa-10', 'Terraza Cubierta / Jardín Elevado', 'Terraza panorámica con jardín elevado y vistas 360°.', 'Sun', 'leisure', '/images/renders/hero-day.jpg', true, 10)
ON CONFLICT (id) DO NOTHING;
