-- Migration: Add 'completed' status to lead_status enum
-- Idempotent: Only adds the enum value if it does not already exist

ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'completed';
