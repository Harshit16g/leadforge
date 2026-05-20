-- ============================================================
-- 20260503000006_comms_messages_dedup.sql
-- Add wa_message_id to comms.messages for EVO webhook dedup.
-- Prevents duplicate rows when Evolution API re-delivers webhooks.
-- ============================================================

ALTER TABLE comms.messages
    ADD COLUMN IF NOT EXISTS wa_message_id text;

-- UNIQUE index: one row per EVO message ID (non-null only)
CREATE UNIQUE INDEX IF NOT EXISTS uq_messages_wa_message_id
    ON comms.messages(wa_message_id)
    WHERE wa_message_id IS NOT NULL;
