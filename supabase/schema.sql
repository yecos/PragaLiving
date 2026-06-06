-- PRAGA Living - Supabase Schema
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- ADMIN USERS
-- ==========================================
CREATE TABLE admin_users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default admin (password: praga2024)
INSERT INTO admin_users (username, password, name, role)
VALUES ('admin', 'praga2024', 'Administrador PRAGA', 'admin');

-- ==========================================
-- APARTMENTS
-- ==========================================
CREATE TABLE apartments (
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
-- LEADS
-- ==========================================
CREATE TABLE leads (
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
-- AMENITIES
-- ==========================================
CREATE TABLE amenities (
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
-- SITE CONFIG
-- ==========================================
CREATE TABLE site_config (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  section TEXT UNIQUE NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- FLOOR PLANS
-- ==========================================
CREATE TABLE floor_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  floor_number INTEGER NOT NULL,
  floor_name TEXT,
  image TEXT,
  apartments JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(floor_number)
);

-- ==========================================
-- QUOTES (Cotizaciones)
-- ==========================================
CREATE TABLE quotes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id),
  apartment_id UUID REFERENCES apartments(id),
  quote_number TEXT UNIQUE NOT NULL,
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
-- ENABLE RLS (Row Level Security)
-- ==========================================
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE apartments ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE floor_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- RLS POLICIES (Allow all for anon - auth is handled at app level)
-- ==========================================
CREATE POLICY "Allow read access for all" ON apartments FOR SELECT USING (true);
CREATE POLICY "Allow all operations for service" ON apartments FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow read access for all" ON leads FOR SELECT USING (true);
CREATE POLICY "Allow all operations for service" ON leads FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow read access for all" ON amenities FOR SELECT USING (true);
CREATE POLICY "Allow all operations for service" ON amenities FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow read access for all" ON site_config FOR SELECT USING (true);
CREATE POLICY "Allow all operations for service" ON site_config FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow read access for all" ON floor_plans FOR SELECT USING (true);
CREATE POLICY "Allow all operations for service" ON floor_plans FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow read access for all" ON quotes FOR SELECT USING (true);
CREATE POLICY "Allow all operations for service" ON quotes FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow admin login" ON admin_users FOR SELECT USING (true);

-- ==========================================
-- INDEXES
-- ==========================================
CREATE INDEX idx_apartments_floor ON apartments(floor);
CREATE INDEX idx_apartments_status ON apartments(status);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created ON leads(created_at DESC);
CREATE INDEX idx_site_config_section ON site_config(section);
