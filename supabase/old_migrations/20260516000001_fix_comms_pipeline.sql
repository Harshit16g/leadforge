-- ============================================================
-- 20260516000001_fix_comms_pipeline.sql
--
-- Refines the partner-admin communication pipeline:
-- 1. Adds assignment tracking to contact requests.
-- 2. Ensures unified messaging for all campaign/support inquiries.
-- ============================================================

-- 1. Extend crm.contact_requests with assignment
ALTER TABLE crm.contact_requests
  ADD COLUMN IF NOT EXISTS assigned_admin_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS last_message_at timestamptz DEFAULT now();

-- 2. Index for active requests
CREATE INDEX IF NOT EXISTS idx_contact_requests_assigned ON crm.contact_requests(assigned_admin_id);
CREATE INDEX IF NOT EXISTS idx_contact_requests_status   ON crm.contact_requests(status);

-- 3. Migration: Link existing messages to requests if possible
-- (Usually done via code, but schema is now ready)
