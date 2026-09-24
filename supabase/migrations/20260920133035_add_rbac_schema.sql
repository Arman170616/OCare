/*
# OmanCare RBAC — Schema Implementation

## 1. New Tables
### profiles
- id (uuid, PK, FK to auth.users)
- email (text, unique)
- full_name (text)
- role (text: admin/organization/donor, default 'donor') — NOT client-writable
- organization_name (text, nullable)
- phone (text, nullable)
- created_at (timestamptz)

## 2. Modified Tables
### facilities — add owner_id column
### donations — add user_id column
*/

-- ============================
-- PROFILES TABLE
-- ============================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  role text NOT NULL DEFAULT 'donor' CHECK (role IN ('admin', 'organization', 'donor')),
  organization_name text,
  phone text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles: each user can read/update their own. Admin can read all.
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- Column-level: revoke UPDATE on role, grant on user-editable columns only
REVOKE UPDATE ON profiles FROM authenticated;
GRANT UPDATE (full_name, organization_name, phone) ON profiles TO authenticated;

-- ============================
-- FACILITIES — add owner_id
-- ============================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'facilities' AND column_name = 'owner_id') THEN
    ALTER TABLE facilities ADD COLUMN owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Replace all existing facility policies with role-aware ones
DROP POLICY IF EXISTS "anon_select_facilities" ON facilities;
DROP POLICY IF EXISTS "anon_insert_facilities" ON facilities;
DROP POLICY IF EXISTS "anon_update_facilities" ON facilities;
DROP POLICY IF EXISTS "anon_delete_facilities" ON facilities;

