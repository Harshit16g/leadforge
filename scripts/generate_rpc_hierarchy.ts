
import fs from 'fs';
import path from 'path';

interface TableSpec {
  schema: string;
  table: string;
  auditCategory: string;
  actorRole?: string;
  columns: {
    name: string;
    type: string;
    isPrimary?: boolean;
    isNullable?: boolean;
    default?: string;
  }[];
}

interface L2Spec {
  name: string;
  params: { name: string; type: string; default?: string }[];
  body: string;
}

interface RPCGeneratorConfig {
  version: string;
  domain: string;
  tables: TableSpec[];
  l2Coordinators?: L2Spec[];
}

class RPCGenerator {
  private config: RPCGeneratorConfig;

  constructor(config: RPCGeneratorConfig) {
    this.config = config;
  }

  public generate(): string {
    let sql = `-- ============================================================\n`;
    sql += `-- Generated Migration: ${this.config.domain}_hierarchy_v${this.config.version}\n`;
    sql += `-- Generated At: ${new Date().toISOString()}\n`;
    sql += `-- ============================================================\n\n`;

    // Drop legacy triggers to harden the architecture
    if (this.config.domain === 'inventory') {
      sql += `-- Hardening: Moving trigger logic to RPCs\n`;
      sql += `DROP TRIGGER IF EXISTS trg_after_adjustment_stock_sync ON inventory.stock_adjustments;\n`;
      sql += `DROP FUNCTION IF EXISTS inventory.sync_stock_balance() CASCADE;\n\n`;
    }

    for (const table of this.config.tables) {
      sql += this.generateL1Upsert(table);
      sql += '\n';
      sql += this.generateL1Delete(table);
      sql += '\n';
    }

    if (this.config.l2Coordinators) {
      sql += `-- ─────────────────────────────────────────────────────────────────────────────\n`;
      sql += `-- L2 Coordinators\n`;
      sql += `-- ─────────────────────────────────────────────────────────────────────────────\n\n`;
      for (const l2 of this.config.l2Coordinators) {
        sql += this.generateL2(l2);
        sql += '\n';
      }
    }

    return sql;
  }

  private generateL2(l2: L2Spec): string {
    const fnName = `${this.config.domain}.${l2.name}_v${this.config.version}`;
    const paramsStr = l2.params.map(p => `    p_${p.name} ${p.type}${p.default ? ` DEFAULT ${p.default}` : ''}`).join(',\n');

    return `
-- L2: ${fnName}
DO $$ 
BEGIN
    EXECUTE (
        SELECT 'DROP FUNCTION ' || string_agg(oid::regprocedure::text, ', ') || ' CASCADE'
        FROM pg_proc 
        WHERE proname = '${l2.name}_v${this.config.version}' 
        AND pronamespace = '${this.config.domain}'::regnamespace
    );
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION ${fnName}(
${paramsStr}
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ${this.config.domain}, platform, public
AS $$
${l2.body}
$$;

GRANT EXECUTE ON FUNCTION ${fnName} TO authenticated;
`;
  }

  private generateL1Upsert(spec: TableSpec): string {
    const fnName = `${spec.schema}.upsert_${spec.table}_v${this.config.version}`;
    const auditCategory = spec.auditCategory;
    
    const columnParams = spec.columns
      .filter(c => !c.isPrimary && c.name !== 'org_id' && c.name !== 'actor_id')
      .map(c => ({
        name: `p_${c.name}`,
        type: c.type,
        default: c.isNullable ? 'DEFAULT NULL' : null
      }));

    // Sort: No defaults first, then defaults
    const orgIdCol = spec.columns.find(c => c.name === 'org_id');
    const orgIdParam = { name: 'p_org_id', type: 'uuid', default: orgIdCol?.isNullable ? 'DEFAULT NULL' : null };
    
    const sortedParams: { name: string; type: string; default?: string | null }[] = [
      { name: 'p_actor_id', type: 'uuid', default: undefined },
      ...columnParams.filter(p => !p.default),
      ...(orgIdParam.default ? [] : [orgIdParam]),
      ...(orgIdParam.default ? [orgIdParam] : []),
      ...columnParams.filter(p => p.default),
      { name: `p_${spec.table}_id`, type: 'uuid', default: 'DEFAULT NULL' },
      { name: 'p_actor_role', type: 'text', default: `DEFAULT '${spec.actorRole || 'partner'}'` }
    ];

    const paramsStr = sortedParams
      .map(p => `    ${p.name} ${p.type}${p.default ? ` ${p.default}` : ''}`)
      .join(',\n');

    const updateSet = spec.columns
      .filter(c => !c.isPrimary && c.name !== 'org_id' && c.name !== 'created_at' && c.name !== 'updated_at')
      .map(c => `            ${c.name} = COALESCE(p_${c.name}, ${c.name})`)
      .join(',\n');

    const insertCols = spec.columns
      .filter(c => c.name !== 'created_at' && c.name !== 'id')
      .map(c => c.name)
      .join(', ');

    const insertVals = spec.columns
      .filter(c => c.name !== 'created_at' && c.name !== 'id')
      .map(c => `p_${c.name}`)
      .join(', ');

    return `
-- L1: ${fnName}
DO $$ 
BEGIN
    EXECUTE (
        SELECT 'DROP FUNCTION ' || string_agg(oid::regprocedure::text, ', ') || ' CASCADE'
        FROM pg_proc 
        WHERE proname = 'upsert_${spec.table}_v${this.config.version}' 
        AND pronamespace = '${spec.schema}'::regnamespace
    );
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION ${fnName}(
${paramsStr}
) RETURNS ${spec.schema}.${spec.table}
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ${spec.schema}, platform, public
AS $$
DECLARE
    v_result ${spec.schema}.${spec.table};
    v_action text;
BEGIN
    IF p_${spec.table}_id IS NOT NULL THEN
        UPDATE ${spec.schema}.${spec.table} SET
${updateSet},
            updated_at = now()
        WHERE id = p_${spec.table}_id AND (org_id = p_org_id OR p_org_id IS NULL)
        RETURNING * INTO v_result;

        IF NOT FOUND THEN RAISE EXCEPTION '${spec.table}_not_found'; END IF;
        v_action := '${auditCategory}.updated';
    ELSE
        INSERT INTO ${spec.schema}.${spec.table} (
            ${insertCols}
        ) VALUES (
            ${insertVals}
        ) RETURNING * INTO v_result;
        v_action := '${auditCategory}.created';
        p_${spec.table}_id := v_result.id;
    END IF;

    -- Audit Log (L0)
    PERFORM platform.write_audit_log(
        p_org_id, p_actor_id, p_actor_role,
        v_action, '${spec.table}', p_${spec.table}_id::text,
        jsonb_build_object('id', v_result.id)
    );

    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION ${fnName} TO authenticated;
`;
  }

  private generateL1Delete(spec: TableSpec): string {
    const fnName = `${spec.schema}.delete_${spec.table}_v${this.config.version}`;
    const auditCategory = spec.auditCategory;

    return `
-- L1: ${fnName}
DO $$ 
BEGIN
    EXECUTE (
        SELECT 'DROP FUNCTION ' || string_agg(oid::regprocedure::text, ', ') || ' CASCADE'
        FROM pg_proc 
        WHERE proname = 'delete_${spec.table}_v${this.config.version}' 
        AND pronamespace = '${spec.schema}'::regnamespace
    );
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION ${fnName}(
    p_org_id   uuid,
    p_actor_id uuid,
    p_id       uuid,
    p_actor_role text DEFAULT 'partner'
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ${spec.schema}, platform, public
AS $$
BEGIN
    -- Soft delete if column exists, otherwise hard delete
    -- (Assuming standardized 'deleted_at' for this pattern)
    UPDATE ${spec.schema}.${spec.table}
    SET    deleted_at = now()
    WHERE  id = p_id AND (org_id = p_org_id OR p_org_id IS NULL);

    IF NOT FOUND THEN RETURN FALSE; END IF;

    -- Audit Log (L0)
    PERFORM platform.write_audit_log(
        p_org_id, p_actor_id, p_actor_role,
        '${auditCategory}.deleted', '${spec.table}', p_id::text,
        NULL
    );

    RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION ${fnName} TO authenticated;
`;
  }
}

