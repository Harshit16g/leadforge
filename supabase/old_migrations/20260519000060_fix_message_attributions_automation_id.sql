-- ============================================================
-- 20260519000060_fix_message_attributions_automation_id.sql
--
-- Add missing automation_id column to comms.message_attributions
-- and fix comms.upsert_message_attributions_v1 to insert p_org_id.
-- ============================================================

-- 1. Ensure automation_id column exists
ALTER TABLE comms.message_attributions 
ADD COLUMN IF NOT EXISTS automation_id UUID REFERENCES comms.automation_rules(id) ON DELETE SET NULL;

-- 2. Update database function comms.upsert_message_attributions_v1
CREATE OR REPLACE FUNCTION comms.upsert_message_attributions_v1(
    p_actor_id uuid,
    p_message_id uuid,
    p_org_id uuid,
    p_campaign_id uuid DEFAULT NULL,
    p_automation_id uuid DEFAULT NULL,
    p_customer_id uuid DEFAULT NULL,
    p_message_attributions_id uuid DEFAULT NULL,
    p_actor_role text DEFAULT 'partner'
) RETURNS comms.message_attributions
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = comms, platform, public
AS $$
DECLARE
    v_result comms.message_attributions;
    v_action text;
BEGIN
    IF p_message_attributions_id IS NOT NULL THEN
        UPDATE comms.message_attributions SET
            message_id = COALESCE(p_message_id, message_id),
            campaign_id = COALESCE(p_campaign_id, campaign_id),
            automation_id = COALESCE(p_automation_id, automation_id),
            customer_id = COALESCE(p_customer_id, customer_id),
            updated_at = now()
        WHERE id = p_message_attributions_id AND (org_id = p_org_id OR p_org_id IS NULL)
        RETURNING * INTO v_result;

        IF NOT FOUND THEN RAISE EXCEPTION 'message_attributions_not_found'; END IF;
        v_action := 'comms.attribution.updated';
    ELSE
        INSERT INTO comms.message_attributions (
            org_id, message_id, campaign_id, automation_id, customer_id
        ) VALUES (
            p_org_id, p_message_id, p_campaign_id, p_automation_id, p_customer_id
        ) RETURNING * INTO v_result;
        v_action := 'comms.attribution.created';
        p_message_attributions_id := v_result.id;
    END IF;

    -- Audit Log (L0)
    PERFORM platform.write_audit_log(
        p_org_id, p_actor_id, p_actor_role,
        v_action, 'message_attributions', p_message_attributions_id::text,
        jsonb_build_object('id', v_result.id)
    );

    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION comms.upsert_message_attributions_v1 TO authenticated;
