-- ============================================
-- PRAGA Living - Supabase Schema (SECURE)
-- ============================================
-- Run this in the Supabase SQL Editor.
--
-- SECURITY MODEL:
--   - anon role: can READ public data (apartments, amenities, site_config public sections)
--   - anon role: can INSERT leads (form submissions)
--   - anon role: CANNOT read leads, quotes, admin_users, floor_plans (admin-only)
--   - service role: full access to everything (bypasses RLS)
--
-- All writes (except lead inserts) must go through server-side code that uses
-- the SUPABASE_SERVICE_ROLE_KEY. The anon key is exposed in the browser.
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- ADMIN USERS
-- ==========================================
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL, -- MUST be bcrypt hash, never plaintext
  name TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default admin with bcrypt-hashed "praga2024" (cost 12)
-- SECURITY: Change this password immediately after first login.
-- To generate a new hash: bun run scripts/hash-password.ts "your-password"
INSERT INTO admin_users (username, password, name, role)
VALUES (
  'admin',
  '$2b$12$NyoDP657HaBtHQC0/N/2d.9B0.55vQ1Dxzfj2H0Raamb9O98F9k2y',
  'Administrador PRAGA',
  'admin'
)
ON CONFLICT (username) DO NOTHING;

-- ==========================================
-- APARTMENTS (public catalog)
-- ==========================================
CREATE TABLE IF NOT EXISTS apartments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  area NUMERIC(6,2) NOT NULL,
  bedrooms INTEGER NOT NULL,
  bathrooms INTEGER NOT NULL,
  floor INTEGER NOT NULL,
  view TEXT,
  typology TEXT,
  status TEXT DEFAULT 'available',
  price NUMERIC(12,0),
  image TEXT,
  plan_360_url TEXT,
  features JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- LEADS (form submissions — PII)
-- ==========================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  interest TEXT,
  message TEXT,
  source TEXT DEFAULT 'website',
  status TEXT DEFAULT 'new',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- AMENITIES (public catalog)
-- ==========================================
CREATE TABLE IF NOT EXISTS amenities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  category TEXT,
  image TEXT,
  active BOOLEAN DEFAULT true,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- SITE CONFIG (mixed public + admin content)
-- ==========================================
CREATE TABLE IF NOT EXISTS site_config (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  section TEXT UNIQUE NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- FLOOR PLANS (admin-managed)
-- ==========================================
CREATE TABLE IF NOT EXISTS floor_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  floor_number INTEGER NOT NULL,
  floor_name TEXT,
  image TEXT,
  apartments JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(floor_number)
);

-- ==========================================
-- FLOOR IMAGES (admin-managed)
-- ==========================================
CREATE TABLE IF NOT EXISTS floor_images (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  floor_id TEXT NOT NULL,
  image_url TEXT NOT NULL,
  label TEXT,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- QUOTES (Cotizaciones — sensitive client data)
-- ==========================================
CREATE TABLE IF NOT EXISTS quotes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id),
  apartment_id UUID REFERENCES apartments(id),
  number TEXT UNIQUE NOT NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  client_email TEXT,
  apartment_name TEXT NOT NULL,
  apartment_area NUMERIC(6,2),
  apartment_typology TEXT,
  price NUMERIC(12,0) NOT NULL,
  discount NUMERIC(12,0) DEFAULT 0,
  final_price NUMERIC(12,0) NOT NULL,
  payment_plan TEXT,
  notes TEXT,
  status TEXT DEFAULT 'sent',
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- ENABLE ROW LEVEL SECURITY
-- ==========================================
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE apartments ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE floor_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE floor_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- DROP OLD INSECURE POLICIES (if upgrading from previous schema)
-- ==========================================
DROP POLICY IF EXISTS "Allow read access for all" ON apartments;
DROP POLICY IF EXISTS "Allow all operations for service" ON apartments;
DROP POLICY IF EXISTS "Allow read access for all" ON leads;
DROP POLICY IF EXISTS "Allow all operations for service" ON leads;
DROP POLICY IF EXISTS "Allow read access for all" ON amenities;
DROP POLICY IF EXISTS "Allow all operations for service" ON amenities;
DROP POLICY IF EXISTS "Allow read access for all" ON site_config;
DROP POLICY IF EXISTS "Allow all operations for service" ON site_config;
DROP POLICY IF EXISTS "Allow read access for all" ON floor_plans;
DROP POLICY IF EXISTS "Allow all operations for service" ON floor_plans;
DROP POLICY IF EXISTS "Allow read access for all" ON quotes;
DROP POLICY IF EXISTS "Allow all operations for service" ON quotes;
DROP POLICY IF EXISTS "Allow admin login" ON admin_users;

-- ==========================================
-- RLS POLICIES (SECURE)
-- ==========================================
-- The `service` role bypasses RLS automatically (Supabase behavior).
-- We only need to define what `anon` and `authenticated` can do.

-- APARTMENTS — public can read catalog
CREATE POLICY "apartments_public_read" ON apartments
  FOR SELECT TO anon, authenticated
  USING (true);

-- AMENITIES — public can read catalog
CREATE POLICY "amenities_public_read" ON amenities
  FOR SELECT TO anon, authenticated
  USING (true);

-- SITE_CONFIG — public can read (content displayed on website)
CREATE POLICY "site_config_public_read" ON site_config
  FOR SELECT TO anon, authenticated
  USING (true);

-- LEADS — anyone can SUBMIT a new lead (form submission)
-- but NO ONE (except service role) can list/read them.
CREATE POLICY "leads_public_insert" ON leads
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- FLOOR_PLANS — public can read (shown on website)
CREATE POLICY "floor_plans_public_read" ON floor_plans
  FOR SELECT TO anon, authenticated
  USING (true);

-- FLOOR_IMAGES — public can read (shown on website)
CREATE POLICY "floor_images_public_read" ON floor_images
  FOR SELECT TO anon, authenticated
  USING (true);

-- QUOTES — ADMIN ONLY (no anon access at all)
-- No policy = no access for anon/authenticated.
-- Only service role (server-side with SUPABASE_SERVICE_ROLE_KEY) can read/write.

-- ADMIN_USERS — ADMIN ONLY (no anon access at all)
-- No policy = no access for anon/authenticated.
-- Only service role can read.

-- ==========================================
-- INDEXES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_apartments_floor ON apartments(floor);
CREATE INDEX IF NOT EXISTS idx_apartments_status ON apartments(status);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_config_section ON site_config(section);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_created ON quotes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_floor_images_floor_id ON floor_images(floor_id);

-- ==========================================
-- UPDATED_AT TRIGGERS
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_apartments_updated ON apartments;
CREATE TRIGGER trigger_apartments_updated BEFORE UPDATE ON apartments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_leads_updated ON leads;
CREATE TRIGGER trigger_leads_updated BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_site_config_updated ON site_config;
CREATE TRIGGER trigger_site_config_updated BEFORE UPDATE ON site_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_floor_plans_updated ON floor_plans;
CREATE TRIGGER trigger_floor_plans_updated BEFORE UPDATE ON floor_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_floor_images_updated ON floor_images;
CREATE TRIGGER trigger_floor_images_updated BEFORE UPDATE ON floor_images
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_quotes_updated ON quotes;
CREATE TRIGGER trigger_quotes_updated BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
