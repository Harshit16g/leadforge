-- Migration 20260421000001_final_rls_wa_conversations.sql
-- Adds: comms.wa_conversations + full RLS on all schemas + helper functions

-- 1. New table for WhatsApp interaction metadata
CREATE TABLE IF NOT EXISTS comms.wa_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs.organizations(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES crm.customers(id) ON DELETE SET NULL,
  booking_id uuid REFERENCES crm.bookings(id) ON DELETE SET NULL,
  evo_conversation_id text,                    -- from Evolution API
  evo_contact_phone text NOT NULL,
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  issue_category text,                         -- e.g. 'booking_query', 'complaint'
  resolution_status text DEFAULT 'open' CHECK (resolution_status IN ('open', 'resolved', 'escalated', 'closed')),
  resolution_notes text,
  resolved_by uuid REFERENCES auth.users(id),
  resolved_at timestamptz,
  first_message_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz NOT NULL DEFAULT now(),
  message_count integer DEFAULT 1,
  sentiment_score numeric CHECK (sentiment_score BETWEEN -1 AND 1),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wa_conversations_org ON comms.wa_conversations(org_id);
CREATE INDEX IF NOT EXISTS idx_wa_conversations_customer ON comms.wa_conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_wa_conversations_status ON comms.wa_conversations(resolution_status);
CREATE INDEX IF NOT EXISTS idx_wa_conversations_phone ON comms.wa_conversations(evo_contact_phone);

ALTER TABLE comms.wa_conversations ENABLE ROW LEVEL SECURITY;

-- 2. Helper functions (public schema — safe & stable)
CREATE OR REPLACE FUNCTION public.get_user_org_id(p_user_id uuid)
RETURNS uuid AS $$
  SELECT context_id FROM iam.actor_roles 
  WHERE user_id = p_user_id 
    AND context_type = 'org' 
    AND is_active = true
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 3. Additional Logic Helpers
CREATE OR REPLACE FUNCTION comms.handle_wa_webhook(
  p_payload jsonb
) RETURNS void AS $$
BEGIN
  -- Upsert logic stub for wa_conversations
  -- To be implemented based on exact Evolution API payload schema
  NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Full RLS policies (applied to every table)

-- iam.* — platform admins only
ALTER TABLE iam.actor_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "iam_actor_roles_admin_only" ON iam.actor_roles FOR ALL TO authenticated
USING (iam.check_permission(auth.uid(), 'auth_iam', 'manage', 'platform'));

ALTER TABLE iam.roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "iam_roles_view" ON iam.roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "iam_roles_manage" ON iam.roles FOR ALL TO authenticated
USING (iam.check_permission(auth.uid(), 'auth_iam', 'manage', 'platform'));

-- orgs.* — owner/partner context
ALTER TABLE orgs.organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orgs_organizations_own_org" ON orgs.organizations FOR ALL TO authenticated
USING (id = public.get_user_org_id(auth.uid()) OR iam.check_permission(auth.uid(), 'settings', 'configure', 'platform'));

ALTER TABLE orgs.branches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orgs_branches_own_org" ON orgs.branches FOR ALL TO authenticated
USING (org_id = public.get_user_org_id(auth.uid()));

-- comms.wa_conversations (new table)
CREATE POLICY "comms_wa_conversations_own_org" ON comms.wa_conversations FOR ALL TO authenticated
USING (org_id = public.get_user_org_id(auth.uid()));

-- public.profiles (kept in public)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_self" ON public.profiles FOR ALL TO authenticated
USING (id = auth.uid());

-- Grant usage on all schemas (idempotent)
GRANT USAGE ON SCHEMA iam, orgs, crm, ops, scheduling, inventory, billing, comms, platform, analytics
TO authenticated, anon, service_role;

-- Enable RLS on every table (idempotent)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT schemaname, tablename FROM pg_tables 
           WHERE schemaname IN ('iam','orgs','crm','ops','scheduling','inventory','billing','comms','platform','analytics')
  LOOP
    EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY;', r.schemaname, r.tablename);
  END LOOP;
END $$;
