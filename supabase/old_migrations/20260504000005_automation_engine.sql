-- ─── Automation Engine Schema ───

-- Create automation_rules table in comms schema
CREATE TABLE IF NOT EXISTS comms.automation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES orgs.organizations(id) ON DELETE CASCADE,
    rule_name TEXT NOT NULL,
    trigger_event TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT 'whatsapp',
    trigger_offset_minutes INTEGER DEFAULT 0,
    template_id UUID REFERENCES comms.templates(id) ON DELETE SET NULL,
    conditions JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    total_fired INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for org-level fetching
CREATE INDEX IF NOT EXISTS idx_automation_rules_org ON comms.automation_rules(org_id);

-- Create automation_logs table for tracking
CREATE TABLE IF NOT EXISTS comms.automation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID REFERENCES comms.automation_rules(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES orgs.organizations(id) ON DELETE CASCADE,
    recipient_phone TEXT NOT NULL,
    template_id UUID REFERENCES comms.templates(id),
    status TEXT NOT NULL DEFAULT 'queued', -- queued, sent, delivered, read, failed
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for stats and activity
CREATE INDEX IF NOT EXISTS idx_automation_logs_org_status ON comms.automation_logs(org_id, status);
CREATE INDEX IF NOT EXISTS idx_automation_logs_created ON comms.automation_logs(created_at DESC);

-- Enable RLS
ALTER TABLE comms.automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE comms.automation_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their org's rules" ON comms.automation_rules
    FOR SELECT USING (org_id = (SELECT org_id FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can manage their org's rules" ON comms.automation_rules
    FOR ALL USING (org_id = (SELECT org_id FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can view their org's logs" ON comms.automation_logs
    FOR SELECT USING (org_id = (SELECT org_id FROM auth.users WHERE id = auth.uid()));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION comms.update_automation_rule_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_update_automation_rule_timestamp
BEFORE UPDATE ON comms.automation_rules
FOR EACH ROW EXECUTE FUNCTION comms.update_automation_rule_timestamp();
