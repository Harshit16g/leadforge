-- Functional Sampling across all domains
-- Picks one table per domain and performs an INSERT + AUDIT check

DO $$
DECLARE
    v_org_id uuid := 'f52a3d0c-3ddc-427d-8222-326a960bebfe';
    v_actor_id uuid := '0ea5ff35-7521-4675-af68-3dcc62153395';
    v_res record;
    v_audit record;
BEGIN
    RAISE NOTICE '🚀 Starting Functional Sampling...';

    -- 1. Inventory
    RAISE NOTICE 'Testing Inventory...';
    v_res := inventory.upsert_products_v1(
        p_actor_id := v_actor_id,
        p_org_id := v_org_id,
        p_name := 'Test Product Sampling',
        p_unit := 'pcs',
        p_purchase_price := 10.0,
        p_selling_price := 15.0,
        p_gst_rate := 18.0,
        p_current_stock := 100,
        p_reorder_level := 10,
        p_is_active := true
    );
    SELECT * INTO v_audit FROM platform.audit_logs WHERE target_id = v_res.id::text ORDER BY created_at DESC LIMIT 1;
    IF v_audit.id IS NOT NULL THEN RAISE NOTICE '✅ Inventory Success! ID: %, Audit: %', v_res.id, v_audit.action; ELSE RAISE EXCEPTION '❌ Inventory Audit Failed'; END IF;

    -- 2. Ops
    RAISE NOTICE 'Testing Ops...';
    v_res := ops.upsert_staff_members_v1(
        p_actor_id := v_actor_id,
        p_org_id := v_org_id,
        p_name := 'Test Staff Sampling',
        p_role := 'manager',
        p_phone := '5550101',
        p_is_active := true
    );
    SELECT * INTO v_audit FROM platform.audit_logs WHERE target_id = v_res.id::text ORDER BY created_at DESC LIMIT 1;
    IF v_audit.id IS NOT NULL THEN RAISE NOTICE '✅ Ops Success! ID: %, Audit: %', v_res.id, v_audit.action; ELSE RAISE EXCEPTION '❌ Ops Audit Failed'; END IF;

    -- 3. CRM
    RAISE NOTICE 'Testing CRM...';
    v_res := crm.upsert_customers_v1(
        p_actor_id := v_actor_id,
        p_org_id := v_org_id,
        p_name := 'Jane Doe Sampling',
        p_phone := '5550202',
        p_is_active := true,
        p_loyalty_points := 0
    );
    SELECT * INTO v_audit FROM platform.audit_logs WHERE target_id = v_res.id::text ORDER BY created_at DESC LIMIT 1;
    IF v_audit.id IS NOT NULL THEN RAISE NOTICE '✅ CRM Success! ID: %, Audit: %', v_res.id, v_audit.action; ELSE RAISE EXCEPTION '❌ CRM Audit Failed'; END IF;

    -- 4. Billing
    RAISE NOTICE 'Testing Billing...';
    v_res := billing.upsert_plans_v1(
        p_actor_id := v_actor_id,
        p_org_id := v_org_id,
        p_name := 'Pro Plan Sampling',
        p_price := 999.0,
        p_billing_cycle := 'monthly',
        p_is_active := true
    );
    SELECT * INTO v_audit FROM platform.audit_logs WHERE target_id = v_res.id::text ORDER BY created_at DESC LIMIT 1;
    IF v_audit.id IS NOT NULL THEN RAISE NOTICE '✅ Billing Success! ID: %, Audit: %', v_res.id, v_audit.action; ELSE RAISE EXCEPTION '❌ Billing Audit Failed'; END IF;

    RAISE NOTICE '🏁 Functional Sampling Complete!';
END $$;
