/*
# OmanCare — Location-Based Charity Donation Platform

## Overview
Creates the full schema for OmanCare: facilities (mosques, hospitals, community facilities),
donation projects, donations, sponsorships, and impact updates. Single-tenant (no auth) —
all data is intentionally public/shared for this charitable platform.

## Tables

### cities
- Lookup of Omani cities/wilayats with coordinates for distance calculations.
- Columns: id, name, governorate, wilayat, lat, lng, created_at.

### facilities
- Verified mosques, hospitals, and community facilities eligible for donations.
- Columns: id, name, name_arabic, type (mosque/hospital/facility), city_id, governorate,
  wilayat, area, address, lat, lng, responsible_org, verification_status, verification_date,
  needs_summary (jsonb of current needs by category), created_at.

### projects
- Donation projects tied to a facility and category (water, food, medical, etc.).
- Columns: id, facility_id, title, category, need_level, urgency, target_amount,
  collected_amount, currency, description, status, verified, image_url, water_type,
  created_at, updated_at.

### donations
- Individual donations from donors to projects. Anonymous (no login) — donor_name and
  donor_email are optional.
- Columns: id, project_id, donor_name, donor_email, amount, currency, recurring,
  frequency, status, receipt_number, created_at.

### impact_updates
- Post-completion updates from the responsible organization.
- Columns: id, project_id, title, description, completion_date, amount_utilized,
  quantity_delivered, status, created_at.

## Security
- RLS enabled on all tables.
- All tables use TO anon, authenticated with USING (true) / WITH CHECK (true) because
  this is a single-tenant public charitable platform with no sign-in — all data is
  intentionally shared publicly.
*/

-- Cities
CREATE TABLE IF NOT EXISTS cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  governorate text NOT NULL,
  wilayat text,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_cities" ON cities;
CREATE POLICY "anon_select_cities" ON cities FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_cities" ON cities;
CREATE POLICY "anon_insert_cities" ON cities FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_cities" ON cities;
CREATE POLICY "anon_update_cities" ON cities FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_cities" ON cities;
CREATE POLICY "anon_delete_cities" ON cities FOR DELETE
  TO anon, authenticated USING (true);

-- Facilities
CREATE TABLE IF NOT EXISTS facilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_arabic text,
  type text NOT NULL DEFAULT 'mosque' CHECK (type IN ('mosque', 'hospital', 'facility')),
  city_id uuid REFERENCES cities(id) ON DELETE SET NULL,
  governorate text NOT NULL,
  wilayat text,
  area text,
  address text,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  responsible_org text,
  verification_status text NOT NULL DEFAULT 'verified' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verification_date date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_facilities" ON facilities;
CREATE POLICY "anon_select_facilities" ON facilities FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_facilities" ON facilities;
CREATE POLICY "anon_insert_facilities" ON facilities FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_facilities" ON facilities;
CREATE POLICY "anon_update_facilities" ON facilities FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_facilities" ON facilities;
CREATE POLICY "anon_delete_facilities" ON facilities FOR DELETE
  TO anon, authenticated USING (true);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text NOT NULL CHECK (category IN ('water', 'food', 'medical', 'hospital', 'mosque', 'education', 'housing', 'orphan', 'emergency', 'debt', 'other')),
  need_level text NOT NULL DEFAULT 'medium' CHECK (need_level IN ('low', 'medium', 'high', 'critical')),
  urgency text NOT NULL DEFAULT 'normal' CHECK (urgency IN ('normal', 'urgent', 'critical')),
  target_amount numeric NOT NULL DEFAULT 0,
  collected_amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'OMR',
  description text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'funded', 'completed', 'cancelled')),
  verified boolean NOT NULL DEFAULT true,
  image_url text,
  water_type text CHECK (water_type IS NULL OR water_type IN ('drinking', 'dispenser', 'tank', 'supply', 'filtration', 'maintenance', 'project')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_projects" ON projects;
CREATE POLICY "anon_select_projects" ON projects FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_projects" ON projects;
CREATE POLICY "anon_insert_projects" ON projects FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_projects" ON projects;
CREATE POLICY "anon_update_projects" ON projects FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_projects" ON projects;
CREATE POLICY " DELETE_projects" ON projects;
CREATE POLICY "anon_delete_projects" ON projects FOR DELETE
  TO anon, authenticated USING (true);

-- Donations
CREATE TABLE IF NOT EXISTS donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  donor_name text,
  donor_email text,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'OMR',
  recurring boolean NOT NULL DEFAULT false,
  frequency text CHECK (frequency IS NULL OR frequency IN ('one-time', 'weekly', 'monthly', 'custom')),
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  receipt_number text UNIQUE NOT NULL DEFAULT 'OMC-' || upper(encode(gen_random_bytes(6), 'hex')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_donations" ON donations;
CREATE POLICY "anon_select_donations" ON donations FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_donations" ON donations;
CREATE POLICY "anon_insert_donations" ON donations FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_donations" ON donations;
CREATE POLICY "anon_update_donations" ON donations FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_donations" ON donations;
CREATE POLICY "anon_delete_donations" ON donations FOR DELETE
  TO anon, authenticated USING (true);

-- Impact Updates
CREATE TABLE IF NOT EXISTS impact_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  completion_date date,
  amount_utilized numeric,
  quantity_delivered text,
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE impact_updates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_impact" ON impact_updates;
CREATE POLICY "anon_select_impact" ON impact_updates FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_impact" ON impact_updates;
CREATE POLICY "anon_insert_impact" ON impact_updates FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_impact" ON impact_updates;
CREATE POLICY "anon_update_impact" ON impact_updates FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_impact" ON impact_updates;
CREATE POLICY "anon_delete_impact" ON impact_updates FOR DELETE
  TO anon, authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_facilities_city ON facilities(city_id);
CREATE INDEX IF NOT EXISTS idx_facilities_type ON facilities(type);
CREATE INDEX IF NOT EXISTS idx_projects_facility ON projects(facility_id);
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_donations_project ON donations(project_id);
CREATE INDEX IF NOT EXISTS idx_impact_project ON impact_updates(project_id);
