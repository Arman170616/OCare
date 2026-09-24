/*
# Add Donation Delivery Tracking

## Overview
Adds a delivery-status field to donations so donors can track their contribution from
"received" through "preparing", "on the way", to "delivered". The responsible organization
updates the status; the donor sees a live timeline.

## Modified Tables
- `donations`: adds `delivery_status` text column (default 'received') and `delivery_updated_at` timestamp.

## New Functions
- `update_donation_delivery_status(p_donation_id, p_status)`: lets the organization that owns
  the donation's project advance the delivery status. SECURITY DEFINER, callable by authenticated only.

## Security Changes
- Direct UPDATE on donations remains revoked from authenticated (locked down previously).
- The new function validates that the caller owns the facility tied to the donation's project
  (or is an admin) before updating the delivery status.
- Donors can still read their own donations via the existing SELECT policy.

## Data Safety
- No existing donation data is changed. The new column defaults to 'received' for all existing rows.
*/

ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS delivery_status text NOT NULL DEFAULT 'received'
    CHECK (delivery_status IN ('received', 'preparing', 'on_the_way', 'delivered')),
  ADD COLUMN IF NOT EXISTS delivery_updated_at timestamptz DEFAULT now();

CREATE OR REPLACE FUNCTION update_donation_delivery_status(
  p_donation_id uuid,
  p_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_donation donations%ROWTYPE;
  v_facility_owner uuid;
BEGIN
  SELECT * INTO v_donation FROM donations WHERE id = p_donation_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Donation not found';
  END IF;

  IF p_status NOT IN ('received', 'preparing', 'on_the_way', 'delivered') THEN
    RAISE EXCEPTION 'Invalid delivery status';
  END IF;

  SELECT f.owner_id INTO v_facility_owner
  FROM donations d
  JOIN projects p ON p.id = d.project_id
  JOIN facilities f ON f.id = p.facility_id
  WHERE d.id = p_donation_id;

  IF v_facility_owner IS DISTINCT FROM auth.uid() AND NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized to update this donation';
  END IF;

  UPDATE donations
  SET delivery_status = p_status,
      delivery_updated_at = now()
  WHERE id = p_donation_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION update_donation_delivery_status(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION update_donation_delivery_status(uuid, text) TO authenticated;
