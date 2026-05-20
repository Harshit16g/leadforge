-- Update comms.upsert_wa_sessions_v1 to include status

CREATE OR REPLACE FUNCTION comms.upsert_wa_sessions_v1(
    p_actor_id uuid,
    p_wa_id text DEFAULT NULL,
    p_session_data jsonb DEFAULT NULL,
    p_expires_at timestamp with time zone DEFAULT NULL,
    p_org_id uuid DEFAULT NULL,
    p_status text DEFAULT NULL,
    p_wa_sessions_id uuid DEFAULT NULL,
    p_actor_role text DEFAULT 'partner'
) RETURNS comms.wa_sessions
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = comms, platform, public
AS $$
DECLARE
    v_result comms.wa_sessions;
    v_action text;
BEGIN
    IF p_wa_sessions_id IS NOT NULL THEN
        UPDATE comms.wa_sessions SET
            wa_id = COALESCE(p_wa_id, wa_id),
            session_data = COALESCE(p_session_data, session_data),
            expires_at = COALESCE(p_expires_at, expires_at),
            status = COALESCE(p_status, status),
            updated_at = now()
        WHERE id = p_wa_sessions_id AND (org_id = p_org_id OR p_org_id IS NULL)
        RETURNING * INTO v_result;

        IF NOT FOUND THEN RAISE EXCEPTION 'wa_sessions_not_found'; END IF;
        v_action := 'comms.wa_session.updated';
    ELSE
        INSERT INTO comms.wa_sessions (
            org_id, wa_id, session_data, expires_at, status
        ) VALUES (
            p_org_id, p_wa_id, p_session_data, p_expires_at, COALESCE(p_status, 'disconnected')
        ) RETURNING * INTO v_result;
        
        p_wa_sessions_id := v_result.id;
        v_action := 'comms.wa_session.created';
    END IF;

    -- Audit Log
    PERFORM platform.write_audit_log(
        v_result.org_id,
        p_actor_id,
        p_actor_role,
        v_action,
        'wa_sessions',
        v_result.id::text,
        jsonb_build_object('status', v_result.status, 'wa_id', v_result.wa_id)
    );

    RETURN v_result;
END;
$$;
