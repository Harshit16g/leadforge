# Leaex V2: Database Migration Roadmap

This document provides a chronological and thematic overview of the database evolution for Project Leaex V2.

## Phase 1: Foundation & Legacy Porting (April 20)
*   **Goal**: Migrating from the legacy monolithic structure to a multi-schema platform.
*   **Key Migrations**: 
    - `20260420000001_port_legacy_logic.sql`
    - `20260420000003_removal_of_deprecated_tables.sql`
*   **Outcome**: Established the `crm`, `ops`, and `orgs` schemas. Deprecated the old `public` table clutter.

## Phase 2: Communication & Security (April 21)
*   **Goal**: Implementing WhatsApp session management and RLS (Row Level Security) for partner data.
*   **Key Migrations**:
    - `20260421000001_final_rls_wa_conversations.sql`
    - `20260421000003_unique_wa_sessions_org.sql`
    - `20260421000004_invoice_tokens.sql`
*   **Outcome**: Secured WhatsApp conversations and implemented token-based invoice access for customers.

## Phase 3: The Identity Unification Engine (April 24)
*   **Goal**: Building the industry-leading fuzzy matching and identity bridging system.
*   **Key Migrations**:
    - `20260424000001_customer_unification.sql` to `20260424000007_universal_identity_bridge.sql`
    - `20260424000013_predictive_lookup.sql`
*   **Outcome**: Implemented `pg_trgm` based similarity scores and "Deep Identity Matching" to prevent duplicate customer profiles.

## Phase 4: Operational Hierarchy (April 25)
*   **Goal**: Enforcing atomic writes via the L0/L1/L2 RPC hierarchy.
*   **Key Migrations**:
    - `20260425000002_partner_ops_hierarchy.sql`
*   **Outcome**: All partner writes (bookings, staff, catalogue) were moved from direct SQL to secure, audited PostgreSQL functions.

## Phase 5: Service Sessions & Hands-free Lifecycle (April 29)
*   **Goal**: Implementing the 7-state service lifecycle and real-time handshakes.
*   **Key Migrations**:
    - `20260429000004_service_sessions.sql`
    - `20260429000005_stylist_profiles_works_requests.sql`
*   **Outcome**: Introduced `in_service` states, `service_complaints`, and advanced stylist performance tracking.

## Phase 6: Stabilization & Improvements (April 30)
*   **Goal**: Hardening the walk-in flow and fixing performance bottlenecks.
*   **Key Migrations**:
    - `20260430000001_booking_otps.sql`
    - `20260430000002_walkin_improvements.sql`
*   **Outcome**: Added dedicated `booking_otps` table for session persistence and implemented `create_walkin_transaction_v5` to support long-running active sessions.

---

## Schema Dependency Graph
1.  **Platform** (L0): Logs & Core Config.
2.  **Orgs** (L0): Multi-tenant context.
3.  **CRM** (L2): Depends on Orgs for context and Platform for logging.
4.  **Ops** (L1/L2): Depends on CRM for booking links and Orgs for branch context.
5.  **Comms** (L1): Independent bridge for WhatsApp integrations.

## Summary of Triggers
- **Identity Fusion**: Fuses profiles on new user signup.
- **OTP Generation**: Automatically creates a handshake code when a booking moves to `confirmed`.
- **Revenue Attribution**: Calculates staff commissions the moment a booking hits `completed`.
- **Audit Pulse**: Automatically touches `updated_at` and writes to `audit_logs` for all `ops` tables.
