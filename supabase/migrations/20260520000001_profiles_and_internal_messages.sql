-- ============================================================
-- DriveFlow CRM — Profiles + Internal Messaging Migration
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. PUBLIC.PROFILES
--    Standalone table (no auth.users FK) — prototype sandbox
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('manager', 'sales')),
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Seed the three prototype users (idempotent)
INSERT INTO public.profiles (id, name, email, role) VALUES
  ('22222222-2222-2222-2222-222222222222', 'Michael Chen',  'michael@hsrmotors.in', 'manager'),
  ('11111111-1111-1111-1111-111111111111', 'Sarah Jenkins', 'sarah@hsrmotors.in',   'sales'),
  ('44444444-4444-4444-4444-444444444444', 'Priya Sharma',  'priya@hsrmotors.in',   'sales')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS but allow all for prototype (no real auth)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_open" ON public.profiles;
CREATE POLICY "profiles_open" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- 2. PUBLIC.INTERNAL_MESSAGES
--    Direct thread between two profiles. Thread ID is derived
--    deterministically from sorted participant IDs so both
--    sides share the same row set.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.internal_messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id    TEXT NOT NULL,          -- "direct:<lower_id>-<higher_id>"
  sender_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body         TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_internal_messages_thread ON public.internal_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_internal_messages_sender ON public.internal_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_internal_messages_recipient ON public.internal_messages(recipient_id);

-- RLS — open for prototype
ALTER TABLE public.internal_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "messages_open" ON public.internal_messages;
CREATE POLICY "messages_open" ON public.internal_messages FOR ALL USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- 3. PATCH LEADS — soft-link assigned_to to profiles
--    (no hard FK to keep seeds working without auth)
-- ─────────────────────────────────────────────────────────────
COMMENT ON COLUMN public.leads.assigned_to IS
  'References public.profiles(id) — soft link, no FK constraint for seed flexibility';
