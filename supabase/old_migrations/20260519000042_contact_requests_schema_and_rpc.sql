BEGIN;

-- 1. Add missing columns to crm.contact_requests
ALTER TABLE crm.contact_requests ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE crm.contact_requests ADD COLUMN IF NOT EXISTS follow_up_date timestamp with time zone;

-- 2. Update crm.upsert_contact_requests_v1 to include new columns and make parameters optional
CREATE OR REPLACE FUNCTION crm.upsert_contact_requests_v1(
    p_actor_id uuid,
    p_contact_name text DEFAULT NULL,
    p_phone text DEFAULT NULL,
    p_source text DEFAULT NULL,
    p_status text DEFAULT NULL,
    p_org_id uuid DEFAULT NULL,
    p_business_name text DEFAULT NULL,
    p_email text DEFAULT NULL,
    p_city text DEFAULT NULL,
    p_message text DEFAULT NULL,
    p_assigned_to uuid DEFAULT NULL,
    p_assigned_admin_id uuid DEFAULT NULL,
    p_last_message_at timestamp with time zone DEFAULT NULL,
    p_notes text DEFAULT NULL,
    p_follow_up_date timestamp with time zone DEFAULT NULL,
    p_contact_requests_id uuid DEFAULT NULL,
    p_actor_role text DEFAULT 'partner'
) RETURNS crm.contact_requests
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = crm, platform, public
AS $$
DECLARE
    v_result crm.contact_requests;
    v_action text;
BEGIN
    IF p_contact_requests_id IS NOT NULL THEN
        UPDATE crm.contact_requests SET
            business_name = COALESCE(p_business_name, business_name),
            contact_name = COALESCE(p_contact_name, contact_name),
            phone = COALESCE(p_phone, phone),
            email = COALESCE(p_email, email),
            city = COALESCE(p_city, city),
            message = COALESCE(p_message, message),
            source = COALESCE(p_source, source),
            status = COALESCE(p_status, status),
            assigned_to = COALESCE(p_assigned_to, assigned_to),
            assigned_admin_id = COALESCE(p_assigned_admin_id, assigned_admin_id),
            last_message_at = COALESCE(p_last_message_at, last_message_at),
            notes = COALESCE(p_notes, notes),
            follow_up_date = COALESCE(p_follow_up_date, follow_up_date),
            updated_at = now()
        WHERE id = p_contact_requests_id AND (org_id = p_org_id OR p_org_id IS NULL)
        RETURNING * INTO v_result;

        IF NOT FOUND THEN RAISE EXCEPTION 'contact_requests_not_found'; END IF;
        v_action := 'crm.contact_request.updated';
    ELSE
        INSERT INTO crm.contact_requests (
            org_id, business_name, contact_name, phone, email, city, message, source, status, assigned_to, assigned_admin_id, last_message_at, notes, follow_up_date
        ) VALUES (
            p_org_id, p_business_name, COALESCE(p_contact_name, 'Unknown'), COALESCE(p_phone, 'Unknown'), COALESCE(p_source, 'website'), COALESCE(p_status, 'unread'), p_assigned_to, p_assigned_admin_id, p_last_message_at, p_notes, p_follow_up_date
        ) RETURNING * INTO v_result;
        v_action := 'crm.contact_request.created';
        p_contact_requests_id := v_result.id;
    END IF;

    -- Audit Log (L0)
    PERFORM platform.write_audit_log(
        p_org_id, p_actor_id, p_actor_role,
        v_action, 'contact_requests', p_contact_requests_id::text,
        jsonb_build_object('id', v_result.id)
    );

    RETURN v_result;
END;
$$;

-- 3. Update public.upsert_contact_requests_v1 wrapper
CREATE OR REPLACE FUNCTION public.upsert_contact_requests_v1(
    p_actor_id uuid DEFAULT NULL,
    p_org_id uuid DEFAULT NULL,
    p_contact_name text DEFAULT NULL,
    p_contact_phone text DEFAULT NULL,
    p_contact_email text DEFAULT NULL,
    p_business_name text DEFAULT NULL,
    p_business_type text DEFAULT NULL,
    p_city text DEFAULT NULL,
    p_message text DEFAULT NULL,
    p_status text DEFAULT NULL,
    p_assigned_to uuid DEFAULT NULL,
    p_notes text DEFAULT NULL,
    p_follow_up_date timestamp with time zone DEFAULT NULL,
    p_contact_requests_id uuid DEFAULT NULL,
    p_actor_role text DEFAULT 'partner'
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    RETURN crm.upsert_contact_requests_v1(
        p_actor_id := p_actor_id,
        p_org_id := p_org_id,
        p_contact_name := p_contact_name,
        p_phone := p_contact_phone,
        p_status := p_status,
        p_business_name := p_business_name,
        p_email := p_contact_email,
        p_city := p_city,
        p_message := p_message,
        p_assigned_to := p_assigned_to,
        p_notes := p_notes,
        p_follow_up_date := p_follow_up_date,
        p_contact_requests_id := p_contact_requests_id,
        p_actor_role := p_actor_role
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_contact_requests_v1(UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TIMESTAMPTZ, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.upsert_contact_requests_v1(UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TIMESTAMPTZ, UUID, TEXT) TO authenticated;

COMMIT;
