-- ============================================================
-- 20260503000003_comms_messages.sql
-- comms.messages — single source of truth for all chat.
-- WhatsApp = transport only. UI always reads from this table.
-- comms.wa_conversations becomes a raw webhook receipt log.
-- ============================================================

CREATE TABLE IF NOT EXISTS comms.messages (
    id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id      uuid        REFERENCES crm.bookings(id) ON DELETE SET NULL,
    customer_id     uuid        REFERENCES crm.customers(id) ON DELETE SET NULL,
    org_id          uuid        NOT NULL REFERENCES orgs.organizations(id),

    -- Who sent it
    direction       text        NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    sender_role     text        NOT NULL CHECK (sender_role IN ('customer', 'partner', 'employee', 'admin', 'system')),
    sender_id       uuid,                               -- null for system/customer (unauth)
    sender_phone    text,                               -- customer phone for inbound

    -- Content
    body            text        NOT NULL CHECK (length(body) <= 4000),
    media_url       text,
    media_type      text,

    -- Delivery
    channel         text        NOT NULL DEFAULT 'wa' CHECK (channel IN ('wa', 'sms', 'email', 'in_app')),
    delivery_status text        NOT NULL DEFAULT 'pending'
                    CHECK (delivery_status IN ('pending','sent','delivered','read','failed')),
    delivery_error  text,
    delivered_at    timestamptz,
    read_at         timestamptz,
    retry_count     integer     NOT NULL DEFAULT 0,
    last_retry_at   timestamptz,

    -- Link back to raw WA webhook receipt
    wa_conversation_id uuid     REFERENCES comms.wa_conversations(id) ON DELETE SET NULL,

    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_booking    ON comms.messages(booking_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_customer   ON comms.messages(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_org        ON comms.messages(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_pending    ON comms.messages(delivery_status, channel) WHERE delivery_status = 'pending';

-- Enable Realtime for chat UI subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE comms.messages;

ALTER TABLE comms.messages ENABLE ROW LEVEL SECURITY;

-- Partners read messages for their own org
CREATE POLICY "partner_messages_read" ON comms.messages
    FOR SELECT USING (org_id = public.get_user_org_id(auth.uid()));

-- All writes go through service_role via RPCs only
CREATE POLICY "deny_direct_message_write" ON comms.messages
    FOR INSERT WITH CHECK (false);

CREATE POLICY "deny_direct_message_update" ON comms.messages
    FOR UPDATE USING (false);