// Configs mapping
export const configs: Record<string, RPCGeneratorConfig> = {
  inventory: {
    version: '1',
    domain: 'inventory',
    tables: [
      {
        schema: 'inventory',
        table: 'products',
        auditCategory: 'inventory.product',
        columns: [
          { name: 'org_id', type: 'uuid' },
          { name: 'name', type: 'text' },
          { name: 'category', type: 'text', isNullable: true },
          { name: 'brand', type: 'text', isNullable: true },
          { name: 'sku', type: 'text', isNullable: true },
          { name: 'unit', type: 'text' },
          { name: 'purchase_price', type: 'numeric' },
          { name: 'selling_price', type: 'numeric' },
          { name: 'gst_rate', type: 'numeric' },
          { name: 'current_stock', type: 'integer' },
          { name: 'reorder_level', type: 'integer' },
          { name: 'is_active', type: 'boolean' },
          { name: 'metadata', type: 'jsonb', isNullable: true }
        ]
      },
      {
        schema: 'inventory',
        table: 'suppliers',
        auditCategory: 'inventory.supplier',
        columns: [
          { name: 'org_id', type: 'uuid' },
          { name: 'name', type: 'text' },
          { name: 'phone', type: 'text', isNullable: true },
          { name: 'email', type: 'text', isNullable: true },
          { name: 'address', type: 'text', isNullable: true },
          { name: 'gst_number', type: 'text', isNullable: true },
          { name: 'notes', type: 'text', isNullable: true }
        ]
      },
      {
        schema: 'inventory',
        table: 'stock_adjustments',
        auditCategory: 'inventory.stock_adjustment',
        columns: [
          { name: 'org_id', type: 'uuid' },
          { name: 'product_id', type: 'uuid' },
          { name: 'adjustment_type', type: 'text' },
          { name: 'quantity', type: 'integer' },
          { name: 'reason', type: 'text' },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'created_by', type: 'uuid', isNullable: true }
        ]
      },
      {
        schema: 'inventory',
        table: 'stock_logs',
        auditCategory: 'inventory.stock_log',
        columns: [
          { name: 'org_id', type: 'uuid' },
          { name: 'product_id', type: 'uuid' },
          { name: 'change_type', type: 'text' },
          { name: 'quantity_diff', type: 'integer' },
          { name: 'stock_after', type: 'integer' },
          { name: 'reference_id', type: 'uuid', isNullable: true },
          { name: 'notes', type: 'text', isNullable: true }
        ]
      },
      {
        schema: 'inventory',
        table: 'branch_products',
        auditCategory: 'inventory.branch_product',
        columns: [
          { name: 'branch_id', type: 'uuid' },
          { name: 'product_id', type: 'uuid' },
          { name: 'is_active', type: 'boolean' }
        ]
      },
      {
        schema: 'inventory',
        table: 'product_update_requests',
        auditCategory: 'inventory.update_request',
        columns: [
          { name: 'product_id', type: 'uuid' },
          { name: 'org_id', type: 'uuid' },
          { name: 'requester_id', type: 'uuid' },
          { name: 'status', type: 'text' },
          { name: 'requested_changes', type: 'jsonb' },
          { name: 'admin_notes', type: 'text', isNullable: true }
        ]
      },
      {
        schema: 'inventory',
        table: 'asset_movements',
        auditCategory: 'inventory.asset_movement',
        columns: [
          { name: 'org_id', type: 'uuid', isNullable: true },
          { name: 'product_name', type: 'text', isNullable: true },
          { name: 'sku', type: 'text', isNullable: true },
          { name: 'event_type', type: 'text', isNullable: true },
          { name: 'quantity', type: 'integer', isNullable: true },
          { name: 'balance_after', type: 'integer', isNullable: true },
          { name: 'event_date', type: 'timestamp with time zone', isNullable: true },
          { name: 'notes', type: 'text', isNullable: true }
        ]
      },
      {
        schema: 'inventory',
        table: 'purchases',
        auditCategory: 'inventory.purchase',
        columns: [
          { name: 'org_id', type: 'uuid' },
          { name: 'product_id', type: 'uuid' },
          { name: 'supplier_id', type: 'uuid', isNullable: true },
          { name: 'quantity', type: 'integer' },
          { name: 'unit_price', type: 'numeric' },
          { name: 'total_price', type: 'numeric', isNullable: true },
          { name: 'invoice_number', type: 'text', isNullable: true },
          { name: 'purchase_date', type: 'date' },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'created_by', type: 'uuid', isNullable: true }
        ]
      },
      {
        schema: 'inventory',
        table: 'sales',
        auditCategory: 'inventory.sale',
        columns: [
          { name: 'org_id', type: 'uuid' },
          { name: 'product_id', type: 'uuid' },
          { name: 'booking_id', type: 'uuid', isNullable: true },
          { name: 'customer_id', type: 'uuid', isNullable: true },
          { name: 'quantity', type: 'integer' },
          { name: 'unit_price', type: 'numeric' },
          { name: 'total_price', type: 'numeric', isNullable: true },
          { name: 'sale_date', type: 'date' },
          { name: 'created_by', type: 'uuid', isNullable: true }
        ]
      },
      {
        schema: 'inventory',
        table: 'scan_sessions',
        auditCategory: 'inventory.scan_session',
        columns: [
          { name: 'session_code', type: 'text' },
          { name: 'org_id', type: 'uuid' },
          { name: 'created_by', type: 'uuid', isNullable: true },
          { name: 'status', type: 'text', isNullable: true },
          { name: 'scanned_items', type: 'jsonb', isNullable: true },
          { name: 'expires_at', type: 'timestamp with time zone', isNullable: true },
          { name: 'connected_employee_id', type: 'uuid', isNullable: true },
          { name: 'connected_employee_name', type: 'text', isNullable: true },
          { name: 'last_active_at', type: 'timestamp with time zone', isNullable: true },
          { name: 'manual_employee_name', type: 'text', isNullable: true },
          { name: 'booking_id', type: 'uuid', isNullable: true },
          { name: 'creator_id', type: 'uuid', isNullable: true }
        ]
      },
      {
        schema: 'inventory',
        table: 'service_deductions',
        auditCategory: 'inventory.service_deduction',
        columns: [
          { name: 'org_id', type: 'uuid' },
          { name: 'service_id', type: 'uuid' },
          { name: 'product_id', type: 'uuid' },
          { name: 'quantity', type: 'integer' }
        ]
      },
      {
        schema: 'inventory',
        table: 'supplier_requests',
        auditCategory: 'inventory.supplier_request',
        columns: [
          { name: 'org_id', type: 'uuid' },
          { name: 'supplier_id', type: 'uuid' },
          { name: 'product_id', type: 'uuid' },
          { name: 'quantity', type: 'integer' },
          { name: 'estimated_cost', type: 'numeric', isNullable: true },
          { name: 'status', type: 'text' },
          { name: 'requested_at', type: 'timestamp with time zone', isNullable: true },
          { name: 'expected_at', type: 'date', isNullable: true },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'created_by', type: 'uuid', isNullable: true }
        ]
      },
      {
        schema: 'inventory',
        table: 'usage',
        auditCategory: 'inventory.usage',
        columns: [
          { name: 'org_id', type: 'uuid' },
          { name: 'product_id', type: 'uuid' },
          { name: 'booking_id', type: 'uuid', isNullable: true },
          { name: 'quantity', type: 'integer' },
          { name: 'used_at', type: 'timestamp with time zone', isNullable: true },
          { name: 'used_by', type: 'uuid', isNullable: true },
          { name: 'notes', type: 'text', isNullable: true }
        ]
      }
    ],
    l2Coordinators: [
      {
        name: 'manage_product',
        params: [
          { name: 'org_id', type: 'uuid' },
          { name: 'actor_id', type: 'uuid' },
          { name: 'product_id', type: 'uuid' },
          { name: 'changes', type: 'jsonb' },
          { name: 'branch_id', type: 'uuid', default: 'NULL' }
        ],
        body: `
DECLARE
    v_role text;
    v_result jsonb;
BEGIN
    -- 1. Get actor role
    SELECT role INTO v_role FROM ops.staff_members 
    WHERE user_id = p_actor_id AND org_id = p_org_id LIMIT 1;

    -- 2. Branch deactivation logic (if is_active = false and branch_id provided)
    IF p_branch_id IS NOT NULL AND (p_changes->>'is_active')::boolean = false AND v_role != 'admin' THEN
        PERFORM inventory.upsert_branch_products_v1(
            p_org_id, p_actor_id, p_branch_id, p_product_id, false
        );
        RETURN jsonb_build_object('success', true, 'action', 'branch_deactivation');
    END IF;

    -- 3. Update logic
    IF v_role = 'admin' THEN
        -- Direct update
        PERFORM inventory.upsert_products_v1(
            p_actor_id, p_org_id, 
            p_changes->>'name',
            p_changes->>'category',
            p_changes->>'brand',
            p_changes->>'sku',
            p_changes->>'unit',
            (p_changes->>'purchase_price')::numeric,
            (p_changes->>'selling_price')::numeric,
            (p_changes->>'gst_rate')::numeric,
            (p_changes->>'current_stock')::integer,
            (p_changes->>'reorder_level')::integer,
            (p_changes->>'is_active')::boolean,
            (p_changes->'metadata'),
            p_product_id
        );
        RETURN jsonb_build_object('success', true, 'action', 'direct_update');
    ELSE
        -- Submit for approval
        PERFORM inventory.upsert_product_update_requests_v1(
            p_actor_id, p_org_id, p_product_id, p_org_id, p_actor_id, 'pending', p_changes
        );
        RETURN jsonb_build_object('success', true, 'action', 'request_submitted');
    END IF;
END;
`
      },
      {
        name: 'adjust_stock',
        params: [
          { name: 'org_id', type: 'uuid' },
          { name: 'actor_id', type: 'uuid' },
          { name: 'product_id', type: 'uuid' },
          { name: 'quantity', type: 'integer' },
          { name: 'adjustment_type', type: 'text' },
          { name: 'reason', type: 'text' },
          { name: 'notes', type: 'text', default: 'NULL' }
        ],
        body: `
DECLARE
    v_new_stock integer;
    v_adj_id uuid;
    v_qty_diff integer;
BEGIN
    v_qty_diff := CASE WHEN p_adjustment_type IN ('addition', 'add') THEN p_quantity ELSE -p_quantity END;

    -- 1. Create adjustment record (L1)
    SELECT id INTO v_adj_id FROM inventory.upsert_stock_adjustments_v1(
        p_actor_id, p_org_id, p_product_id, p_adjustment_type, p_quantity, p_reason, p_notes, NULL, p_actor_id
    );

    -- 2. Update product stock
    UPDATE inventory.products 
    SET    current_stock = current_stock + v_qty_diff,
           updated_at = now()
    WHERE  id = p_product_id AND org_id = p_org_id
    RETURNING current_stock INTO v_new_stock;

    -- 3. Log movement (L1)
    PERFORM inventory.upsert_stock_logs_v1(
        p_actor_id, p_org_id, p_product_id, p_adjustment_type, 
        v_qty_diff, v_new_stock, v_adj_id, p_notes
    );

    RETURN jsonb_build_object(
        'product_id', p_product_id,
        'new_stock', v_new_stock,
        'adjustment_id', v_adj_id,
        'success', true
    );
END;
`
      },
      {
        name: 'receive_purchase',
        params: [
          { name: 'org_id', type: 'uuid' },
          { name: 'actor_id', type: 'uuid' },
          { name: 'product_id', type: 'uuid' },
          { name: 'supplier_id', type: 'uuid' },
          { name: 'quantity', type: 'integer' },
          { name: 'unit_price', type: 'numeric' },
          { name: 'invoice_number', type: 'text', default: 'NULL' },
          { name: 'purchase_date', type: 'date', default: 'CURRENT_DATE' },
          { name: 'notes', type: 'text', default: 'NULL' }
        ],
        body: `
DECLARE
    v_purchase_id uuid;
    v_new_stock integer;
BEGIN
    -- 1. Record Purchase (L1)
    SELECT id INTO v_purchase_id FROM inventory.upsert_purchases_v1(
        p_actor_id, p_product_id, p_quantity, p_unit_price, p_purchase_date, p_org_id, 
        p_supplier_id, (p_quantity * p_unit_price), p_invoice_number, p_notes, p_actor_id
    );

    -- 2. Update Stock
    UPDATE inventory.products 
    SET    current_stock = current_stock + p_quantity,
           updated_at = now()
    WHERE  id = p_product_id AND org_id = p_org_id
    RETURNING current_stock INTO v_new_stock;

    -- 3. Log Movement (L1)
    PERFORM inventory.upsert_stock_logs_v1(
        p_actor_id, p_org_id, p_product_id, 'purchase', 
        p_quantity, v_new_stock, v_purchase_id, 'Purchase received: ' || COALESCE(p_invoice_number, 'N/A')
    );

    RETURN jsonb_build_object(
        'purchase_id', v_purchase_id,
        'new_stock', v_new_stock,
        'success', true
    );
END;
`
      },
      {
        name: 'record_sale',
        params: [
          { name: 'org_id', type: 'uuid' },
          { name: 'actor_id', type: 'uuid' },
          { name: 'product_id', type: 'uuid' },
          { name: 'quantity', type: 'integer' },
          { name: 'unit_price', type: 'numeric' },
          { name: 'booking_id', type: 'uuid', default: 'NULL' },
          { name: 'customer_id', type: 'uuid', default: 'NULL' },
          { name: 'sale_date', type: 'date', default: 'CURRENT_DATE' }
        ],
        body: `
DECLARE
    v_sale_id uuid;
    v_new_stock integer;
BEGIN
    -- 1. Record Sale (L1)
    SELECT id INTO v_sale_id FROM inventory.upsert_sales_v1(
        p_actor_id, p_product_id, p_quantity, p_unit_price, p_sale_date, p_org_id,
        p_booking_id, p_customer_id, (p_quantity * p_unit_price), p_actor_id
    );

    -- 2. Update Stock
    UPDATE inventory.products 
    SET    current_stock = current_stock - p_quantity,
           updated_at = now()
    WHERE  id = p_product_id AND org_id = p_org_id
    RETURNING current_stock INTO v_new_stock;

    -- 3. Log Movement (L1)
    PERFORM inventory.upsert_stock_logs_v1(
        p_actor_id, p_org_id, p_product_id, 'sale', 
        -p_quantity, v_new_stock, v_sale_id, 'Sale recorded'
    );

    RETURN jsonb_build_object(
        'sale_id', v_sale_id,
        'new_stock', v_new_stock,
        'success', true
    );
END;
`
      }
    ]
  },
  billing: {
    version: '1',
    domain: 'billing',
    tables: [
      {
        schema: 'billing',
        table: 'payment_events',
        auditCategory: 'billing.payment',
        columns: [
          { name: 'org_id', type: 'uuid', isNullable: true },
          { name: 'subscription_id', type: 'uuid', isNullable: true },
          { name: 'razorpay_payment_id', type: 'text', isNullable: true },
          { name: 'amount', type: 'numeric' },
          { name: 'currency', type: 'text' },
          { name: 'status', type: 'text' },
          { name: 'metadata', type: 'jsonb' }
        ]
      },
      {
        schema: 'billing',
        table: 'subscriptions',
        auditCategory: 'billing.subscription',
        columns: [
          { name: 'org_id', type: 'uuid', isNullable: true },
          { name: 'plan_id', type: 'uuid', isNullable: true },
          { name: 'status', type: 'text' },
          { name: 'start_date', type: 'date', isNullable: true },
          { name: 'end_date', type: 'date', isNullable: true },
          { name: 'trial_start', type: 'date', isNullable: true },
          { name: 'trial_end', type: 'date', isNullable: true },
          { name: 'grace_end', type: 'date', isNullable: true },
          { name: 'razorpay_subscription_id', type: 'text', isNullable: true },
          { name: 'cancelled_at', type: 'timestamptz', isNullable: true },
          { name: 'cancellation_reason', type: 'text', isNullable: true },
          { name: 'user_id', type: 'uuid', isNullable: true },
          { name: 'payment_method', type: 'text', isNullable: true },
          { name: 'remark', type: 'text', isNullable: true },
          { name: 'managed_by', type: 'uuid', isNullable: true }
        ]
      },
      {
        schema: 'billing',
        table: 'upi_settings',
        auditCategory: 'billing.upi_config',
        columns: [
          { name: 'upi_id', type: 'text' },
          { name: 'payee_name', type: 'text' },
          { name: 'merchant_code', type: 'text', isNullable: true },
          { name: 'currency', type: 'text' },
          { name: 'is_active', type: 'boolean' }
        ]
      },
      {
        schema: 'billing',
        table: 'payment_sessions',
        auditCategory: 'billing.payment_session',
        columns: [
          { name: 'org_id', type: 'uuid' },
          { name: 'plan_id', type: 'uuid' },
          { name: 'amount', type: 'numeric' },
          { name: 'status', type: 'text' },
          { name: 'payload', type: 'jsonb', isNullable: true },
          { name: 'expires_at', type: 'timestamp with time zone' },
          { name: 'short_id', type: 'text', isNullable: true }
        ]
      },
      {
        schema: 'billing',
        table: 'plan_features',
        auditCategory: 'billing.plan_feature',
        columns: [
          { name: 'plan_id', type: 'uuid' },
          { name: 'feature_key', type: 'text' },
          { name: 'enabled', type: 'boolean' },
          { name: 'limit_value', type: 'integer', isNullable: true }
        ]
      },
      {
        schema: 'billing',
        table: 'plans',
        auditCategory: 'billing.plan',
        columns: [
          { name: 'plan_key', type: 'text' },
          { name: 'display_name', type: 'text' },
          { name: 'price_monthly', type: 'numeric', isNullable: true },
          { name: 'price_yearly', type: 'numeric', isNullable: true },
          { name: 'max_branches', type: 'integer' },
          { name: 'max_staff', type: 'integer' },
          { name: 'max_customers', type: 'integer', isNullable: true },
          { name: 'razorpay_plan_id', type: 'text', isNullable: true },
          { name: 'is_active', type: 'boolean' },
          { name: 'is_public', type: 'boolean' },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'is_highlighted', type: 'boolean' },
          { name: 'scale_insights', type: 'jsonb' },
          { name: 'comparison_data', type: 'jsonb' },
          { name: 'pro_tips', type: 'jsonb' },
          { name: 'tier_position', type: 'integer' }
        ]
      },
      {
        schema: 'billing',
        table: 'webhook_events',
        auditCategory: 'billing.webhook',
        columns: [
          { name: 'razorpay_event_id', type: 'text' },
          { name: 'event_type', type: 'text', isNullable: true },
          { name: 'payload', type: 'jsonb' },
          { name: 'processed_at', type: 'timestamp with time zone' }
        ]
      }
    ],
    l2Coordinators: [
      {
        name: 'process_subscription_payment',
        params: [
          { name: 'org_id', type: 'uuid' },
          { name: 'actor_id', type: 'uuid' },
          { name: 'subscription_id', type: 'uuid' },
          { name: 'payment_id', type: 'text' },
          { name: 'amount', type: 'numeric' },
          { name: 'status', type: 'text' },
          { name: 'metadata', type: 'jsonb', default: "'{}'::jsonb" }
        ],
        body: `
DECLARE
    v_pay_id uuid;
BEGIN
    -- 1. Log Payment Event (L1)
    SELECT id INTO v_pay_id FROM billing.upsert_payment_events_v1(
        p_actor_id, p_org_id, p_org_id, p_subscription_id, p_payment_id, p_amount, 'INR', p_status, p_metadata
    );

    -- 2. Update Subscription Status (L1)
    IF p_status = 'captured' OR p_status = 'success' THEN
        PERFORM billing.upsert_subscriptions_v1(
            p_actor_id, p_org_id, p_org_id, NULL, 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, p_subscription_id
        );
    END IF;

    RETURN jsonb_build_object(
        'payment_event_id', v_pay_id,
        'subscription_id', p_subscription_id,
        'status', p_status
    );
END;
`
      }
    ]
  },
  comms: {
    version: '1',
    domain: 'comms',
    tables: [
      {
        schema: 'comms',
        table: 'campaigns',
        auditCategory: 'marketing.campaign',
        columns: [
          { name: 'org_id', type: 'uuid' },
          { name: 'name', type: 'text' },
          { name: 'channel', type: 'text' },
          { name: 'template_id', type: 'uuid', isNullable: true },
          { name: 'target_filter', type: 'jsonb' },
          { name: 'status', type: 'text' },
          { name: 'total_recipients', type: 'integer' },
          { name: 'sent_count', type: 'integer' },
          { name: 'delivered_count', type: 'integer' },
          { name: 'failed_count', type: 'integer' },
          { name: 'scheduled_at', type: 'timestamptz', isNullable: true },
          { name: 'started_at', type: 'timestamptz', isNullable: true },
          { name: 'completed_at', type: 'timestamptz', isNullable: true },
          { name: 'created_by', type: 'uuid', isNullable: true }
        ]
      },
      {
        schema: 'comms',
        table: 'campaign_drafts',
        auditCategory: 'marketing.draft',
        columns: [
          { name: 'org_id', type: 'uuid' },
          { name: 'name', type: 'text' },
          { name: 'segment_id', type: 'uuid', isNullable: true },
          { name: 'template_id', type: 'uuid', isNullable: true },
          { name: 'custom_message', type: 'text', isNullable: true },
          { name: 'channel', type: 'text' },
          { name: 'status', type: 'text' },
          { name: 'estimated_reach', type: 'integer' },
          { name: 'rejection_reason', type: 'text', isNullable: true },
          { name: 'reviewed_by', type: 'uuid', isNullable: true },
          { name: 'reviewed_at', type: 'timestamptz', isNullable: true },
          { name: 'scheduled_at', type: 'timestamptz', isNullable: true },
          { name: 'sent_at', type: 'timestamptz', isNullable: true },
          { name: 'created_by', type: 'uuid', isNullable: true }
        ]
      },
      {
        schema: 'comms',
        table: 'templates',
        auditCategory: 'marketing.template',
        columns: [
          { name: 'org_id', type: 'uuid', isNullable: true },
          { name: 'name', type: 'text' },
          { name: 'channel', type: 'text' },
          { name: 'event_type', type: 'text' },
          { name: 'subject', type: 'text', isNullable: true },
          { name: 'body', type: 'text' },
          { name: 'variables', type: 'text[]' },
          { name: 'is_active', type: 'boolean' },
          { name: 'is_system', type: 'boolean' },
          { name: 'created_by', type: 'uuid', isNullable: true },
          { name: 'is_public', type: 'boolean', isNullable: true }
        ]
      },
      {
        schema: 'crm',
        table: 'customer_segments',
        auditCategory: 'crm.segment',
        columns: [
          { name: 'org_id', type: 'uuid' },
          { name: 'name', type: 'text' },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'filters', type: 'jsonb' },
          { name: 'member_count', type: 'integer' },
          { name: 'last_refreshed_at', type: 'timestamptz', isNullable: true },
          { name: 'is_active', type: 'boolean' },
          { name: 'created_by', type: 'uuid', isNullable: true }
        ]
      },
      {
        schema: 'comms',
        table: 'automation_rules',
        auditCategory: 'marketing.automation',
        columns: [
          { name: 'org_id', type: 'uuid' },
          { name: 'rule_name', type: 'text' },
          { name: 'channel', type: 'text' },
          { name: 'trigger_event', type: 'text' },
          { name: 'trigger_offset_minutes', type: 'integer' },
          { name: 'template_id', type: 'uuid', isNullable: true },
          { name: 'conditions', type: 'jsonb' },
          { name: 'is_active', type: 'boolean' },
          { name: 'total_fired', type: 'integer' },
          { name: 'created_by', type: 'uuid', isNullable: true }
        ]
      },
      {
        schema: 'comms',
        table: 'automation_logs',
        auditCategory: 'marketing.automation_log',
        columns: [
          { name: 'rule_id', type: 'uuid' },
          { name: 'org_id', type: 'uuid' },
          { name: 'recipient_phone', type: 'text' },
          { name: 'template_id', type: 'uuid', isNullable: true },
          { name: 'status', type: 'text' },
          { name: 'error_message', type: 'text', isNullable: true },
          { name: 'metadata', type: 'jsonb', isNullable: true }
        ]
      },
      {
        schema: 'comms',
        table: 'booking_otps',
        auditCategory: 'comms.otp',
        columns: [
          { name: 'org_id', type: 'uuid' },
          { name: 'booking_id', type: 'uuid', isNullable: true },
          { name: 'phone', type: 'text' },
          { name: 'otp_code', type: 'text' },
          { name: 'expires_at', type: 'timestamp with time zone' },
          { name: 'verified_at', type: 'timestamp with time zone', isNullable: true },
          { name: 'status', type: 'text' }
        ]
      },
      {
        schema: 'comms',
        table: 'event_logs',
        auditCategory: 'comms.event_log',
        columns: [
          { name: 'org_id', type: 'uuid' },
          { name: 'event_type', type: 'text' },
          { name: 'source', type: 'text' },
          { name: 'payload', type: 'jsonb' },
          { name: 'rules_matched', type: 'integer', isNullable: true },
          { name: 'processing_ms', type: 'integer', isNullable: true },
          { name: 'error_message', type: 'text', isNullable: true }
        ]
      },
      {
        schema: 'comms',
        table: 'messages',
        auditCategory: 'comms.message',
        columns: [
          { name: 'org_id', type: 'uuid' },
          { name: 'channel', type: 'text' },
          { name: 'direction', type: 'text' },
          { name: 'sender', type: 'text' },
          { name: 'recipient', type: 'text' },
          { name: 'body', type: 'text' },
          { name: 'status', type: 'text' },
          { name: 'external_id', type: 'text', isNullable: true },
          { name: 'metadata', type: 'jsonb', isNullable: true }
        ]
      },
      {
        schema: 'comms',
        table: 'message_attributions',
        auditCategory: 'comms.attribution',
        columns: [
          { name: 'message_id', type: 'uuid' },
          { name: 'campaign_id', type: 'uuid', isNullable: true },
          { name: 'automation_id', type: 'uuid', isNullable: true },
          { name: 'customer_id', type: 'uuid', isNullable: true }
        ]
      },
      {
        schema: 'comms',
        table: 'notifications',
        auditCategory: 'comms.notification',
        columns: [
          { name: 'user_id', type: 'uuid' },
          { name: 'org_id', type: 'uuid', isNullable: true },
          { name: 'title', type: 'text' },
          { name: 'body', type: 'text' },
          { name: 'type', type: 'text' },
          { name: 'is_read', type: 'boolean' }
        ]
      },
      {
        schema: 'comms',
        table: 'wa_conversations',
        auditCategory: 'comms.wa_conversation',
        columns: [
          { name: 'org_id', type: 'uuid' },
          { name: 'wa_id', type: 'text' },
          { name: 'status', type: 'text' },
          { name: 'last_message_at', type: 'timestamp with time zone', isNullable: true }
        ]
      },
      {
        schema: 'comms',
        table: 'wa_sessions',
        auditCategory: 'comms.wa_session',
        columns: [
          { name: 'org_id', type: 'uuid' },
          { name: 'wa_id', type: 'text' },
          { name: 'session_data', type: 'jsonb' },
          { name: 'expires_at', type: 'timestamp with time zone' }
        ]
      }
    ],
    l2Coordinators: [
      {
        name: 'submit_campaign_draft',
        params: [
          { name: 'org_id', type: 'uuid' },
          { name: 'actor_id', type: 'uuid' },
          { name: 'name', type: 'text' },
          { name: 'segment_id', type: 'uuid' },
          { name: 'channel', type: 'text' },
          { name: 'template_id', type: 'uuid', default: 'NULL' },
          { name: 'custom_message', type: 'text', default: 'NULL' },
          { name: 'scheduled_at', type: 'timestamptz', default: 'NULL' },
          { name: 'status', type: 'text', default: "'draft'" }
        ],
        body: `
DECLARE
    v_draft_id uuid;
    v_reach integer := 0;
BEGIN
    -- 1. Get estimated reach
    IF p_segment_id IS NOT NULL THEN
        SELECT member_count INTO v_reach FROM crm.customer_segments 
        WHERE id = p_segment_id AND org_id = p_org_id LIMIT 1;
    END IF;

    -- 2. Create Draft (L1)
    SELECT id INTO v_draft_id FROM comms.upsert_campaign_drafts_v1(
        p_actor_id, p_org_id, p_name, p_channel, p_status, v_reach, p_segment_id, p_template_id, p_custom_message, NULL, NULL, NULL, p_scheduled_at, NULL, p_actor_id
    );

    RETURN jsonb_build_object(
        'draft_id', v_draft_id,
        'status', p_status,
        'estimated_reach', v_reach
    );
END;
`
      },
      {
        name: 'increment_rule_fire_count',
        params: [
          { name: 'rule_id', type: 'uuid' }
        ],
        body: `
BEGIN
    UPDATE comms.automation_rules 
    SET    total_fired = COALESCE(total_fired, 0) + 1 
    WHERE  id = p_rule_id;
END;
`
      }
    ]
  },
  ops: {
    version: '1',
    domain: 'ops',
    tables: [
      {
        schema: 'ops',
        table: 'staff_members',
        auditCategory: 'ops.staff',
        columns: [
          { name: 'org_id', type: 'uuid' },
          { name: 'branch_id', type: 'uuid' },
          { name: 'user_id', type: 'uuid', isNullable: true },
          { name: 'name', type: 'text' },
          { name: 'phone', type: 'text', isNullable: true },
          { name: 'email', type: 'text', isNullable: true },
          { name: 'staff_code', type: 'text', isNullable: true },
          { name: 'photo_url', type: 'text', isNullable: true },
          { name: 'employment_type', type: 'text' },
          { name: 'skills', type: 'text[]' },
          { name: 'buffer_time_minutes', type: 'integer' },
          { name: 'max_daily_appointments', type: 'integer' },
          { name: 'preferred_hours', type: 'jsonb' },
          { name: 'salary_type', type: 'text' },
          { name: 'base_salary', type: 'numeric' },
          { name: 'commission_rate', type: 'numeric' },
          { name: 'is_active', type: 'boolean' },
          { name: 'joined_at', type: 'date', isNullable: true },
          { name: 'left_at', type: 'date', isNullable: true },
          { name: 'timezone', type: 'text', isNullable: true }
        ]
      },
      {
        schema: 'ops',
        table: 'staff_profiles',
        auditCategory: 'ops.staff_profile',
        columns: [
          { name: 'org_id', type: 'uuid' },
          { name: 'bio', type: 'text', isNullable: true },
          { name: 'tagline', type: 'text', isNullable: true },
          { name: 'specialities', type: 'text[]' },
          { name: 'years_experience', type: 'integer' },
          { name: 'instagram_url', type: 'text', isNullable: true },
          { name: 'show_on_booking', type: 'boolean' },
          { name: 'display_order', type: 'integer' }
        ]
      },
      {
        schema: 'ops',
        table: 'attendance_logs',
        auditCategory: 'ops.attendance',
        columns: [
          { name: 'staff_id', type: 'uuid' },
          { name: 'org_id', type: 'uuid', isNullable: true },
          { name: 'branch_id', type: 'uuid', isNullable: true },
          { name: 'date', type: 'date' },
          { name: 'clocked_in_at', type: 'timestamp with time zone', isNullable: true },
          { name: 'clocked_out_at', type: 'timestamp with time zone', isNullable: true },
          { name: 'status', type: 'text' },
          { name: 'check_in_method', type: 'text' },
          { name: 'location', type: 'jsonb', isNullable: true },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'approved_by', type: 'uuid', isNullable: true }
        ]
      },
      {
        schema: 'ops',
        table: 'day_closings',
        auditCategory: 'ops.day_closing',
        columns: [
          { name: 'org_id', type: 'uuid' },
          { name: 'branch_id', type: 'uuid' },
          { name: 'closing_date', type: 'date' },
          { name: 'bookings_count', type: 'integer' },
          { name: 'revenue', type: 'numeric' },
          { name: 'expenses', type: 'numeric' },
          { name: 'net_profit', type: 'numeric' },
          { name: 'cash_in_hand', type: 'numeric' },
          { name: 'is_locked', type: 'boolean' },
          { name: 'closed_by', type: 'uuid', isNullable: true },
          { name: 'closed_at', type: 'timestamp with time zone', isNullable: true },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'snapshot', type: 'jsonb' }
        ]
      },
      {
        schema: 'ops',
        table: 'expenses',
        auditCategory: 'ops.expense',
        columns: [
          { name: 'org_id', type: 'uuid' },
          { name: 'branch_id', type: 'uuid', isNullable: true },
          { name: 'category', type: 'text' },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'amount', type: 'numeric' },
          { name: 'expense_date', type: 'date' },
          { name: 'is_recurring', type: 'boolean' },
          { name: 'recurrence', type: 'text', isNullable: true },
          { name: 'added_by', type: 'uuid', isNullable: true }
        ]
      },
      {
        schema: 'ops',
        table: 'payroll_records',
        auditCategory: 'ops.payroll',
        columns: [
          { name: 'staff_id', type: 'uuid' },
          { name: 'org_id', type: 'uuid', isNullable: true },
          { name: 'branch_id', type: 'uuid', isNullable: true },
          { name: 'period_start', type: 'date' },
          { name: 'period_end', type: 'date' },
          { name: 'base_amount', type: 'numeric' },
          { name: 'commission_amount', type: 'numeric' },
          { name: 'deductions', type: 'numeric' },
          { name: 'bonus', type: 'numeric' },
          { name: 'net_amount', type: 'numeric', isNullable: true },
          { name: 'payment_status', type: 'text' },
          { name: 'payment_date', type: 'date', isNullable: true },
          { name: 'payment_method', type: 'text', isNullable: true },
          { name: 'razorpay_payout_id', type: 'text', isNullable: true },
          { name: 'payslip_url', type: 'text', isNullable: true },
          { name: 'breakdown', type: 'jsonb' },
          { name: 'approved_by', type: 'uuid', isNullable: true },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'generated_at', type: 'timestamp with time zone' }
        ]
      },
      {
        schema: 'ops',
        table: 'staff_requests',
        auditCategory: 'ops.staff_request',
        columns: [
          { name: 'org_id', type: 'uuid' },
          { name: 'staff_id', type: 'uuid' },
          { name: 'type', type: 'text' },
          { name: 'payload', type: 'jsonb' },
          { name: 'status', type: 'text' },
          { name: 'staff_note', type: 'text', isNullable: true },
          { name: 'partner_note', type: 'text', isNullable: true },
          { name: 'reviewed_at', type: 'timestamp with time zone', isNullable: true },
          { name: 'reviewed_by', type: 'uuid', isNullable: true }
        ]
      },
      {
        schema: 'ops',
        table: 'invoice_tokens',
        auditCategory: 'ops.invoice',
        columns: [
          { name: 'org_id', type: 'uuid' },
          { name: 'branch_id', type: 'uuid' },
          { name: 'token_number', type: 'integer' },
          { name: 'booking_id', type: 'uuid', isNullable: true },
          { name: 'status', type: 'text' }
        ]
      },
      {
        schema: 'ops',
        table: 'service_catalogue',
        auditCategory: 'ops.service',
        columns: [
          { name: 'org_id', type: 'uuid' },
          { name: 'name', type: 'text' },
          { name: 'category', type: 'text' },
          { name: 'base_price', type: 'numeric' },
          { name: 'duration_minutes', type: 'integer' },
          { name: 'is_active', type: 'boolean' },
          { name: 'description', type: 'text', isNullable: true }
        ]
      },
      {
        schema: 'ops',
        table: 'service_packages',
        auditCategory: 'ops.service_package',
        columns: [
          { name: 'org_id', type: 'uuid' },
          { name: 'name', type: 'text' },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'services', type: 'jsonb' },
          { name: 'price', type: 'numeric' },
          { name: 'validity_days', type: 'integer' },
          { name: 'is_active', type: 'boolean' }
        ]
      },
      {
        schema: 'ops',
        table: 'staff_break_logs',
        auditCategory: 'ops.staff_break',
        columns: [
          { name: 'staff_id', type: 'uuid' },
          { name: 'org_id', type: 'uuid' },
          { name: 'start_time', type: 'timestamp with time zone' },
          { name: 'end_time', type: 'timestamp with time zone', isNullable: true },
          { name: 'break_type', type: 'text' }
        ]
      },
      {
        schema: 'ops',
        table: 'staff_works',
        auditCategory: 'ops.staff_work',
        columns: [
          { name: 'org_id', type: 'uuid' },
          { name: 'staff_id', type: 'uuid' },
          { name: 'title', type: 'text' },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'media_urls', type: 'text[]' },
          { name: 'tags', type: 'text[]', isNullable: true },
          { name: 'service_ids', type: 'uuid[]', isNullable: true },
          { name: 'status', type: 'text' },
          { name: 'rejection_note', type: 'text', isNullable: true },
          { name: 'reviewed_at', type: 'timestamp with time zone', isNullable: true },
          { name: 'reviewed_by', type: 'uuid', isNullable: true }
        ]
      }
    ],
    l2Coordinators: [
      {
        name: 'onboard_staff',
        params: [
          { name: 'org_id', type: 'uuid' },
          { name: 'branch_id', type: 'uuid' },
          { name: 'actor_id', type: 'uuid' },
          { name: 'name', type: 'text' },
          { name: 'phone', type: 'text', default: 'NULL' },
          { name: 'email', type: 'text', default: 'NULL' },
          { name: 'role_key', type: 'text', default: "'staff'" },
          { name: 'employment_type', type: 'text', default: "'full_time'" }
        ],
        body: `
DECLARE
    v_profile_id uuid;
    v_staff_id uuid;
    v_role_id uuid;
BEGIN
    -- 1. Create/Update Profile (L1)
    SELECT id INTO v_profile_id FROM public.upsert_profiles_v1(
        p_actor_id, p_role_key, p_name, p_phone, p_email
    );

    -- 2. Lookup Role ID
    SELECT id INTO v_role_id FROM iam.roles WHERE role_key = p_role_key LIMIT 1;
    IF v_role_id IS NULL THEN
        RAISE EXCEPTION 'role_not_found: %', p_role_key;
    END IF;

    -- 3. Assign Role (L1)
    PERFORM iam.upsert_actor_roles_v1(
        p_actor_id, v_profile_id, v_role_id, 'organization', p_org_id, p_actor_id, now(), NULL, true
    );

    -- 4. Create Staff Member (L1)
    SELECT id INTO v_staff_id FROM ops.upsert_staff_members_v1(
        p_actor_id, p_org_id, p_branch_id, v_profile_id, p_name, p_phone, p_email, 
        NULL, NULL, p_employment_type, '{}'::text[], 0, 10, '{}'::jsonb, 
        'fixed', 0, 0, true, now(), NULL, NULL
    );

    -- 5. Notify (L1)
    PERFORM platform.upsert_notifications_v1(
        p_actor_id, p_org_id, v_profile_id, 'Welcome to the team!', 'staff_onboarding', 'high'
    );

    RETURN jsonb_build_object(
        'profile_id', v_profile_id,
        'staff_id', v_staff_id,
        'success', true
    );
END;
`
      },
      {
        name: 'get_staff_dashboard',
        params: [
          { name: 'org_id', type: 'uuid' },
          { name: 'month', type: 'text' }
        ],
        body: `
BEGIN
    RETURN (
        SELECT jsonb_agg(d) FROM (
            WITH staff_list AS (
                SELECT s.id, s.name, s.phone, s.email, s.branch_id, s.employment_type, s.is_active,
                       EXISTS (
                           SELECT 1 FROM crm.bookings b 
                           WHERE (b.staff_id = s.id OR b.services @> jsonb_build_array(jsonb_build_object('staff_id', s.id)))
                           AND b.status = 'in_progress' AND b.org_id = p_org_id
                       ) as is_busy
                FROM ops.staff_members s
                WHERE s.org_id = p_org_id AND s.is_active = true
            ),
            perf_stats AS (
                SELECT 
                    sid as staff_id,
                    COUNT(DISTINCT booking_id) as month_bookings,
                    SUM(service_rev) as month_revenue
                FROM (
                    SELECT 
                        b.id as booking_id,
                        COALESCE((s->>'staff_id')::uuid, b.staff_id) as sid,
                        (s->>'price')::numeric * (CASE WHEN (SELECT SUM((sv->>'price')::numeric) FROM jsonb_array_elements(b.services) sv) > 0 THEN b.final_amount / (SELECT SUM((sv->>'price')::numeric) FROM jsonb_array_elements(b.services) sv) ELSE 1 END) as service_rev
                    FROM crm.bookings b,
                    LATERAL jsonb_array_elements(b.services) s
                    WHERE b.org_id = p_org_id 
                    AND b.status = 'completed'
                    AND b.completed_at >= (p_month || '-01')::timestamp
                    AND b.completed_at < ((p_month || '-01')::date + interval '1 month')::timestamp
                ) sub
                WHERE sid IS NOT NULL
                GROUP BY sid
            )
            SELECT sl.*, 
                   COALESCE(ps.month_bookings, 0) as month_bookings,
                   COALESCE(ps.month_revenue, 0) as month_revenue
            FROM staff_list sl
            LEFT JOIN perf_stats ps ON sl.id = ps.staff_id
            ORDER BY sl.name
        ) d
    );
END;
`
      }
    ]
  },
  orgs: {
    version: '1',
    domain: 'orgs',
    tables: [
      {
        schema: 'orgs',
        table: 'organizations',
        auditCategory: 'orgs.organization',
        columns: [
          { name: 'org_type', type: 'text' },
          { name: 'name', type: 'text' },
          { name: 'slug', type: 'text' },
          { name: 'legal_name', type: 'text', isNullable: true },
          { name: 'parent_org_id', type: 'uuid', isNullable: true },
          { name: 'contact_email', type: 'text', isNullable: true },
          { name: 'contact_phone', type: 'text', isNullable: true },
          { name: 'gst_number', type: 'text', isNullable: true },
          { name: 'pan_number', type: 'text', isNullable: true },
          { name: 'logo_url', type: 'text', isNullable: true },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'status', type: 'text' },
          { name: 'settings', type: 'jsonb' },
          { name: 'owner_id', type: 'uuid', isNullable: true },
          { name: 'partner_id', type: 'uuid', isNullable: true }
        ]
      },
      {
        schema: 'orgs',
        table: 'branches',
        auditCategory: 'orgs.branch',
        columns: [
          { name: 'org_id', type: 'uuid' },
          { name: 'name', type: 'text' },
          { name: 'branch_code', type: 'text', isNullable: true },
          { name: 'is_primary', type: 'boolean' },
          { name: 'address', type: 'text', isNullable: true },
          { name: 'city', type: 'text', isNullable: true },
          { name: 'state', type: 'text', isNullable: true },
          { name: 'pincode', type: 'text', isNullable: true },
          { name: 'contact_phone', type: 'text', isNullable: true },
          { name: 'operating_hours', type: 'jsonb' },
          { name: 'cover_photo_url', type: 'text', isNullable: true },
          { name: 'status', type: 'text' },
          { name: 'slug', type: 'text', isNullable: true },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'country', type: 'text' },
          { name: 'address_line2', type: 'text', isNullable: true },
          { name: 'landmark', type: 'text', isNullable: true },
          { name: 'latitude', type: 'double precision', isNullable: true },
          { name: 'longitude', type: 'double precision', isNullable: true },
          { name: 'contact_email', type: 'text', isNullable: true },
          { name: 'industry_type', type: 'text', isNullable: true },
          { name: 'is_verified', type: 'boolean' },
          { name: 'timezone', type: 'text' },
          { name: 'google_place_id', type: 'text', isNullable: true },
          { name: 'maps_url', type: 'text', isNullable: true },
          { name: 'primary_manager_id', type: 'uuid', isNullable: true },
          { name: 'accepting_bookings', type: 'boolean' },
          { name: 'metadata', type: 'jsonb' },
          { name: 'gallery_urls', type: 'text[]' },
          { name: 'amenity_tags', type: 'text[]' },
          { name: 'social_links', type: 'jsonb' },
          { name: 'highlight_text', type: 'text', isNullable: true }
        ]
      },
      {
        schema: 'orgs',
        table: 'empt_requests',
        auditCategory: 'orgs.empt_request',
        columns: [
          { name: 'org_id', type: 'uuid' },
          { name: 'branch_id', type: 'uuid' },
          { name: 'staff_id', type: 'uuid' },
          { name: 'type', type: 'text' },
          { name: 'status', type: 'text' },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'rejection_reason', type: 'text', isNullable: true },
          { name: 'accepted_by', type: 'uuid', isNullable: true },
          { name: 'accepted_at', type: 'timestamp with time zone', isNullable: true },
          { name: 'rejected_by', type: 'uuid', isNullable: true },
          { name: 'rejected_at', type: 'timestamp with time zone', isNullable: true },
          { name: 'cancelled_at', type: 'timestamp with time zone', isNullable: true },
          { name: 'completed_at', type: 'timestamp with time zone', isNullable: true },
          { name: 'effective_date', type: 'date', isNullable: true }
        ]
      },
      {
        schema: 'orgs',
        table: 'google_calendar_tokens',
        auditCategory: 'orgs.google_calendar_token',
        columns: [
          { name: 'org_id', type: 'uuid' },
          { name: 'access_token', type: 'text' },
          { name: 'refresh_token', type: 'text' },
          { name: 'token_expiry', type: 'timestamp with time zone' },
          { name: 'calendar_id', type: 'text' },
          { name: 'webhook_channel_id', type: 'text', isNullable: true },
          { name: 'webhook_resource_id', type: 'text', isNullable: true },
          { name: 'webhook_expires_at', type: 'timestamp with time zone', isNullable: true },
          { name: 'sync_token', type: 'text', isNullable: true }
        ]
      }
    ],
    l2Coordinators: [
      {
        name: 'create_branch',
        params: [
          { name: 'org_id', type: 'uuid' },
          { name: 'actor_id', type: 'uuid' },
          { name: 'name', type: 'text' },
          { name: 'country', type: 'text' },
          { name: 'timezone', type: 'text' }
        ],
        body: `
DECLARE
    v_branch_id uuid;
BEGIN
    -- 1. Create Branch (L1)
    SELECT id INTO v_branch_id FROM orgs.upsert_branches_v1(
        p_actor_id, p_org_id, p_name, NULL, true, NULL, NULL, NULL, NULL, 
        NULL, '{}'::jsonb, NULL, 'active', NULL, NULL, p_country, NULL, NULL, 
        NULL, NULL, NULL, NULL, false, p_timezone, NULL, NULL, 
        p_actor_id, true, '{}'::jsonb, '{}'::text[], '{}'::text[], '{}'::jsonb, NULL
    );

    -- 2. Setup Default Scheduling Config (L1)
    PERFORM scheduling.upsert_configs_v1(
        p_actor_id, p_org_id, v_branch_id, 15, 60, 24, true, true, 2, '{}'::jsonb
    );

    RETURN jsonb_build_object(
        'branch_id', v_branch_id,
        'success', true
    );
END;
`
      }
    ]
  },
  iam: {
    version: '1',
    domain: 'iam',
    tables: [
      {
        schema: 'iam',
        table: 'actor_roles',
        auditCategory: 'iam.actor_role',
        columns: [
          { name: 'user_id', type: 'uuid' },
          { name: 'role_id', type: 'uuid' },
          { name: 'context_type', type: 'text' },
          { name: 'context_id', type: 'uuid', isNullable: true },
          { name: 'granted_by', type: 'uuid', isNullable: true },
          { name: 'valid_from', type: 'timestamp with time zone' },
          { name: 'valid_until', type: 'timestamp with time zone', isNullable: true },
          { name: 'is_active', type: 'boolean' }
        ]
      },
      {
        schema: 'iam',
        table: 'invitations',
        auditCategory: 'iam.invitation',
        columns: [
          { name: 'email', type: 'text' },
          { name: 'role_id', type: 'uuid', isNullable: true },
          { name: 'context_type', type: 'text', isNullable: true },
          { name: 'context_id', type: 'uuid', isNullable: true },
          { name: 'token', type: 'text' },
          { name: 'invited_by', type: 'uuid', isNullable: true },
          { name: 'expires_at', type: 'timestamp with time zone' },
          { name: 'accepted_at', type: 'timestamp with time zone', isNullable: true },
          { name: 'status', type: 'text' }
        ]
      },
      {
        schema: 'iam',
        table: 'roles',
        auditCategory: 'iam.role',
        columns: [
          { name: 'tier_id', type: 'smallint', isNullable: true },
          { name: 'role_key', type: 'text' },
          { name: 'display_name', type: 'text' },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'is_system', type: 'boolean' },
          { name: 'is_custom', type: 'boolean' },
          { name: 'parent_role_id', type: 'uuid', isNullable: true },
          { name: 'created_by', type: 'uuid', isNullable: true }
        ]
      },
      {
        schema: 'iam',
        table: 'role_permissions',
        auditCategory: 'iam.role_permission',
        columns: [
          { name: 'role_id', type: 'uuid' },
          { name: 'module_id', type: 'uuid' },
          { name: 'allowed_actions', type: 'text[]' }
        ]
      },
      {
        schema: 'iam',
        table: 'modules',
        auditCategory: 'iam.module',
        columns: [
          { name: 'name', type: 'text' },
          { name: 'module_key', type: 'text' },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'is_active', type: 'boolean' }
        ]
      },
      {
        schema: 'iam',
        table: 'module_actions',
        auditCategory: 'iam.module_action',
        columns: [
          { name: 'module_id', type: 'uuid' },
          { name: 'action_key', type: 'text' },
          { name: 'display_name', type: 'text' },
          { name: 'description', type: 'text', isNullable: true }
        ]
      },
      {
        schema: 'iam',
        table: 'permission_overrides',
        auditCategory: 'iam.permission_override',
        columns: [
          { name: 'user_id', type: 'uuid' },
          { name: 'org_id', type: 'uuid' },
          { name: 'module_id', type: 'uuid' },
          { name: 'action_key', type: 'text' },
          { name: 'is_allowed', type: 'boolean' },
          { name: 'reason', type: 'text', isNullable: true },
          { name: 'expires_at', type: 'timestamp with time zone', isNullable: true },
          { name: 'granted_by', type: 'uuid', isNullable: true }
        ]
      },
      {
        schema: 'iam',
        table: 'tiers',
        auditCategory: 'iam.tier',
        columns: [
          { name: 'name', type: 'text' },
          { name: 'level', type: 'smallint' },
          { name: 'description', type: 'text', isNullable: true }
        ]
      }
    ],
    l2Coordinators: []
  },
  crm: {
    version: '1',
    domain: 'crm',
    tables: [
      {
        schema: 'crm',
        table: 'customers',
        auditCategory: 'crm.customer',
        columns: [
          { name: 'org_id', type: 'uuid' },
          { name: 'auth_user_id', type: 'uuid', isNullable: true },
          { name: 'name', type: 'text' },
          { name: 'phone', type: 'text', isNullable: true },
          { name: 'email', type: 'text', isNullable: true },
          { name: 'gender', type: 'text', isNullable: true },
          { name: 'birthday', type: 'date', isNullable: true },
          { name: 'anniversary', type: 'date', isNullable: true },
          { name: 'customer_type', type: 'text' },
          { name: 'total_visits', type: 'integer' },
          { name: 'total_spend', type: 'numeric' },
          { name: 'last_visit_at', type: 'timestamp with time zone', isNullable: true },
          { name: 'loyalty_points', type: 'integer' },
          { name: 'tags', type: 'text[]' },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'wa_consent', type: 'text' },
          { name: 'referral_code', type: 'text', isNullable: true },
          { name: 'referred_by', type: 'uuid', isNullable: true },
          { name: 'deleted_at', type: 'timestamp with time zone', isNullable: true }
        ]
      },
      {
        schema: 'crm',
        table: 'bookings',
        auditCategory: 'crm.booking',
        columns: [
          { name: 'org_id', type: 'uuid' },
          { name: 'branch_id', type: 'uuid' },
          { name: 'customer_id', type: 'uuid' },
          { name: 'staff_id', type: 'uuid', isNullable: true },
          { name: 'scheduled_at', type: 'timestamp with time zone' },
          { name: 'status', type: 'text' },
          { name: 'source', type: 'text' },
          { name: 'services', type: 'jsonb' },
          { name: 'total_amount', type: 'numeric' },
          { name: 'discount_amount', type: 'numeric' },
          { name: 'gst_amount', type: 'numeric' },
          { name: 'final_amount', type: 'numeric' },
          { name: 'payment_method', type: 'text' },
          { name: 'payment_status', type: 'text' },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'scheduling_method', type: 'text' },
          { name: 'payment_amount', type: 'numeric' },
          { name: 'payment_collected', type: 'boolean' },
          { name: 'end_otp', type: 'text', isNullable: true },
          { name: 'otp_attempts', type: 'integer' },
          { name: 'checkout_expires_at', type: 'timestamp with time zone', isNullable: true },
          { name: 'is_flagged', type: 'boolean' },
          { name: 'flag_reason', type: 'text', isNullable: true },
          { name: 'flag_at', type: 'timestamp with time zone', isNullable: true },
          { name: 'metadata', type: 'jsonb' },
          { name: 'created_by', type: 'uuid', isNullable: true }
        ]
      },
      {
        schema: 'crm',
        table: 'session_notifications',
        auditCategory: 'crm.notification',
        columns: [
          { name: 'org_id', type: 'uuid' },
          { name: 'booking_id', type: 'uuid' },
          { name: 'type', type: 'text' },
          { name: 'message', type: 'text' },
          { name: 'severity', type: 'text' },
          { name: 'is_read', type: 'boolean' },
          { name: 'resolved_at', type: 'timestamp with time zone', isNullable: true }
        ]
      },
      {
        schema: 'crm',
        table: 'service_complaints',
        auditCategory: 'crm.complaint',
        columns: [
          { name: 'org_id', type: 'uuid' },
          { name: 'booking_id', type: 'uuid' },
          { name: 'customer_id', type: 'uuid' },
          { name: 'staff_id', type: 'uuid', isNullable: true },
          { name: 'message', type: 'text' },
          { name: 'priority', type: 'text' },
          { name: 'status', type: 'text' },
          { name: 'partner_notes', type: 'text', isNullable: true },
          { name: 'sla_deadline', type: 'timestamp with time zone', isNullable: true }
        ]
      },
      {
        schema: 'crm',
        table: 'customer_segments',
        auditCategory: 'crm.segment',
        columns: [
          { name: 'org_id', type: 'uuid' },
          { name: 'name', type: 'text' },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'filters', type: 'jsonb' },
          { name: 'member_count', type: 'integer' },
          { name: 'last_refreshed_at', type: 'timestamp with time zone', isNullable: true },
          { name: 'is_active', type: 'boolean' },
          { name: 'created_by', type: 'uuid', isNullable: true }
        ]
      },
      {
        schema: 'crm',
        table: 'auth_requests',
        auditCategory: 'crm.auth_request',
        columns: [
          { name: 'org_id', type: 'uuid' },
          { name: 'branch_id', type: 'uuid', isNullable: true },
          { name: 'customer_id', type: 'uuid', isNullable: true },
          { name: 'request_type', type: 'text' },
          { name: 'status', type: 'text' },
          { name: 'payload', type: 'jsonb', isNullable: true }
        ]
      },
      {
        schema: 'crm',
        table: 'booking_annotations',
        auditCategory: 'crm.annotation',
        columns: [
          { name: 'booking_id', type: 'uuid' },
          { name: 'org_id', type: 'uuid' },
          { name: 'branch_id', type: 'uuid', isNullable: true },
          { name: 'stream', type: 'text' },
          { name: 'category', type: 'text' },
          { name: 'body', type: 'text' },
          { name: 'author_id', type: 'uuid' },
          { name: 'author_role', type: 'text' },
          { name: 'is_deleted', type: 'boolean' }
        ]
      },
      {
        schema: 'crm',
        table: 'contact_requests',
        auditCategory: 'crm.contact_request',
        columns: [
          { name: 'org_id', type: 'uuid', isNullable: true },
          { name: 'business_name', type: 'text', isNullable: true },
          { name: 'contact_name', type: 'text' },
          { name: 'phone', type: 'text' },
          { name: 'email', type: 'text', isNullable: true },
          { name: 'city', type: 'text', isNullable: true },
          { name: 'message', type: 'text', isNullable: true },
          { name: 'source', type: 'text' },
          { name: 'status', type: 'text' },
          { name: 'assigned_to', type: 'uuid', isNullable: true },
          { name: 'assigned_admin_id', type: 'uuid', isNullable: true },
          { name: 'last_message_at', type: 'timestamp with time zone', isNullable: true }
        ]
      },
      {
        schema: 'crm',
        table: 'revenue_splits',
        auditCategory: 'crm.revenue_split',
        columns: [
          { name: 'booking_id', type: 'uuid' },
          { name: 'staff_id', type: 'uuid', isNullable: true },
          { name: 'org_id', type: 'uuid' },
          { name: 'service_id', type: 'uuid', isNullable: true },
          { name: 'amount', type: 'numeric' },
          { name: 'branch_id', type: 'uuid', isNullable: true }
        ]
      },
      {
        schema: 'crm',
        table: 'reviews',
        auditCategory: 'crm.review',
        columns: [
          { name: 'org_id', type: 'uuid', isNullable: true },
          { name: 'branch_id', type: 'uuid', isNullable: true },
          { name: 'customer_id', type: 'uuid', isNullable: true },
          { name: 'booking_id', type: 'uuid', isNullable: true },
          { name: 'overall_rating', type: 'smallint', isNullable: true },
          { name: 'stylist_rating', type: 'smallint', isNullable: true },
          { name: 'cleanliness_rating', type: 'smallint', isNullable: true },
          { name: 'value_rating', type: 'smallint', isNullable: true },
          { name: 'review_text', type: 'text', isNullable: true },
          { name: 'photo_url', type: 'text', isNullable: true },
          { name: 'is_published', type: 'boolean' },
          { name: 'platform', type: 'text' }
        ]
      },
      {
        schema: 'crm',
        table: 'service_complaints',
        auditCategory: 'crm.complaint',
        columns: [
          { name: 'org_id', type: 'uuid' },
          { name: 'booking_id', type: 'uuid' },
          { name: 'customer_id', type: 'uuid' },
          { name: 'staff_id', type: 'uuid', isNullable: true },
          { name: 'message', type: 'text' },
          { name: 'priority', type: 'text' },
          { name: 'status', type: 'text' },
          { name: 'partner_notes', type: 'text', isNullable: true },
          { name: 'sla_deadline', type: 'timestamp with time zone', isNullable: true }
        ]
      },
      {
        schema: 'crm',
        table: 'session_notifications',
        auditCategory: 'crm.session_notification',
        columns: [
          { name: 'org_id', type: 'uuid' },
          { name: 'booking_id', type: 'uuid' },
          { name: 'type', type: 'text' },
          { name: 'message', type: 'text' },
          { name: 'severity', type: 'text' },
          { name: 'is_read', type: 'boolean' },
          { name: 'resolved_at', type: 'timestamp with time zone', isNullable: true }
        ]
      },
      {
        schema: 'crm',
        table: 'touchpoint_hits',
        auditCategory: 'crm.touchpoint',
        columns: [
          { name: 'org_id', type: 'uuid' },
          { name: 'branch_id', type: 'uuid', isNullable: true },
          { name: 'touchpoint', type: 'text' },
          { name: 'metadata', type: 'jsonb', isNullable: true }
        ]
      }
    ],
    l2Coordinators: [
      {
        name: 'register_customer',
        params: [
          { name: 'org_id', type: 'uuid' },
          { name: 'actor_id', type: 'uuid' },
          { name: 'name', type: 'text' },
          { name: 'phone', type: 'text', default: 'NULL' },
          { name: 'email', type: 'text', default: 'NULL' }
        ],
        body: `
DECLARE
    v_customer_id uuid;
BEGIN
    -- 1. Create Customer (L1)
    SELECT id INTO v_customer_id FROM crm.upsert_customers_v1(
        p_actor_id, p_org_id, NULL, p_name, p_phone, p_email, NULL, NULL, NULL, 'retail', 0, 0, NULL, 0, '{}'::text[], NULL, 'unknown', NULL, NULL
    );

    -- 2. Welcome Message (L1)
    PERFORM comms.upsert_messages_v1(
        p_actor_id, p_org_id, NULL, v_customer_id, 'whatsapp', 'Welcome to our platform!', 'outbound', 'sent', NULL, NULL, p_actor_id
    );

    RETURN jsonb_build_object(
        'customer_id', v_customer_id,
        'success', true
    );
END;
`
      },
      {
        name: 'process_online_booking',
        params: [
          { name: 'org_id', type: 'uuid' },
          { name: 'branch_id', type: 'uuid' },
          { name: 'actor_id', type: 'uuid' },
          { name: 'customer_name', type: 'text' },
          { name: 'customer_phone', type: 'text', default: 'NULL' },
          { name: 'customer_email', type: 'text', default: 'NULL' },
          { name: 'services', type: 'jsonb' },
          { name: 'staff_id', type: 'uuid', default: 'NULL' },
          { name: 'scheduled_at', type: 'timestamp with time zone' },
          { name: 'total_amount', type: 'numeric' },
          { name: 'discount_amount', type: 'numeric' },
          { name: 'gst_amount', type: 'numeric' },
          { name: 'final_amount', type: 'numeric' },
          { name: 'status', type: 'text' },
          { name: 'source', type: 'text' },
          { name: 'scheduling_method', type: 'text' },
          { name: 'notes', type: 'text', default: 'NULL' },
          { name: 'metadata', type: 'jsonb', default: 'NULL' }
        ],
        body: `
DECLARE
    v_customer_id uuid;
    v_booking_id uuid;
BEGIN
    -- 1. Resolve Customer (Phone first, then Email)
    IF p_customer_phone IS NOT NULL THEN
        SELECT id INTO v_customer_id FROM crm.customers 
        WHERE org_id = p_org_id AND phone ILIKE '%' || p_customer_phone || '%' 
        LIMIT 1;
    END IF;

    IF v_customer_id IS NULL AND p_customer_email IS NOT NULL THEN
        SELECT id INTO v_customer_id FROM crm.customers 
        WHERE org_id = p_org_id AND email ILIKE p_customer_email 
        LIMIT 1;
    END IF;

    -- 2. Create if not found
    IF v_customer_id IS NULL THEN
        SELECT id INTO v_customer_id FROM crm.upsert_customers_v1(
            p_actor_id, p_org_id, NULL, p_customer_name, p_customer_phone, p_customer_email, 
            NULL, NULL, NULL, 'walk_in', 0, 0, NULL, 0, '{}'::text[], NULL, 'pending', NULL, NULL, NULL
        );
    END IF;

    -- 3. Create Booking
    SELECT id INTO v_booking_id FROM crm.upsert_bookings_v1(
        p_actor_id, p_org_id, p_branch_id, v_customer_id, p_staff_id, p_scheduled_at, 
        p_status, p_source, p_services, p_total_amount, p_discount_amount, p_gst_amount, 
        p_final_amount, 'cash', 'unpaid', p_notes, p_scheduling_method,
        NULL, NULL, NULL, NULL, false, false, COALESCE(p_metadata, '{}'::jsonb), p_actor_id
    );

    -- 4. Hub Token
    PERFORM crm.generate_booking_hub_token_v1(v_booking_id, p_org_id, p_actor_id);

    RETURN jsonb_build_object(
        'booking_id', v_booking_id,
        'customer_id', v_customer_id,
        'success', true
    );
END;
`
      },
      {
        name: 'confirm_customer_payment',
        params: [
          { name: 'org_id', type: 'uuid' },
          { name: 'actor_id', type: 'uuid' },
          { name: 'booking_id', type: 'uuid' },
          { name: 'amount_confirmed', type: 'numeric' }
        ],
        body: `
DECLARE
    v_booking record;
    v_mismatch boolean;
BEGIN
    -- 1. Fetch and Lock Booking
    SELECT * INTO v_booking FROM crm.bookings 
    WHERE id = p_booking_id AND org_id = p_org_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found';
    END IF;

    -- 2. Check Mismatch
    v_mismatch := ABS(p_amount_confirmed - COALESCE(v_booking.payment_amount, 0)) > 0.01;

    IF v_mismatch THEN
        INSERT INTO crm.session_notifications (org_id, booking_id, type, severity, message)
        VALUES (p_org_id, p_booking_id, 'payment_mismatch', 'warning', 
                'Customer confirmed ₹' || p_amount_confirmed || ' but expected ₹' || v_booking.payment_amount);
    END IF;

    -- 3. Update Booking
    UPDATE crm.bookings 
    SET    customer_payment_confirmed = true,
           status = CASE WHEN payment_collected THEN 'completed' ELSE status END,
           updated_at = now()
    WHERE  id = p_booking_id;

    -- 4. Increment Stats if completed
    IF v_booking.payment_collected AND v_booking.customer_id IS NOT NULL THEN
        PERFORM crm.increment_customer_stats(v_booking.customer_id, p_amount_confirmed);
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'mismatch', v_mismatch,
        'completed', v_booking.payment_collected
    );
END;
`
      },
      {
        name: 'manage_booking_annotations',
        params: [
          { name: 'org_id', type: 'uuid' },
          { name: 'actor_id', type: 'uuid' },
          { name: 'booking_id', type: 'uuid' },
          { name: 'body', type: 'text' },
          { name: 'stream', type: 'text', default: "'internal'" },
          { name: 'category', type: 'text', default: "'note'" },
          { name: 'author_role', type: 'text', default: "'partner'" }
        ],
        body: `
DECLARE
    v_note_id uuid;
BEGIN
    INSERT INTO crm.booking_annotations (
        org_id, booking_id, body, stream, category, author_id, author_role, is_deleted
    ) VALUES (
        p_org_id, p_booking_id, p_body, p_stream, p_category, p_actor_id, p_author_role, false
    ) RETURNING id INTO v_note_id;

    PERFORM platform.write_audit_log(
        p_org_id, p_actor_id, p_author_role,
        'crm.annotation.created', 'booking_annotations', v_note_id::text,
        jsonb_build_object('booking_id', p_booking_id, 'stream', p_stream)
    );

    RETURN jsonb_build_object('id', v_note_id, 'success', true);
END;
`
      }
    ]
  },
  scheduling: {
    version: '1',
    domain: 'scheduling',
    tables: [
      {
        schema: 'scheduling',
        table: 'waitlist',
        auditCategory: 'scheduling.waitlist',
        columns: [
          { name: 'org_id', type: 'uuid' },
          { name: 'branch_id', type: 'uuid', isNullable: true },
          { name: 'customer_id', type: 'uuid' },
          { name: 'service_id', type: 'uuid', isNullable: true },
          { name: 'preferred_staff_id', type: 'uuid', isNullable: true },
          { name: 'requested_date', type: 'date', isNullable: true },
          { name: 'earliest_time', type: 'time without time zone', isNullable: true },
          { name: 'latest_time', type: 'time without time zone', isNullable: true },
          { name: 'flexibility_minutes', type: 'integer' },
          { name: 'status', type: 'text' },
          { name: 'offered_slot', type: 'jsonb', isNullable: true },
          { name: 'offered_at', type: 'timestamp with time zone', isNullable: true },
          { name: 'offer_expires_at', type: 'timestamp with time zone', isNullable: true },
          { name: 'wa_message_id', type: 'text', isNullable: true },
          { name: 'priority', type: 'integer' },
          { name: 'notes', type: 'text', isNullable: true }
        ]
      },
      {
        schema: 'scheduling',
        table: 'queue',
        auditCategory: 'scheduling.queue',
        columns: [
          { name: 'org_id', type: 'uuid' },
          { name: 'branch_id', type: 'uuid', isNullable: true },
          { name: 'booking_id', type: 'uuid' },
          { name: 'priority', type: 'integer' },
          { name: 'constraints', type: 'jsonb' },
          { name: 'status', type: 'text' }
        ]
      },
      {
        schema: 'scheduling',
        table: 'roster_plans',
        auditCategory: 'scheduling.roster_plan',
        columns: [
          { name: 'org_id', type: 'uuid' },
          { name: 'name', type: 'text', isNullable: true },
          { name: 'date_from', type: 'date' },
          { name: 'date_to', type: 'date' },
          { name: 'status', type: 'text' },
          { name: 'algorithm_version', type: 'text' },
          { name: 'config', type: 'jsonb', isNullable: true },
          { name: 'metrics', type: 'jsonb', isNullable: true },
          { name: 'created_by', type: 'uuid', isNullable: true },
          { name: 'published_at', type: 'timestamp with time zone', isNullable: true }
        ]
      },
      {
        schema: 'scheduling',
        table: 'branch_closures',
        auditCategory: 'scheduling.branch_closure',
        columns: [
          { name: 'org_id', type: 'uuid' },
          { name: 'branch_id', type: 'uuid', isNullable: true },
          { name: 'closure_date', type: 'date' },
          { name: 'reason', type: 'text', isNullable: true },
          { name: 'closure_type', type: 'text' },
          { name: 'created_by', type: 'uuid', isNullable: true }
        ]
      },
      {
        schema: 'scheduling',
        table: 'configs',
        auditCategory: 'scheduling.config',
        columns: [
          { name: 'org_id', type: 'uuid' },
          { name: 'branch_id', type: 'uuid', isNullable: true },
          { name: 'slot_duration_minutes', type: 'integer' },
          { name: 'buffer_default_minutes', type: 'integer' },
          { name: 'advance_booking_days', type: 'integer' },
          { name: 'cancellation_window_hours', type: 'integer' },
          { name: 'max_utilization_pct', type: 'integer' },
          { name: 'waitlist_enabled', type: 'boolean' },
          { name: 'auto_assign_enabled', type: 'boolean' },
          { name: 'ai_optimizer_enabled', type: 'boolean' },
          { name: 'business_hours', type: 'jsonb' },
          { name: 'peak_hours_config', type: 'jsonb' },
          { name: 'settings', type: 'jsonb' },
          { name: 'slot_duration', type: 'integer' },
          { name: 'buffer_default', type: 'integer' }
        ]
      },
      {
        schema: 'scheduling',
        table: 'demand_patterns',
        auditCategory: 'scheduling.demand_pattern',
        columns: [
          { name: 'org_id', type: 'uuid' },
          { name: 'day_of_week', type: 'integer' },
          { name: 'slot_15min', type: 'integer' },
          { name: 'avg_arrivals', type: 'numeric' },
          { name: 'avg_service_min', type: 'numeric' },
          { name: 'required_staff', type: 'integer' }
        ]
      },
      {
        schema: 'scheduling',
        table: 'employee_constraints',
        auditCategory: 'scheduling.employee_constraint',
        columns: [
          { name: 'org_id', type: 'uuid' },
          { name: 'staff_id', type: 'uuid' },
          { name: 'max_daily_hours', type: 'numeric' },
          { name: 'max_weekly_hours', type: 'numeric' },
          { name: 'min_rest_between_shifts', type: 'numeric' },
          { name: 'efficiency_score', type: 'numeric' },
          { name: 'fatigue_score', type: 'numeric' },
          { name: 'contract_type', type: 'text' },
          { name: 'preferred_shift', type: 'text' },
          { name: 'days_per_week', type: 'integer' },
          { name: 'off_day_prefs', type: 'text[]', isNullable: true },
          { name: 'skills', type: 'text[]', isNullable: true },
          { name: 'notes', type: 'text', isNullable: true }
        ]
      },
      {
        schema: 'scheduling',
        table: 'shift_templates',
        auditCategory: 'scheduling.shift_template',
        columns: [
          { name: 'org_id', type: 'uuid' },
          { name: 'name', type: 'text' },
          { name: 'shift_type', type: 'text' },
          { name: 'start_time', type: 'time without time zone' },
          { name: 'end_time', type: 'time without time zone' },
          { name: 'min_staff', type: 'integer' },
          { name: 'color_hex', type: 'text', isNullable: true },
          { name: 'is_active', type: 'boolean' }
        ]
      },
      {
        schema: 'scheduling',
        table: 'staff_availability',
        auditCategory: 'scheduling.staff_availability',
        columns: [
          { name: 'staff_id', type: 'uuid' },
          { name: 'org_id', type: 'uuid', isNullable: true },
          { name: 'date', type: 'date' },
          { name: 'start_time', type: 'time without time zone' },
          { name: 'end_time', type: 'time without time zone', isNullable: true },
          { name: 'block_type', type: 'text' },
          { name: 'reason', type: 'text', isNullable: true },
          { name: 'created_by', type: 'uuid', isNullable: true },
          { name: 'is_active', type: 'boolean' }
        ]
      }
    ],
    l2Coordinators: [
      {
        name: 'publish_roster',
        params: [
          { name: 'org_id', type: 'uuid' },
          { name: 'actor_id', type: 'uuid' },
          { name: 'plan_id', type: 'uuid' }
        ],
        body: `
BEGIN
    -- 1. Publish Plan
    UPDATE scheduling.roster_plans
    SET    status = 'published',
           published_at = now()
    WHERE  id = p_plan_id AND org_id = p_org_id;

    -- 2. Notify
    PERFORM platform.upsert_notifications_v1(
        p_actor_id, p_org_id, NULL, 'Roster plan published', 'roster_publish', 'medium'
    );

    RETURN jsonb_build_object('success', true, 'action', 'roster_published');
END;
`
      },
      {
        name: 'bulk_publish_roster',
        params: [
          { name: 'org_id', type: 'uuid' },
          { name: 'actor_id', type: 'uuid' },
          { name: 'date', type: 'date' },
          { name: 'shifts', type: 'jsonb' }
        ],
        body: `
DECLARE
    v_shift jsonb;
BEGIN
    -- 1. Clear existing for the date
    DELETE FROM scheduling.staff_availability 
    WHERE org_id = p_org_id AND date = p_date;

    -- 2. Insert new from jsonb array
    FOR v_shift IN SELECT * FROM jsonb_array_elements(p_shifts) LOOP
        INSERT INTO scheduling.staff_availability (
            org_id, staff_id, date, start_time, end_time, block_type, reason, created_by, is_active
        ) VALUES (
            p_org_id, 
            (v_shift->>'staff_id')::uuid,
            p_date,
            (v_shift->>'start_time')::time,
            (v_shift->>'end_time')::time,
            COALESCE(v_shift->>'block_type', 'available'),
            v_shift->>'reason',
            p_actor_id,
            true
        );
    END LOOP;

    -- 3. Audit
    PERFORM platform.write_audit_log(
        p_org_id, p_actor_id, 'partner',
        'scheduling.roster.published', 'staff_availability', p_date::text,
        jsonb_build_object('count', jsonb_array_length(p_shifts))
    );

    RETURN jsonb_build_object('success', true, 'count', jsonb_array_length(p_shifts));
END;
`
      }
    ]
  },

  ai: {
    version: '1',
    domain: 'ai',
    tables: [
      {
        schema: 'ai',
        table: 'chat_sessions',
        auditCategory: 'ai.session',
        columns: [
          { name: 'org_id', type: 'uuid', isNullable: true },
          { name: 'user_id', type: 'uuid', isNullable: true },
          { name: 'role', type: 'text', isNullable: true },
          { name: 'channel', type: 'text', isNullable: true },
          { name: 'context', type: 'jsonb', isNullable: true },
          { name: 'last_active_at', type: 'timestamp with time zone', isNullable: true }
        ]
      },
      {
        schema: 'ai',
        table: 'chat_messages',
        auditCategory: 'ai.message',
        columns: [
          { name: 'session_id', type: 'uuid' },
          { name: 'role', type: 'text', isNullable: true },
          { name: 'content', type: 'text', isNullable: true },
          { name: 'tool_calls', type: 'jsonb', isNullable: true }
        ]
      },
      {
        schema: 'ai',
        table: 'requests',
        auditCategory: 'ai.request',
        columns: [
          { name: 'org_id', type: 'uuid' },
          { name: 'user_id', type: 'uuid', isNullable: true },
          { name: 'role', type: 'text', isNullable: true },
          { name: 'intent', type: 'text' },
          { name: 'payload', type: 'jsonb' },
          { name: 'extracted_entities', type: 'jsonb', isNullable: true },
          { name: 'status', type: 'text', isNullable: true },
          { name: 'confidence_score', type: 'double precision', isNullable: true },
          { name: 'linked_booking_id', type: 'uuid', isNullable: true },
          { name: 'source', type: 'text', isNullable: true },
          { name: 'raw_prompt', type: 'text', isNullable: true },
          { name: 'confirmed_at', type: 'timestamp with time zone', isNullable: true },
          { name: 'executed_at', type: 'timestamp with time zone', isNullable: true }
        ]
      }
    ],
    l2Coordinators: []
  },
  analytics: {
    version: '1',
    domain: 'analytics',
    tables: [
      {
        schema: 'analytics',
        table: 'daily_snapshots',
        auditCategory: 'analytics.snapshot',
        columns: [
          { name: 'org_id', type: 'uuid' },
          { name: 'branch_id', type: 'uuid', isNullable: true },
          { name: 'snapshot_date', type: 'date' },
          { name: 'data', type: 'jsonb' },
          { name: 'computed_at', type: 'timestamp with time zone' }
        ]
      },
      {
        schema: 'analytics',
        table: 'platform_metrics',
        auditCategory: 'analytics.metric',
        columns: [
          { name: 'metric_key', type: 'text' },
          { name: 'period_start', type: 'date' },
          { name: 'period_end', type: 'date' },
          { name: 'value', type: 'numeric' },
          { name: 'dimensions', type: 'jsonb' },
          { name: 'computed_at', type: 'timestamp with time zone' }
        ]
      }
    ],
    l2Coordinators: []
  },
  audit: {
    version: '1',
    domain: 'audit',
    tables: [
      {
        schema: 'audit',
        table: 'asset_activity_logs',
        auditCategory: 'audit.asset_activity',
        columns: [
          { name: 'actor_id', type: 'uuid' },
          { name: 'target_id', type: 'uuid' },
          { name: 'action_type', type: 'text' }
        ]
      },
      {
        schema: 'audit',
        table: 'lookup_logs',
        auditCategory: 'audit.lookup',
        columns: [
          { name: 'executed_at', type: 'timestamp with time zone', isNullable: true },
          { name: 'executor_id', type: 'uuid', isNullable: true },
          { name: 'org_id', type: 'uuid' },
          { name: 'search_type', type: 'text' },
          { name: 'query_masked', type: 'text', isNullable: true },
          { name: 'query_hash', type: 'text' },
          { name: 'result_count', type: 'integer', isNullable: true },
          { name: 'ip_address', type: 'text', isNullable: true },
          { name: 'user_agent', type: 'text', isNullable: true },
          { name: 'is_suspicious', type: 'boolean', isNullable: true }
        ]
      }
    ],
    l2Coordinators: []
  },
  platform: {
    version: '1',
    domain: 'platform',
    tables: [
      {
        schema: 'platform',
        table: 'escalation_tickets',
        auditCategory: 'platform.escalation',
        columns: [
          { name: 'booking_id', type: 'uuid' },
          { name: 'org_id', type: 'uuid' },
          { name: 'status', type: 'text' },
          { name: 'priority', type: 'text' },
          { name: 'triggered_by', type: 'text' },
          { name: 'triggered_by_id', type: 'uuid', isNullable: true },
          { name: 'reason', type: 'text', isNullable: true },
          { name: 'target_outcome', type: 'text', isNullable: true },
          { name: 'assigned_admin', type: 'uuid', isNullable: true },
          { name: 'resolution', type: 'text', isNullable: true },
          { name: 'resolution_action', type: 'text', isNullable: true },
          { name: 'resolved_at', type: 'timestamp with time zone', isNullable: true }
        ]
      },
      {
        schema: 'platform',
        table: 'instance_requests',
        auditCategory: 'platform.instance_request',
        columns: [
          { name: 'org_id', type: 'uuid', isNullable: true },
          { name: 'contact_name', type: 'text' },
          { name: 'contact_phone', type: 'text' },
          { name: 'contact_email', type: 'text', isNullable: true },
          { name: 'business_name', type: 'text' },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'status', type: 'text' },
          { name: 'admin_notes', type: 'text', isNullable: true },
          { name: 'instance_name', type: 'text', isNullable: true },
          { name: 'reviewed_by', type: 'uuid', isNullable: true },
          { name: 'reviewed_at', type: 'timestamp with time zone', isNullable: true }
        ]
      },
      {
        schema: 'platform',
        table: 'notifications',
        auditCategory: 'platform.notification',
        columns: [
          { name: 'user_id', type: 'uuid' },
          { name: 'org_id', type: 'uuid', isNullable: true },
          { name: 'title', type: 'text' },
          { name: 'body', type: 'text' },
          { name: 'type', type: 'text' },
          { name: 'is_read', type: 'boolean', isNullable: true },
          { name: 'link', type: 'text', isNullable: true }
        ]
      },
      {
        schema: 'platform',
        table: 'settings',
        auditCategory: 'platform.setting',
        columns: [
          { name: 'key', type: 'text' },
          { name: 'value', type: 'jsonb' },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'updated_by', type: 'uuid', isNullable: true }
        ]
      },
      {
        schema: 'platform',
        table: 'tasks',
        auditCategory: 'platform.task',
        columns: [
          { name: 'org_id', type: 'uuid', isNullable: true },
          { name: 'title', type: 'text' },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'priority', type: 'text' },
          { name: 'status', type: 'text' },
          { name: 'assigned_to', type: 'uuid', isNullable: true },
          { name: 'link', type: 'text', isNullable: true },
          { name: 'due_at', type: 'timestamp with time zone', isNullable: true },
          { name: 'completed_at', type: 'timestamp with time zone', isNullable: true },
          { name: 'metadata', type: 'jsonb', isNullable: true }
        ]
      },
      {
        schema: 'platform',
        table: 'transactions',
        auditCategory: 'platform.transaction',
        columns: [
          { name: 'org_id', type: 'uuid', isNullable: true },
          { name: 'booking_id', type: 'uuid', isNullable: true },
          { name: 'amount', type: 'numeric' },
          { name: 'payment_method', type: 'text', isNullable: true },
          { name: 'status', type: 'text' },
          { name: 'razorpay_payment_id', type: 'text', isNullable: true },
          { name: 'razorpay_order_id', type: 'text', isNullable: true },
          { name: 'notes', type: 'text', isNullable: true }
        ]
      },
      {
        schema: 'comms',
        table: 'otp_ip_log',
        auditCategory: 'comms.otp_ip_log',
        columns: [
          { name: 'ip_address', type: 'text' },
          { name: 'phone', type: 'text' },
          { name: 'org_id', type: 'uuid' },
          { name: 'event', type: 'text' },
          { name: 'detail', type: 'jsonb', isNullable: true }
        ]
      }
    ],
    l2Coordinators: []
  },
  public: {
    version: '1',
    domain: 'public',
    tables: [
      {
        schema: 'public',
        table: 'profiles',
        auditCategory: 'public.profile',
        columns: [
          { name: 'role', type: 'text' },
          { name: 'name', type: 'text', isNullable: true },
          { name: 'phone', type: 'text', isNullable: true },
          { name: 'email', type: 'text', isNullable: true },
          { name: 'avatar_url', type: 'text', isNullable: true },
          { name: 'partner_id', type: 'uuid', isNullable: true },
          { name: 'business_name', type: 'text', isNullable: true },
          { name: 'business_type', type: 'text', isNullable: true },
          { name: 'city', type: 'text', isNullable: true },
          { name: 'onboarding_step', type: 'integer', isNullable: true },
          { name: 'onboarding_draft', type: 'jsonb', isNullable: true },
          { name: 'timezone', type: 'text', isNullable: true }
        ]
      },
      {
        schema: 'public',
        table: 'tenants',
        auditCategory: 'public.tenant',
        columns: [
          { name: 'partner_id', type: 'uuid', isNullable: true },
          { name: 'instance_name', type: 'text' },
          { name: 'wa_number', type: 'text', isNullable: true },
          { name: 'instance_status', type: 'text' },
          { name: 'daily_crm_limit', type: 'integer' },
          { name: 'campaign_enabled', type: 'boolean' },
          { name: 'cleanup_notes', type: 'text', isNullable: true },
          { name: 'is_active', type: 'boolean', isNullable: true },
          { name: 'business_name', type: 'text', isNullable: true },
          { name: 'partner_name', type: 'text', isNullable: true }
        ]
      },
      {
        schema: 'public',
        table: 'wa_campaigns',
        auditCategory: 'comms.wa_campaign',
        columns: [
          { name: 'tenant_id', type: 'uuid' },
          { name: 'name', type: 'text' },
          { name: 'template_name', type: 'text', isNullable: true },
          { name: 'template_hash', type: 'text', isNullable: true },
          { name: 'status', type: 'text' },
          { name: 'total_recipients', type: 'integer' },
          { name: 'sent_count', type: 'integer' },
          { name: 'delivered_count', type: 'integer' },
          { name: 'failed_count', type: 'integer' },
          { name: 'deferred_count', type: 'integer' },
          { name: 'started_at', type: 'timestamp with time zone', isNullable: true },
          { name: 'completed_at', type: 'timestamp with time zone', isNullable: true },
          { name: 'pool_rotation_ids', type: 'text[]', isNullable: true }
        ]
      },
      {
        schema: 'public',
        table: 'wa_contacts',
        auditCategory: 'comms.wa_contact',
        columns: [
          { name: 'tenant_id', type: 'uuid' },
          { name: 'phone', type: 'text' },
          { name: 'name', type: 'text', isNullable: true },
          { name: 'profile_pic_url', type: 'text', isNullable: true },
          { name: 'last_presence', type: 'text', isNullable: true },
          { name: 'last_seen_at', type: 'timestamp with time zone', isNullable: true }
        ]
      },
      {
        schema: 'public',
        table: 'wa_customer_consent',
        auditCategory: 'comms.wa_consent',
        columns: [
          { name: 'tenant_id', type: 'uuid', isNullable: true },
          { name: 'opted_out', type: 'boolean' },
          { name: 'opted_out_at', type: 'timestamp with time zone', isNullable: true },
          { name: 'opted_out_source', type: 'text', isNullable: true },
          { name: 'opted_in_at', type: 'timestamp with time zone', isNullable: true },
          { name: 'phone', type: 'text' }
        ]
      },
      {
        schema: 'public',
        table: 'wa_interaction_log',
        auditCategory: 'comms.wa_interaction',
        columns: [
          { name: 'tenant_id', type: 'uuid' },
          { name: 'campaign_id', type: 'uuid', isNullable: true },
          { name: 'recipient_phone', type: 'text' },
          { name: 'recipient_name', type: 'text', isNullable: true },
          { name: 'instance_used', type: 'text' },
          { name: 'status', type: 'text' },
          { name: 'message_type', type: 'text' },
          { name: 'evo_msg_id', type: 'text', isNullable: true },
          { name: 'error_reason', type: 'text', isNullable: true },
          { name: 'retry_count', type: 'smallint' },
          { name: 'scheduled_at', type: 'timestamp with time zone' },
          { name: 'sent_at', type: 'timestamp with time zone', isNullable: true },
          { name: 'delivered_at', type: 'timestamp with time zone', isNullable: true },
          { name: 'idempotency_key', type: 'text' },
          { name: 'direction', type: 'text' },
          { name: 'intent', type: 'text', isNullable: true }
        ]
      },
      {
        schema: 'public',
        table: 'instance_health_log',
        auditCategory: 'public.instance_health_log',
        columns: [
          { name: 'instance_name', type: 'text' },
          { name: 'tenant_id', type: 'uuid', isNullable: true },
          { name: 'is_pool', type: 'boolean' },
          { name: 'event_type', type: 'text' },
          { name: 'previous_status', type: 'text' },
          { name: 'new_status', type: 'text' },
          { name: 'detail', type: 'jsonb', isNullable: true },
          { name: 'logged_at', type: 'timestamp with time zone' }
        ]
      },
      {
        schema: 'public',
        table: 'pool_number_stats',
        auditCategory: 'public.pool_number_stat',
        columns: [
          { name: 'instance_name', type: 'text' },
          { name: 'state', type: 'text' },
          { name: 'daily_sent', type: 'integer' },
          { name: 'daily_limit', type: 'integer' },
          { name: 'delivery_rate', type: 'numeric', isNullable: true },
          { name: 'last_used', type: 'timestamp with time zone', isNullable: true },
          { name: 'warmup_day', type: 'integer' }
        ]
      },
      {
        schema: 'public',
        table: 'rate_limit_events',
        auditCategory: 'public.rate_limit_event',
        columns: [
          { name: 'tenant_id', type: 'uuid', isNullable: true },
          { name: 'instance_name', type: 'text', isNullable: true },
          { name: 'event_type', type: 'text' },
          { name: 'msg_count_at_event', type: 'integer', isNullable: true },
          { name: 'detail', type: 'text', isNullable: true },
          { name: 'logged_at', type: 'timestamp with time zone' }
        ]
      }
    ],
    l2Coordinators: []
  }
};

// Main execution
const domain = process.argv[2] || 'inventory';
if (!configs[domain]) {
  console.error(`Unknown domain: ${domain}. Available: ${Object.keys(configs).join(', ')}`);
  process.exit(1);
}

const gen = new RPCGenerator(configs[domain]);
const sqlOutput = gen.generate();

const outputPath = path.join(process.cwd(), `supabase/consolidated_rpcs/${domain}_hierarchy.sql`);
fs.writeFileSync(outputPath, sqlOutput);

console.log(`✅ Consolidated migration for ${domain} generated at: ${outputPath}`);