-- All authenticated can read verified facilities; org owners can read their own pending ones
CREATE POLICY "select_facilities_authenticated" ON facilities FOR SELECT
  TO authenticated USING (
    verification_status = 'verified'
    OR owner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Organization owners can insert facilities they own; admins can insert any
CREATE POLICY "insert_facilities_org_or_admin" ON facilities FOR INSERT
  TO authenticated WITH CHECK (
    owner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Organization owners can update their own facilities; admins can update any
CREATE POLICY "update_facilities_org_or_admin" ON facilities FOR UPDATE
  TO authenticated USING (
    owner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  ) WITH CHECK (
    owner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Organization owners can delete their own facilities; admins can delete any
CREATE POLICY "delete_facilities_org_or_admin" ON facilities FOR DELETE
  TO authenticated USING (
    owner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ============================
-- PROJECTS — role-aware policies
-- ============================
DROP POLICY IF EXISTS "anon_select_projects" ON projects;
DROP POLICY IF EXISTS "anon_insert_projects" ON projects;
DROP POLICY IF EXISTS "anon_update_projects" ON projects;
DROP POLICY IF EXISTS "anon_delete_projects" ON projects;

-- All authenticated can read verified, active projects. Org owners can read their own. Admins read all.
CREATE POLICY "select_projects_authenticated" ON projects FOR SELECT
  TO authenticated USING (
    (verified = true AND status = 'active')
    OR EXISTS (
      SELECT 1 FROM facilities f WHERE f.id = projects.facility_id AND f.owner_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Org owners can insert projects for their own facilities; admins can insert any
CREATE POLICY "insert_projects_org_or_admin" ON projects FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM facilities f WHERE f.id = projects.facility_id AND f.owner_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Org owners can update their own projects; admins can update any
CREATE POLICY "update_projects_org_or_admin" ON projects FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM facilities f WHERE f.id = projects.facility_id AND f.owner_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM facilities f WHERE f.id = projects.facility_id AND f.owner_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Org owners can delete their own projects; admins can delete any
CREATE POLICY "delete_projects_org_or_admin" ON projects FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM facilities f WHERE f.id = projects.facility_id AND f.owner_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ============================
-- DONATIONS — add user_id, role-aware policies
-- ============================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'donations' AND column_name = 'user_id') THEN
    ALTER TABLE donations ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

DROP POLICY IF EXISTS "anon_select_donations" ON donations;
DROP POLICY IF EXISTS "anon_insert_donations" ON donations;
DROP POLICY IF EXISTS "anon_update_donations" ON donations;
DROP POLICY IF EXISTS "anon_delete_donations" ON donations;

-- Donors can read their own donations; admins can read all
CREATE POLICY "select_donations_owner_or_admin" ON donations FOR SELECT
  TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Any authenticated user can insert a donation (for themselves)
CREATE POLICY "insert_donations_authenticated" ON donations FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

-- Donors can update/delete their own donations; admins can too
CREATE POLICY "update_donations_owner_or_admin" ON donations FOR UPDATE
  TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  ) WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "delete_donations_owner_or_admin" ON donations FOR DELETE
  TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ============================
-- IMPACT_UPDATES — role-aware policies
-- ============================
DROP POLICY IF EXISTS "anon_select_impact" ON impact_updates;
DROP POLICY IF EXISTS "anon_insert_impact" ON impact_updates;
DROP POLICY IF EXISTS "anon_update_impact" ON impact_updates;
DROP POLICY IF EXISTS "anon_delete_impact" ON impact_updates;

-- All authenticated can read published impact updates; org owners can read their own drafts; admins read all
CREATE POLICY "select_impact_authenticated" ON impact_updates FOR SELECT
  TO authenticated USING (
    status = 'published'
    OR EXISTS (
      SELECT 1 FROM projects p
      JOIN facilities f ON f.id = p.facility_id
      WHERE p.id = impact_updates.project_id AND f.owner_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Org owners can insert impact updates for their own projects; admins can insert any
CREATE POLICY "insert_impact_org_or_admin" ON impact_updates FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN facilities f ON f.id = p.facility_id
      WHERE p.id = impact_updates.project_id AND f.owner_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Org owners can update their own; admins can update any
CREATE POLICY "update_impact_org_or_admin" ON impact_updates FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN facilities f ON f.id = p.facility_id
      WHERE p.id = impact_updates.project_id AND f.owner_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN facilities f ON f.id = p.facility_id
      WHERE p.id = impact_updates.project_id AND f.owner_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Org owners can delete their own; admins can delete any
CREATE POLICY "delete_impact_org_or_admin" ON impact_updates FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN facilities f ON f.id = p.facility_id
      WHERE p.id = impact_updates.project_id AND f.owner_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ============================
-- CITIES — keep public read, admin-only write
-- ============================
DROP POLICY IF EXISTS "anon_select_cities" ON cities;
DROP POLICY IF EXISTS "anon_insert_cities" ON cities;
DROP POLICY IF EXISTS "anon_update_cities" ON cities;
DROP POLICY IF EXISTS "anon_delete_cities" ON cities;

CREATE POLICY "select_cities_all" ON cities FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "insert_cities_admin" ON cities FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "update_cities_admin" ON cities FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "delete_cities_admin" ON cities FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ============================
-- SECURITY DEFINER FUNCTIONS
-- ============================

-- Admin-only: change a user's role
CREATE OR REPLACE FUNCTION set_user_role(p_user_id uuid, p_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_role NOT IN ('admin', 'organization', 'donor') THEN
    RAISE EXCEPTION 'Invalid role';
  END IF;

  UPDATE profiles SET role = p_role WHERE id = p_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION set_user_role FROM anon;
GRANT EXECUTE ON FUNCTION set_user_role TO authenticated;

-- Admin-only: set facility verification status
CREATE OR REPLACE FUNCTION verify_facility(p_facility_id uuid, p_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_status NOT IN ('pending', 'verified', 'rejected') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  UPDATE facilities
  SET verification_status = p_status, verification_date = CURRENT_DATE
  WHERE id = p_facility_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION verify_facility FROM anon;
GRANT EXECUTE ON FUNCTION verify_facility TO authenticated;

-- Org owner or admin: create an impact update with authorization check
CREATE OR REPLACE FUNCTION create_impact_update(
  p_project_id uuid,
  p_title text,
  p_description text,
  p_completion_date date,
  p_amount_utilized numeric,
  p_quantity_delivered text,
  p_status text DEFAULT 'published'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_new_id uuid;
  v_is_owner boolean;
  v_is_admin boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM projects p
    JOIN facilities f ON f.id = p.facility_id
    WHERE p.id = p_project_id AND f.owner_id = auth.uid()
  ) INTO v_is_owner;

  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ) INTO v_is_admin;

  IF NOT v_is_owner AND NOT v_is_admin THEN
    RAISE EXCEPTION 'Not authorized to post impact updates for this project';
  END IF;

  IF p_status NOT IN ('draft', 'published') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  INSERT INTO impact_updates (project_id, title, description, completion_date, amount_utilized, quantity_delivered, status)
  VALUES (p_project_id, p_title, p_description, p_completion_date, p_amount_utilized, p_quantity_delivered, p_status)
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION create_impact_update FROM anon;
GRANT EXECUTE ON FUNCTION create_impact_update TO authenticated;

-- Auto-create profile on signup via trigger
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'donor')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_facilities_owner ON facilities(owner_id);
CREATE INDEX IF NOT EXISTS idx_donations_user ON donations(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
