/*
# Add Secure Donation Flow

## Overview
Adds one server-enforced donation operation so authenticated donors can donate without
attempting a client-side write to protected project funding fields.

## Modified Tables
- `donations.user_id`: defaults to the authenticated user when omitted.
- `projects`: no columns changed; project funding is updated by the protected function.

## Security Changes
1. Donation amounts are validated inside the database.
2. The project must be verified and active at the moment of donation.
3. The authenticated caller is taken from `auth.uid()` and cannot be supplied by the client.
4. The donation insert and project funding update run together inside one SECURITY DEFINER
   database function.
5. The function is callable by authenticated users only; anonymous users cannot call it.

## Data Safety
- No tables, rows, or columns are deleted.
- Existing donations and project totals are preserved.
*/

ALTER TABLE donations
  ALTER COLUMN user_id SET DEFAULT auth.uid();

CREATE OR REPLACE FUNCTION create_donation(
  p_project_id uuid,
  p_donor_name text,
  p_donor_email text,
  p_amount numeric,
  p_currency text,
  p_recurring boolean,
  p_frequency text
)
RETURNS TABLE (
  donation_id uuid,
  receipt_number text,
  collected_amount numeric,
  project_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_project projects%ROWTYPE;
  v_donation donations%ROWTYPE;
  v_new_collected numeric;
  v_new_status text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 OR p_amount > 100000 THEN
    RAISE EXCEPTION 'Invalid donation amount';
  END IF;

  IF p_currency IS DISTINCT FROM 'OMR' THEN
    RAISE EXCEPTION 'Unsupported currency';
  END IF;

  IF p_frequency IS NULL OR p_frequency NOT IN ('one-time', 'weekly', 'monthly', 'custom') THEN
    RAISE EXCEPTION 'Invalid donation frequency';
  END IF;

  SELECT * INTO v_project
  FROM projects
  WHERE id = p_project_id
    AND verified = true
    AND status = 'active'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Project is unavailable';
  END IF;

  v_new_collected := v_project.collected_amount + p_amount;
  v_new_status := CASE
    WHEN v_new_collected >= v_project.target_amount THEN 'funded'
    ELSE 'active'
  END;

  INSERT INTO donations (
    project_id,
    user_id,
    donor_name,
    donor_email,
    amount,
    currency,
    recurring,
    frequency,
    status
  ) VALUES (
    p_project_id,
    v_user_id,
    NULLIF(trim(p_donor_name), ''),
    NULLIF(trim(p_donor_email), ''),
    p_amount,
    'OMR',
    COALESCE(p_recurring, false),
    p_frequency,
    'completed'
  )
  RETURNING * INTO v_donation;

  UPDATE projects
  SET collected_amount = v_new_collected,
      status = v_new_status,
      updated_at = now()
  WHERE id = p_project_id;

  donation_id := v_donation.id;
  receipt_number := v_donation.receipt_number;
  collected_amount := v_new_collected;
  project_status := v_new_status;
  RETURN NEXT;
END;
$$;

REVOKE EXECUTE ON FUNCTION create_donation(uuid, text, text, numeric, text, boolean, text) FROM anon;
GRANT EXECUTE ON FUNCTION create_donation(uuid, text, text, numeric, text, boolean, text) TO authenticated;
