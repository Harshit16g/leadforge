-- ============================================================
-- Migration: Leads Ledger Archive System
-- Adds soft-delete archive columns to the leads table
-- and a helper view for the manager Ledger page.
-- ============================================================

-- 1. Add archive columns to leads
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS archived        boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS archived_at     timestamptz,
  ADD COLUMN IF NOT EXISTS archived_by     uuid        REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Index for fast ledger queries
CREATE INDEX IF NOT EXISTS idx_leads_archived ON leads(archived);
CREATE INDEX IF NOT EXISTS idx_leads_archived_at ON leads(archived_at DESC);

-- 3. Ledger view: archived leads joined with assigned rep profile
CREATE OR REPLACE VIEW ledger_entries AS
SELECT
  l.id,
  l.name,
  l.email,
  l.phone,
  l.business_name,
  l.source,
  l.status,
  l.score,
  l.health,
  l.notes,
  l.created_at,
  l.archived_at,
  l.archived_by,
  -- Assigned sales rep info
  l.assigned_to,
  p.name       AS rep_name,
  p.avatar_url AS rep_avatar,
  -- Archived by manager info
  m.name       AS archived_by_name
FROM leads l
LEFT JOIN public.profiles p ON p.id = l.assigned_to
LEFT JOIN public.profiles m ON m.id = l.archived_by
WHERE l.archived = true
ORDER BY l.archived_at DESC;

-- 4. Grant read access to authenticated users (RLS on leads table handles row-level security)
GRANT SELECT ON ledger_entries TO authenticated;
