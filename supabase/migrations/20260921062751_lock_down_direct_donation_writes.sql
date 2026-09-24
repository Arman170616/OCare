/*
# Lock Down Direct Donation Writes

## Overview
Ensures completed donations can only be created through the validated `create_donation()`
function. This prevents a browser client from inserting an unlinked donation or changing a
project total independently.

## Security Changes
- Revokes direct INSERT, UPDATE, and DELETE table privileges for authenticated users on
  `donations`.
- The protected donation function remains available to authenticated users and performs the
  authorized insert as its owner.
- Donation SELECT access remains governed by the existing owner-or-admin RLS policy.

## Data Safety
- No existing donations are changed or deleted.
*/

REVOKE INSERT, UPDATE, DELETE ON donations FROM authenticated;
DROP POLICY IF EXISTS "insert_donations_authenticated" ON donations;
DROP POLICY IF EXISTS "update_donations_owner_or_admin" ON donations;
DROP POLICY IF EXISTS "delete_donations_owner_or_admin" ON donations;
