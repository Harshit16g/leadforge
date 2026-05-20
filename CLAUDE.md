# Leaex V2 — Project Memory

> This file is the persistent memory for AI-assisted development on the Leaex V2 project.
> **Last updated:** 2026-04-21 · **Conversation:** Database Migration & RLS Completion

---

## 1. Purpose & Context
**Leaex** is a full-stack SaaS platform targeting all well-being organisations (salons, spas, clinics, nail/beauty outlets, therapy centers) across India. It serves as a comprehensive CRM, POS, and booking system.

**Target Market Expansion:** All well-being organisations, not just salons.

## 2. Platform Architecture
Leaex uses a **Unified Login System**, meaning all users access the platform from the exact same entry point with robust security measures enforcing their specific role.

### User Roles:
1. **Leaex Admin** (Platform HQ — manages all partners, revenue, platform)
2. **Partner/Owner** (Business HQ — manages the organisation's daily CRM operations)
3. **Employee** (Floor staff — schedule, bookings, performance)
4. **Customer** (Self-service — finding and booking services)

### Security Layers (Unified Login Guardrails)
1. **API Route Guards**: Every API route must verify session role + `org_id` context via `requirePermission` (found in `src/lib/auth/guard.ts`).
2. **PostgreSQL RLS**: Row-Level Security on all tables across 10 schemas. Managed via centralized `public.get_user_org_id()` helper.
3. **Schema Isolation**: Multi-tenant data is isolated into domain-specific schemas (`orgs`, `crm`, `ops`, `billing`, etc.).

---

## 3. Product Development Mode (Workflow)

Now that the foundation is rock-solid, every new feature follow this strict workflow:

### 3.1 Workflow Steps
1.  **Model First**: 
    - Create `src/models/<schema>/<entity>.model.ts` (Zod schema + Insert/Update types).
    - Export from `src/models/<schema>/index.ts`.
2.  **Database**: 
    - Add table + indexes + RLS in a new migration.
    - Always use the pattern from `20260421000001_final_rls_wa_conversations.sql`.
    - Apply with `npx supabase db push`.
3.  **API Layer**: 
    - Use `requirePermission(...)` (never old guards).
    - Query with schema qualification: `.schema("orgs").from("organizations")`.
    - Always validate inputs with the Zod model.
4.  **Frontend**: 
    - Import types from `src/models/...`
    - Use `usePartnerApi` / `useAdminApi` hooks (they are pre-configured for modular schemas).

### 3.2 Golden Rules (NEVER BREAK)
- **NO LEGACY REFS**: Never write `.from("partners")`, `.from("employees")`, or any `public.*` EXCEPT `profiles`.
- **ZOD VALIDATION**: Always use the model’s Zod schema for insert/update operations.
- **SCHEMA DISCIPLINE**: New tables MUST go into the correct domain schema (`comms.`, `ops.`, etc.).
- **RLS SMOKE TEST**: Row-Level Security is our final safety net — test every new table/policy with a partner login to verify data isolation.

---

## 4. Current State (as of 2026-04-21)

### Phase 9: Final Cleanup & RLS ✅ COMPLETE
- **Modular Database**: 10 clean schemas implemented (`iam`, `orgs`, `crm`, `ops`, `billing`, `comms`, `inventory`, `platform`, `scheduling`, `analytics`).
- **RLS Enforced**: Full tenant isolation applied to 54+ tables using `public.get_user_org_id`.
- **Types Finalized**: `src/types/supabase.generated.ts` synchronized for all modular schemas.
- **Legacy Purged**: All 24 legacy `public` tables dropped. Zero code references to `partners` table remain.

### Known Gaps & Outstanding Work
1. **`src/middleware.ts` is MISSING** — Need to create/link `src/proxy.ts` to `src/middleware.ts` for Edge routing.
2. **WhatsApp Webhook Handler**: Create `/api/webhooks/evo` to process Evolution API events into `comms.wa_conversations`.
3. **Phone OTP auth not wired**:supa signup/login pages exist, but backend Phone OTP flow is not yet implemented.

---

## 5. Development Standards (Enforced)

1. **CSS Variables Only:** Never hardcode hex values. Always use semantic tokens (`bg-primary`, `bg-card`).
2. **"use client" only when needed:** For components using state, effects, or DOM events.
3. **Spacing:** Standard card padding is `p-6` (24px). Grid gap is `gap-6`.
4. **Icons:** Use `<span className="icon-[solar--widget-linear]">` pattern.
5. **Elevation:** All cards/modals must use `shadow-sm` (rest) and `shadow-md` (hover).
6. **Radii:** `rounded-lg` for form elements, `rounded-xl` for containers.



# Booking Verification Redesign — Walkthrough

## What Changed

### 1. MSG91 Service Library
**[NEW]** [index.ts](file:///home/harshit/projects/leaex/leaex-v2/src/lib/msg91/index.ts)

A centralized service with **all 23 DLT-verified MSG91 templates** mapped as a typed registry. Features:
- **Type-safe template keys** — `MSG91_TEMPLATES.OTP`, `MSG91_TEMPLATES.BOOKING_CONFIRMATION`, etc.
- **Core `sendSms()` function** — handles the Flow API call with auth headers
- **12 convenience helpers** — `sendOtp()`, `sendBookingConfirmation()`, `sendAppointmentReminder()`, `sendRescheduleNotification()`, `notifyPartnerNewBooking()`, `sendPartnerOnboarding()`, `sendPerformanceReport()`, `sendOffer()`, `sendDiscount()`, `sendRevisitReminder()`, `sendVisitFollowup()`, `sendAppointmentConfirmation()`

These are ready for use anywhere in the codebase (WhatsApp notifications, partner alerts, follow-up campaigns, etc.)

---

### 2. Supabase SMS Hook Edge Function
**[NEW]** [sms-hook/index.ts](file:///home/harshit/projects/leaex/leaex-v2/supabase/functions/sms-hook/index.ts)

Intercepts Supabase Auth's built-in OTP delivery and routes it through MSG91 instead of the default SMS provider.

> [!IMPORTANT]
> **Manual setup required** — After deploying, configure in Supabase Dashboard:
> 1. Go to **Authentication → Hooks → Send SMS Hook**
> 2. Enable the hook, set type to **HTTPS**
> 3. Set URL to `https://<project-id>.supabase.co/functions/v1/sms-hook`
> 4. Generate and save the webhook secret
> 5. Add secrets: `npx supabase secrets set MSG91_AUTH_KEY=439776AomIF4tTEbhp69ec90a7P1 MSG91_OTP_TEMPLATE_ID=679a6747d6fc051a447a8733`

---

### 3. Booking Page UI Overhaul
**[MODIFY]** [page.tsx](file:///home/harshit/projects/leaex/leaex-v2/src/app/book/[orgSlug]/page.tsx)

render_diffs(file:///home/harshit/projects/leaex/leaex-v2/src/app/book/[orgSlug]/page.tsx)

#### Label changes
| Before | After |
|---|---|
| Client Identity | Your Name |
| WABA Gateway | Phone Number |
| LINK (button) | Verify |
| Neural Handshake Code | Enter Verification Code |
| Commit Booking Protocol | Confirm Booking |
| Session Manifest | Booking Summary |
| Verification Hub | Your Details |
| Final Fee | Total |
| Neural Optimization | Best Available |
| Window | When |
| Cloud Transmission Preview | WhatsApp Confirmation |
| Encrypted Handshake Node | Secure Booking |
| Powered by Leaex Neural Infrastructure | Powered by Leaex |
| Initiate New Handshake | Book Another Appointment |
| Protocol Error | Unavailable |

#### New behaviors
- **Auto-session detection** — on mount, checks `supabase.auth.getUser()`. If logged in, pre-fills name/phone, sets `otpVerified=true`, shows "ALREADY VERIFIED" badge
- **Notes field** — added before the confirm button for special requests
- **Resend link** — "Didn't receive it? Check your SMS inbox or resend" below OTP input
- **Input disabled** when session already detected (prevents accidental overwrites)

---

### 4. Confirm API Auth Relaxation
**[MODIFY]** [confirm/route.ts](file:///home/harshit/projects/leaex/leaex-v2/src/app/api/book/[orgSlug]/confirm/route.ts)

render_diffs(file:///home/harshit/projects/leaex/leaex-v2/src/app/api/book/[orgSlug]/confirm/route.ts)

- Removed the hard `if (!user?.phone) return 401` gate
- Added `customerPhone` to `ConfirmBody` interface
- Phone resolution: **session user phone → body.customerPhone → 401**
- CRM customer resolved/created via **service-role** (no session required)

---

### 5. Environment Fix
**[MODIFY]** [.env](file:///home/harshit/projects/leaex/leaex-v2/.env)

- Fixed `MSG_91_API_KEY:"value"` → `MSG_91_API_KEY=value` (was using colon instead of equals)
- Added `MSG91_OTP_TEMPLATE_ID=679a6747d6fc051a447a8733`

## Verification

- **OTP flow**: `signInWithOtp({ phone })` → Supabase generates OTP → SMS Hook edge function → MSG91 delivers via template `679a6747d6fc051a447a8733` → `verifyOtp()` validates → profile auto-created by `handle_new_user` trigger
- **Logged-in flow**: Page detects session → skips OTP → direct "Confirm Booking"
- **Confirm API**: Works with or without active session — uses `customerPhone` fallback

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **leaex-v2** (9696 symbols, 16924 relationships, 300 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/leaex-v2/context` | Codebase overview, check index freshness |
| `gitnexus://repo/leaex-v2/clusters` | All functional areas |
| `gitnexus://repo/leaex-v2/processes` | All execution flows |
| `gitnexus://repo/leaex-v2/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
