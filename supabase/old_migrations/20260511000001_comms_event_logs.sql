-- ============================================================
-- 20260511000001_comms_event_logs.sql
--
-- Event pipeline audit log for the marketing automation engine.
-- Every internal trigger point (booking.completed, walkin.started, etc.)
-- is logged here before any automation rule or system notification fires.
-- ============================================================

-- 1. Event Logs — full audit trail of every trigger point hit
CREATE TABLE IF NOT EXISTS comms.event_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES orgs.organizations(id) ON DELETE CASCADE,
    event_type      TEXT NOT NULL,                    -- e.g. 'booking.completed', 'walkin.started'
    source          TEXT NOT NULL DEFAULT 'system',   -- 'system' | 'automation' | 'campaign' | 'manual'
    payload         JSONB NOT NULL DEFAULT '{}'::jsonb, -- booking_id, customer_id, staff_id, etc.
    rules_matched   INTEGER NOT NULL DEFAULT 0,       -- how many automation rules fired for this event
    processing_ms   INTEGER,                          -- time taken to process all rules (ms)
    error_message   TEXT,                             -- any error during rule processing
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_event_logs_org_type
    ON comms.event_logs(org_id, event_type);

CREATE INDEX IF NOT EXISTS idx_event_logs_created
    ON comms.event_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_event_logs_org_created
    ON comms.event_logs(org_id, created_at DESC);

-- 2. Enable RLS
ALTER TABLE comms.event_logs ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
CREATE POLICY "Users can view their org's event logs"
    ON comms.event_logs
    FOR SELECT
    USING (org_id IN (
        SELECT org_id FROM public.profiles WHERE id = auth.uid()
    ));

-- Service role has full access (bypasses RLS)

-- 4. Grants
GRANT SELECT ON comms.event_logs TO authenticated;
GRANT ALL ON comms.event_logs TO service_role;
