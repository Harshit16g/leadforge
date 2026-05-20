-- ============================================================
-- Fix: Drop FK constraint on leads.archived_by
-- archived_by references public.profiles (not auth.users).
-- We use a soft link (no FK) — same pattern as assigned_to.
-- ============================================================

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_archived_by_fkey;

COMMENT ON COLUMN public.leads.archived_by IS
  'References public.profiles(id) — soft link, no FK constraint for seed flexibility';
