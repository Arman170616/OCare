/*
# Fix OmanCare Authentication and Profile Authorization

## Overview
Fixes the profile policy recursion that prevents sign-in and account creation from completing.
Adds a protected admin-role helper so role checks do not query the profiles table from inside
its own policy. Also prevents public sign-up metadata from granting an admin account.

## Security Changes
1. Adds `is_admin()` as a SECURITY DEFINER helper with a fixed search path.
2. Replaces profile policy admin checks with `is_admin()`.
3. Replaces admin checks across protected policies with the same helper.
4. Restricts self-registration to donor or organization roles; admin access can only be granted
   through the existing admin-only `set_user_role()` function.
5. Includes organization name in the signup profile trigger so signup does not need a second
   profile update request.

## Data Safety
- No tables, rows, or columns are deleted.
- Existing profile roles are preserved.
- Existing users with admin roles remain admins.
*/

-- A SECURITY DEFINER helper avoids querying profiles from inside profiles RLS policies.
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

REVOKE EXECUTE ON FUNCTION is_admin FROM anon;
GRANT EXECUTE ON FUNCTION is_admin TO authenticated;

-- Replace the recursive profiles policies.
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id OR is_admin());

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id OR is_admin()) WITH CHECK (auth.uid() = id OR is_admin());

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id OR is_admin());

-- Replace recursive admin checks on the other protected tables.
DROP POLICY IF EXISTS "select_facilities_authenticated" ON facilities;
CREATE POLICY "select_facilities_authenticated" ON facilities FOR SELECT
  TO authenticated USING (
    verification_status = 'verified'
    OR owner_id = auth.uid()
    OR is_admin()
  );

DROP POLICY IF EXISTS "insert_facilities_org_or_admin" ON facilities;
CREATE POLICY "insert_facilities_org_or_admin" ON facilities FOR INSERT
  TO authenticated WITH CHECK (owner_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "update_facilities_org_or_admin" ON facilities;
CREATE POLICY "update_facilities_org_or_admin" ON facilities FOR UPDATE
  TO authenticated USING (owner_id = auth.uid() OR is_admin())
  WITH CHECK (owner_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "delete_facilities_org_or_admin" ON facilities;
CREATE POLICY "delete_facilities_org_or_admin" ON facilities FOR DELETE
  TO authenticated USING (owner_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "select_projects_authenticated" ON projects;
CREATE POLICY "select_projects_authenticated" ON projects FOR SELECT
  TO authenticated USING (
    (verified = true AND status = 'active')
    OR EXISTS (
      SELECT 1 FROM facilities f
      WHERE f.id = projects.facility_id AND f.owner_id = auth.uid()
    )
    OR is_admin()
  );

DROP POLICY IF EXISTS "insert_projects_org_or_admin" ON projects;
CREATE POLICY "insert_projects_org_or_admin" ON projects FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM facilities f
      WHERE f.id = projects.facility_id AND f.owner_id = auth.uid()
    ) OR is_admin()
  );

DROP POLICY IF EXISTS "update_projects_org_or_admin" ON projects;
CREATE POLICY "update_projects_org_or_admin" ON projects FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM facilities f
      WHERE f.id = projects.facility_id AND f.owner_id = auth.uid()
    ) OR is_admin()
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM facilities f
      WHERE f.id = projects.facility_id AND f.owner_id = auth.uid()
    ) OR is_admin()
  );

DROP POLICY IF EXISTS "delete_projects_org_or_admin" ON projects;
CREATE POLICY "delete_projects_org_or_admin" ON projects FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM facilities f
      WHERE f.id = projects.facility_id AND f.owner_id = auth.uid()
    ) OR is_admin()
  );

DROP POLICY IF EXISTS "select_donations_owner_or_admin" ON donations;
CREATE POLICY "select_donations_owner_or_admin" ON donations FOR SELECT
  TO authenticated USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "update_donations_owner_or_admin" ON donations;
CREATE POLICY "update_donations_owner_or_admin" ON donations FOR UPDATE
  TO authenticated USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "delete_donations_owner_or_admin" ON donations;
CREATE POLICY "delete_donations_owner_or_admin" ON donations FOR DELETE
  TO authenticated USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "select_impact_authenticated" ON impact_updates;
CREATE POLICY "select_impact_authenticated" ON impact_updates FOR SELECT
  TO authenticated USING (
    status = 'published'
    OR EXISTS (
      SELECT 1 FROM projects p
      JOIN facilities f ON f.id = p.facility_id
      WHERE p.id = impact_updates.project_id AND f.owner_id = auth.uid()
    )
    OR is_admin()
  );

DROP POLICY IF EXISTS "insert_impact_org_or_admin" ON impact_updates;
CREATE POLICY "insert_impact_org_or_admin" ON impact_updates FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN facilities f ON f.id = p.facility_id
      WHERE p.id = impact_updates.project_id AND f.owner_id = auth.uid()
    ) OR is_admin()
  );

DROP POLICY IF EXISTS "update_impact_org_or_admin" ON impact_updates;
CREATE POLICY "update_impact_org_or_admin" ON impact_updates FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN facilities f ON f.id = p.facility_id
      WHERE p.id = impact_updates.project_id AND f.owner_id = auth.uid()
    ) OR is_admin()
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN facilities f ON f.id = p.facility_id
      WHERE p.id = impact_updates.project_id AND f.owner_id = auth.uid()
    ) OR is_admin()
  );

DROP POLICY IF EXISTS "delete_impact_org_or_admin" ON impact_updates;
CREATE POLICY "delete_impact_org_or_admin" ON impact_updates FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN facilities f ON f.id = p.facility_id
      WHERE p.id = impact_updates.project_id AND f.owner_id = auth.uid()
    ) OR is_admin()
  );

DROP POLICY IF EXISTS "insert_cities_admin" ON cities;
CREATE POLICY "insert_cities_admin" ON cities FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "update_cities_admin" ON cities;
CREATE POLICY "update_cities_admin" ON cities FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "delete_cities_admin" ON cities;
CREATE POLICY "delete_cities_admin" ON cities FOR DELETE
  TO authenticated USING (is_admin());

-- Preserve existing admin profiles but never trust signup metadata for future accounts.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role, organization_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE
      WHEN NEW.raw_user_meta_data->>'role' = 'organization' THEN 'organization'
      ELSE 'donor'
    END,
    NULLIF(NEW.raw_user_meta_data->>'organization_name', '')
  );
  RETURN NEW;
END;
$$;
