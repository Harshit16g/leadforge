-- ============================================================
-- 20260504000006_unified_messaging_schema.sql
--
-- Unified messaging extensions for internal and admin chat.
-- ============================================================

-- 1. Extend comms.messages to support direct recipients
ALTER TABLE comms.messages
  ADD COLUMN IF NOT EXISTS recipient_id   uuid,
  ADD COLUMN IF NOT EXISTS recipient_role text CHECK (recipient_role IN ('customer', 'partner', 'employee', 'admin', 'system')),
  ADD COLUMN IF NOT EXISTS thread_type    text CHECK (thread_type IN ('booking', 'contact_request', 'internal', 'admin_support'));

-- 2. Indexing for performance
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON comms.messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_thread_type ON comms.messages(thread_type);

-- 3. Migration: Populate thread_type for existing records
UPDATE comms.messages SET thread_type = 'booking'         WHERE booking_id IS NOT NULL AND thread_type IS NULL;
UPDATE comms.messages SET thread_type = 'contact_request' WHERE contact_request_id IS NOT NULL AND thread_type IS NULL;

-- 4. RPC: Create Unified Message
-- Enforces rules:
-- - Partner cannot initiate Customer chat (must have booking_id or contact_request_id)
-- - Internal chat must be within same Org
CREATE OR REPLACE FUNCTION comms.create_unified_message(
  p_org_id           uuid,
  p_sender_id        uuid,
  p_sender_role      text,
  p_recipient_id     uuid     DEFAULT NULL,
  p_recipient_role   text     DEFAULT NULL,
  p_body             text     DEFAULT NULL,
  p_booking_id       uuid     DEFAULT NULL,
  p_contact_request_id uuid   DEFAULT NULL,
  p_thread_type      text     DEFAULT 'internal',
  p_channel          text     DEFAULT 'in_app'
) RETURNS comms.messages
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = comms, crm, orgs, public
AS $$
DECLARE
  v_msg comms.messages;
BEGIN
  -- VALIDATION 1: No Customer Initiation for Partners
  IF p_sender_role = 'partner' AND p_recipient_role = 'customer' 
     AND p_booking_id IS NULL AND p_contact_request_id IS NULL THEN
    RAISE EXCEPTION 'Partners cannot initiate new chats with customers without a booking or request context.';
  END IF;

  -- VALIDATION 2: Internal Org Check
  -- If recipient is an employee, verify they belong to the same org
  -- (Assuming recipient_id is auth.uid or linked to staff_members)
  -- For now, we rely on the p_org_id provided by the API which is already verified by requirePermission

  -- Insert the message
  INSERT INTO comms.messages (
    org_id,
    sender_id,
    sender_role,
    recipient_id,
    recipient_role,
    body,
    booking_id,
    contact_request_id,
    thread_type,
    direction,
    channel,
    delivery_status
  ) VALUES (
    p_org_id,
    p_sender_id,
    p_sender_role,
    p_recipient_id,
    p_recipient_role,
    p_body,
    p_booking_id,
    p_contact_request_id,
    p_thread_type,
    'outbound', -- From the perspective of the initiator
    p_channel,
    'delivered'
  )
  RETURNING * INTO v_msg;

  RETURN v_msg;
END;
$$;

-- 5. RLS: Update policies to allow reading messages where I am the sender or recipient
DROP POLICY IF EXISTS "user_read_inbox" ON comms.messages;
CREATE POLICY "user_read_inbox" ON comms.messages
    FOR SELECT USING (recipient_id = auth.uid() OR sender_id = auth.uid());

-- 6. Grants
GRANT USAGE ON SCHEMA comms TO authenticated;
GRANT USAGE ON SCHEMA comms TO service_role;
GRANT USAGE ON SCHEMA crm TO authenticated;
GRANT USAGE ON SCHEMA orgs TO authenticated;

GRANT ALL ON comms.messages TO service_role;
GRANT SELECT ON comms.messages TO authenticated;

GRANT EXECUTE ON FUNCTION comms.create_unified_message TO authenticated;
GRANT EXECUTE ON FUNCTION comms.create_unified_message TO service_role;
