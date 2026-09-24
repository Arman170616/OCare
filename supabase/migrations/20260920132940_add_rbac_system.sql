/*
# OmanCare RBAC System — Profiles, Roles, and Role-Based Access Control

## Overview
Transforms OmanCare from a public/no-auth app into a multi-role authenticated platform with three roles:
- **admin**: Full access. Can verify facilities, manage all projects, manage users, approve impact updates.
- **organization**: Can create/manage their own facilities and projects, post impact updates for their projects.
- **donor**: Can browse projects, make donations, view their own donation history, and track impact.

## New Tables

### profiles
- Extends auth.users with role and display info.
- Columns: id (FK to auth.users), email, full_name, role (admin/organization/donor), organization_name, phone, created_at.
- Role column is NOT client-writable — protected by column-level privilege revocation.

## Modified Tables

### facilities
- Added `owner_id` (uuid, FK to auth.users, DEFAULT auth.uid()) — the organization that manages this facility.
- Existing data updated to set owner_id to NULL (system-managed) for seeded facilities.

### projects
- No new columns. RLS policies rewritten to be role-aware.

### donations
- Added `user_id` (uuid, FK to auth.users, DEFAULT auth.uid()) — links donation to authenticated donor.
- Existing donations updated to set user_id to NULL.

### impact_updates
- No new columns. RLS policies rewritten so only the facility owner or admin can create them.

## Security Changes

### RLS — All policies rewritten:
- **cities**: Public read (anon + authenticated). Only admin can write.
- **facilities**: All authenticated can read. Organization owners can insert/update/delete their own. Admin can do everything.
- **projects**: All authenticated can read. Organization owners can insert/update/delete projects on their own facilities. Admin can do everything.
- **donations**: Donors can read their own. Anyone authenticated can insert (donation). Admin can read all. Donors can update/delete only their own.
- **impact_updates**: All authenticated can read. Organization owners can insert/update for their own facilities' projects. Admin can do everything.
- **profiles**: Each user reads/updates their own profile. Admin can read all profiles.

### Column-Level Privileges
- REVOKE UPDATE on profiles.role FROM authenticated — role changes go through set_user_role() function only.
- GRANT UPDATE (full_name, organization_name, phone) ON profiles TO authenticated — users can edit their own display info.

### SECURITY DEFINER Functions
- **set_user_role(p_user_id, p_role)**: Admin-only function to change a user's role. Validates role value.
- **verify_facility(p_facility_id, p_status)**: Admin-only function to set facility verification status.
- **create_impact_update(...)**: Organization-owner or admin function to post impact updates with authorization check.

## Important Notes
1. The `role` column in profiles is protected — users cannot change their own role.
2. Organization owners can only manage facilities where owner_id = auth.uid().
3. Donor donations are linked via user_id (defaults to auth.uid()).
4. Admin role has full access to all tables through RLS policies.
5. Email confirmation remains OFF (per Supabase defaults).
*/
