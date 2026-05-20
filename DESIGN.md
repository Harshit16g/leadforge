# Leaex V2 — Complete System Design
> Last updated: 2026-04-17 | Status: Planning → Implementation

---

## A. ShadCN UI Reset

### Commands to run (in order)
```bash
cd leaex-v2
pnpm dlx shadcn@latest init --preset b1y6KWU5p4 --template next --monorepo
npx shadcn@latest add login-04
npx shadcn@latest add signup-04
npx shadcn@latest add dashboard-01
```

### Components to DELETE entirely
All files in `src/components/` EXCEPT:
- Keep: all `ui/` shadcn primitives (accordion, avatar, badge, button, card, etc.)
- Keep: `ThemeProvider.tsx`, `Navbar.tsx` (landing page)
- DELETE: 3d-card, aurora-background, background-gradient-animation, bento-grid,
  container-scroll, css-sparkles, floating-dock, infinite-moving-cards, moving-border,
  progressive-blur, smooth-cursor, sparkles, spotlight, typewriter-effect, confetti
- DELETE: BookingTrendChart, DonutChart, DualAxisChart, GaugeChart, PeakHoursChart, RevenueAreaChart
- DELETE: AdminHeader, AdminSidebar, PartnerHeader, PartnerSidebar, CustomerFloatingDock
  (rebuild from shadcn dashboard-01 primitives)
- DELETE: All onboarding step components (rebuild cleanly)
- DELETE: ImpersonationBanner (rebuild)

### Dependencies to KEEP (landing page / core)
`framer-motion`, `motion`, `@studio-freight/lenis`, `apexcharts`, `react-apexcharts`,
`canvas-confetti`, `@tabler/icons-react`, `lucide-react`, `next-themes`, `sonner`,
`zod`, `react-hook-form`, `@hookform/resolvers`, `zustand`, `date-fns`

### Dependencies to REMOVE
`apexcharts`, `react-apexcharts` — replaced by shadcn charts (recharts)

---

## B. Complete Database Schema Architecture

### PostgreSQL Schemas (9 new + public)

```
public        → profiles only (Supabase auth bridge)
iam           → Identity & Access Management (roles, permissions, MBAC)
orgs          → Multi-tenant organizations & branches
crm           → Customers, bookings, reviews, contact requests
ops           → Staff, services, expenses, day-closing, attendance, payroll
scheduling    → Scheduler configs, availability, waitlist, queue
inventory     → Products, suppliers, purchases
billing       → Plans, subscriptions, payments
comms         → Templates, automation, campaigns, notifications
platform      → Settings, audit logs, instance requests
```

---

### `public` schema

```sql
public.profiles (
  id                  UUID PK → auth.users,
  display_name        TEXT,
  avatar_url          TEXT,
  phone               TEXT,
  email_verified      BOOLEAN DEFAULT false,
  phone_verified      BOOLEAN DEFAULT false,
  onboarding_complete BOOLEAN DEFAULT false,
  last_active_at      TIMESTAMPTZ,
  metadata            JSONB DEFAULT '{}'
)
```

---

### `iam` schema — MBAC Core

```sql
iam.tiers (
  id        SMALLSERIAL PK,
  tier_key  TEXT UNIQUE,   -- 'admin' | 'org' | 'partner' | 'staff' | 'customer'
  level     SMALLINT,      -- 1=admin (highest control) … 5=customer
  label     TEXT
)
-- Seed: (1,'admin',1,'Platform Admin'), (2,'org',2,'Organisation'),
--       (3,'partner',3,'Partner/Owner'), (4,'staff',4,'Staff'),
--       (5,'customer',5,'Customer')

iam.roles (
  id             UUID PK DEFAULT gen_random_uuid(),
  tier_id        SMALLINT FK → iam.tiers,
  role_key       TEXT UNIQUE,
  display_name   TEXT,
  description    TEXT,
  is_system      BOOLEAN DEFAULT false,  -- undeletable
  is_custom      BOOLEAN DEFAULT false,  -- org-created
  parent_role_id UUID FK → iam.roles,   -- inherits permissions from
  created_by     UUID FK → auth.users,
  created_at     TIMESTAMPTZ DEFAULT now()
)
-- Seed system roles:
-- ADMIN tier:   core_admin, mgmt_admin, ops_admin, support_admin, audit_admin
-- ORG tier:     org_owner
-- PARTNER tier: owner_partner, mgr_partner, branch_partner, franchise_partner
-- STAFF tier:   supervisor, floor_staff, cashier, technician
-- CUSTOMER:     walk_in, member, vip, subscriber, guest

iam.modules (
  id           UUID PK DEFAULT gen_random_uuid(),
  module_key   TEXT UNIQUE,
  -- Values: 'crm'|'bookings'|'scheduling'|'billing'|'analytics'|'inventory'
  --         'comms'|'wa_api'|'google_biz'|'onboarding'|'auth_iam'|'audit_logs'
  --         'media_cdn'|'staff_mgmt'|'day_closing'|'expenses'|'settings'
  display_name TEXT,
  tier_min     TEXT,      -- minimum tier that can be granted this module
  is_active    BOOLEAN DEFAULT true
)

iam.module_actions (
  id          UUID PK DEFAULT gen_random_uuid(),
  module_id   UUID FK → iam.modules,
  action_key  TEXT,   -- 'view'|'create'|'edit'|'delete'|'export'|'manage'|'configure'|'approve'
  risk_level  TEXT,   -- 'low'|'medium'|'high'|'critical'
  UNIQUE(module_id, action_key)
)

iam.role_permissions (
  id              UUID PK DEFAULT gen_random_uuid(),
  role_id         UUID FK → iam.roles,
  module_id       UUID FK → iam.modules,
  allowed_actions TEXT[],  -- list of action_keys
  UNIQUE(role_id, module_id)
)

iam.actor_roles (
  id           UUID PK DEFAULT gen_random_uuid(),
  user_id      UUID FK → auth.users,
  role_id      UUID FK → iam.roles,
  context_type TEXT,    -- 'platform' | 'org' | 'branch'
  context_id   UUID,    -- NULL for platform; org_id or branch_id otherwise
  granted_by   UUID FK → auth.users,
  valid_from   TIMESTAMPTZ DEFAULT now(),
  valid_until  TIMESTAMPTZ,       -- NULL = permanent
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role_id, context_type, COALESCE(context_id, '00000000-0000-0000-0000-000000000000'))
)

iam.permission_overrides (
  id               UUID PK DEFAULT gen_random_uuid(),
  actor_role_id    UUID FK → iam.actor_roles,
  module_id        UUID FK → iam.modules,
  action_key       TEXT,
  effect           TEXT CHECK (effect IN ('allow','deny')),
  reason           TEXT,
  granted_by       UUID FK → auth.users,
  created_at       TIMESTAMPTZ DEFAULT now()
)

iam.invitations (
  id           UUID PK DEFAULT gen_random_uuid(),
  email        TEXT NOT NULL,
  role_id      UUID FK → iam.roles,
  context_type TEXT,
  context_id   UUID,
  token        TEXT UNIQUE NOT NULL,
  invited_by   UUID FK → auth.users,
  expires_at   TIMESTAMPTZ NOT NULL,
  accepted_at  TIMESTAMPTZ,
  status       TEXT DEFAULT 'pending'  -- 'pending'|'accepted'|'expired'|'revoked'
)

-- Core permission check function
CREATE OR REPLACE FUNCTION iam.check_permission(
  p_user_id      UUID,
  p_module_key   TEXT,
  p_action_key   TEXT,
  p_context_type TEXT DEFAULT 'platform',
  p_context_id   UUID DEFAULT NULL
) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_allowed BOOLEAN := false;
  v_denied  BOOLEAN := false;
  v_role    RECORD;
BEGIN
  -- Walk all active actor_roles for this user + context
  FOR v_role IN
    SELECT ar.id, ar.role_id, r.parent_role_id
    FROM iam.actor_roles ar
    JOIN iam.roles r ON r.id = ar.role_id
    WHERE ar.user_id = p_user_id
      AND ar.is_active = true
      AND (ar.valid_until IS NULL OR ar.valid_until > now())
      AND ar.context_type = p_context_type
      AND (p_context_id IS NULL OR ar.context_id = p_context_id OR ar.context_id IS NULL)
  LOOP
    -- Check permission_overrides first (deny wins)
    IF EXISTS (
      SELECT 1 FROM iam.permission_overrides po
      JOIN iam.modules m ON m.id = po.module_id
      WHERE po.actor_role_id = v_role.id
        AND m.module_key = p_module_key
        AND po.action_key = p_action_key
        AND po.effect = 'deny'
    ) THEN
      RETURN false;  -- explicit deny is final
    END IF;

    -- Check role_permissions (including inherited via parent_role_id)
    IF EXISTS (
      SELECT 1 FROM iam.role_permissions rp
      JOIN iam.modules m ON m.id = rp.module_id
      WHERE rp.role_id = v_role.role_id
        AND m.module_key = p_module_key
        AND p_action_key = ANY(rp.allowed_actions)
    ) THEN
      v_allowed := true;
    END IF;
  END LOOP;

  RETURN v_allowed;
END;
$$;
```

---

### `orgs` schema

```sql
orgs.organizations (
  id            UUID PK DEFAULT gen_random_uuid(),
  org_type      TEXT NOT NULL,  -- 'franchise'|'independent'|'chain'|'virtual'
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  legal_name    TEXT,
  parent_org_id UUID FK → orgs.organizations,  -- franchise hierarchy
  business_type TEXT,  -- 'beauty_salon'|'spa'|'barbershop'|'nail_salon'|'wellness'|'clinic'|'other'
  contact_email TEXT,
  contact_phone TEXT,
  gst_number    TEXT,
  pan_number    TEXT,
  logo_url      TEXT,
  description   TEXT,
  status        TEXT DEFAULT 'pending',  -- 'pending'|'active'|'suspended'|'inactive'
  settings      JSONB DEFAULT '{}',
  deleted_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
)

orgs.branches (
  id              UUID PK DEFAULT gen_random_uuid(),
  org_id          UUID FK → orgs.organizations ON DELETE CASCADE,
  name            TEXT NOT NULL,
  branch_code     TEXT,    -- unique within org
  is_primary      BOOLEAN DEFAULT false,
  address         TEXT,
  city            TEXT,
  state           TEXT,
  pin_code        TEXT,
  phone           TEXT,
  operating_hours JSONB DEFAULT '{}',
  cover_photo_url TEXT,
  status          TEXT DEFAULT 'active',  -- 'active'|'inactive'|'temporarily_closed'
  deleted_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, branch_code)
)
```

---

### `crm` schema

```sql
crm.customers (
  id            UUID PK DEFAULT gen_random_uuid(),
  org_id        UUID FK → orgs.organizations ON DELETE CASCADE,
  branch_id     UUID FK → orgs.branches,
  auth_user_id  UUID,              -- FK auth.users (if customer has login)
  name          TEXT NOT NULL,
  phone         TEXT NOT NULL,
  email         TEXT,
  gender        TEXT,              -- 'male'|'female'|'other'|'prefer_not_to_say'
  birthday      DATE,
  anniversary   DATE,
  customer_type TEXT DEFAULT 'walk_in', -- 'walk_in'|'member'|'vip'|'subscriber'|'guest'
  total_visits  INT DEFAULT 0,
  total_spend   NUMERIC(12,2) DEFAULT 0,
  last_visit_at TIMESTAMPTZ,
  loyalty_points INT DEFAULT 0,
  tags          TEXT[] DEFAULT '{}',
  notes         TEXT,
  wa_consent    TEXT DEFAULT 'pending', -- 'opted_in'|'opted_out'|'pending'
  referral_code TEXT UNIQUE,
  referred_by   UUID FK → crm.customers,
  deleted_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, phone)
)

crm.bookings (
  id                  UUID PK DEFAULT gen_random_uuid(),
  org_id              UUID FK → orgs.organizations ON DELETE CASCADE,
  branch_id           UUID FK → orgs.branches,
  customer_id         UUID FK → crm.customers,
  staff_id            UUID FK → ops.staff_members,
  source              TEXT DEFAULT 'walkin', -- 'online'|'walkin'|'qr'|'phone'
  status              TEXT DEFAULT 'pending',
  -- 'confirmed'|'pending'|'in_progress'|'completed'|'cancelled'|'no_show'
  scheduling_method   TEXT,  -- 'manual'|'auto_assigned'|'ai_optimized'
  services            JSONB NOT NULL DEFAULT '[]',
  -- [{service_id, service_name, staff_id, price, duration_minutes, gst_rate}]
  total_amount        NUMERIC(12,2) DEFAULT 0,
  discount_amount     NUMERIC(12,2) DEFAULT 0,
  gst_amount          NUMERIC(12,2) DEFAULT 0,
  final_amount        NUMERIC(12,2) DEFAULT 0,
  payment_method      TEXT,  -- 'cash'|'card'|'upi'|'razorpay'|'wallet'|'pending'
  payment_status      TEXT DEFAULT 'pending', -- 'paid'|'pending'|'partial'|'refunded'|'waived'
  scheduled_at        TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  assigned_at         TIMESTAMPTZ,
  assigned_by         UUID,          -- NULL if auto-assigned
  buffer_before       INT DEFAULT 0, -- minutes
  buffer_after        INT DEFAULT 10,
  wa_notification_id  TEXT,          -- WA job_id for sent notification
  wa_reminder_sent    BOOLEAN DEFAULT false,
  waitlist_id         UUID FK → scheduling.waitlist,
  notes               TEXT,
  created_by          UUID FK → auth.users,
  deleted_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
)
-- Indexes: (org_id, status), (org_id, scheduled_at), (branch_id, scheduled_at),
--          (staff_id, scheduled_at), (customer_id)

crm.reviews (
  id                 UUID PK DEFAULT gen_random_uuid(),
  org_id             UUID FK → orgs.organizations,
  branch_id          UUID FK → orgs.branches,
  customer_id        UUID FK → crm.customers,
  booking_id         UUID FK → crm.bookings,
  overall_rating     SMALLINT CHECK (overall_rating BETWEEN 1 AND 5),
  stylist_rating     SMALLINT CHECK (stylist_rating BETWEEN 1 AND 5),
  cleanliness_rating SMALLINT CHECK (cleanliness_rating BETWEEN 1 AND 5),
  value_rating       SMALLINT CHECK (value_rating BETWEEN 1 AND 5),
  review_text        TEXT,
  photo_url          TEXT,
  is_published       BOOLEAN DEFAULT false,
  platform           TEXT DEFAULT 'in_app', -- 'in_app'|'google'|'yelp'
  created_at         TIMESTAMPTZ DEFAULT now(),
  updated_at         TIMESTAMPTZ DEFAULT now()
)

crm.contact_requests (
  id            UUID PK DEFAULT gen_random_uuid(),
  org_id        UUID,              -- NULL until linked to an org
  business_name TEXT,
  contact_name  TEXT NOT NULL,
  phone         TEXT NOT NULL,
  email         TEXT,
  city          TEXT,
  message       TEXT,
  source        TEXT DEFAULT 'website', -- 'website'|'whatsapp'|'qr'|'referral'
  status        TEXT DEFAULT 'unread',  -- 'unread'|'in_progress'|'resolved'|'spam'
  assigned_to   UUID FK → auth.users,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
)
```

---

### `ops` schema

```sql
ops.staff_members (
  id                    UUID PK DEFAULT gen_random_uuid(),
  org_id                UUID FK → orgs.organizations ON DELETE CASCADE,
  branch_id             UUID FK → orgs.branches,
  user_id               UUID,           -- FK auth.users (if staff has portal login)
  name                  TEXT NOT NULL,
  phone                 TEXT,
  email                 TEXT,
  staff_code            TEXT,           -- unique within org
  photo_url             TEXT,
  employment_type       TEXT DEFAULT 'full_time', -- 'full_time'|'part_time'|'contractor'
  skills                UUID[] DEFAULT '{}',      -- FK array → ops.service_catalogue(id)
  buffer_time_minutes   INT DEFAULT 10,
  max_daily_appointments INT DEFAULT 8,
  preferred_hours       JSONB DEFAULT '{}',
  -- {"start":"09:00","end":"18:00","days":[1,2,3,4,5]}
  salary_type           TEXT DEFAULT 'fixed', -- 'fixed'|'commission'|'hybrid'
  base_salary           NUMERIC(12,2) DEFAULT 0,
  commission_rate       NUMERIC(5,2) DEFAULT 0, -- percentage
  is_active             BOOLEAN DEFAULT true,
  joined_at             DATE,
  left_at               DATE,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, staff_code)
)

ops.service_catalogue (
  id               UUID PK DEFAULT gen_random_uuid(),
  org_id           UUID FK → orgs.organizations ON DELETE CASCADE,
  branch_id        UUID FK → orgs.branches,  -- NULL = org-wide
  name             TEXT NOT NULL,
  category         TEXT,
  description      TEXT,
  duration_minutes INT NOT NULL DEFAULT 30,
  price            NUMERIC(12,2) NOT NULL,
  gst_rate         NUMERIC(5,2) DEFAULT 0,
  sort_order       INT DEFAULT 0,
  is_active        BOOLEAN DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
)

ops.expenses (
  id           UUID PK DEFAULT gen_random_uuid(),
  org_id       UUID FK → orgs.organizations ON DELETE CASCADE,
  branch_id    UUID FK → orgs.branches,
  category     TEXT NOT NULL,
  description  TEXT,
  amount       NUMERIC(12,2) NOT NULL,
  expense_date DATE NOT NULL,
  is_recurring BOOLEAN DEFAULT false,
  recurrence   TEXT,  -- 'daily'|'weekly'|'monthly'|'yearly'
  added_by     UUID FK → auth.users,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
)

ops.day_closings (
  id             UUID PK DEFAULT gen_random_uuid(),
  org_id         UUID FK → orgs.organizations ON DELETE CASCADE,
  branch_id      UUID FK → orgs.branches NOT NULL,
  closing_date   DATE NOT NULL,
  bookings_count INT DEFAULT 0,
  revenue        NUMERIC(12,2) DEFAULT 0,
  expenses       NUMERIC(12,2) DEFAULT 0,
  net_profit     NUMERIC(12,2) DEFAULT 0,
  cash_in_hand   NUMERIC(12,2) DEFAULT 0,
  is_locked      BOOLEAN DEFAULT false,
  closed_by      UUID FK → auth.users,
  closed_at      TIMESTAMPTZ,
  notes          TEXT,
  snapshot       JSONB DEFAULT '{}',
  created_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, branch_id, closing_date)
)

ops.attendance_logs (
  id               UUID PK DEFAULT gen_random_uuid(),
  staff_id         UUID FK → ops.staff_members ON DELETE CASCADE,
  org_id           UUID FK → orgs.organizations,
  branch_id        UUID FK → orgs.branches,
  date             DATE NOT NULL,
  clocked_in_at    TIMESTAMPTZ,
  clocked_out_at   TIMESTAMPTZ,
  status           TEXT DEFAULT 'present',
  -- 'present'|'late'|'absent'|'half_day'|'leave'|'holiday'
  check_in_method  TEXT DEFAULT 'manual', -- 'manual'|'qr_code'|'gps'
  location         JSONB,   -- {lat, lng}
  notes            TEXT,
  approved_by      UUID FK → auth.users,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE(staff_id, date)
)

ops.payroll_records (
  id                  UUID PK DEFAULT gen_random_uuid(),
  staff_id            UUID FK → ops.staff_members ON DELETE CASCADE,
  org_id              UUID FK → orgs.organizations,
  period_start        DATE NOT NULL,
  period_end          DATE NOT NULL,
  base_amount         NUMERIC(12,2) DEFAULT 0,
  commission_amount   NUMERIC(12,2) DEFAULT 0,
  deductions          NUMERIC(12,2) DEFAULT 0,
  bonus               NUMERIC(12,2) DEFAULT 0,
  net_amount          NUMERIC(12,2) GENERATED ALWAYS AS
                      (base_amount + commission_amount + bonus - deductions) STORED,
  payment_status      TEXT DEFAULT 'pending', -- 'pending'|'processed'|'paid'
  payment_date        DATE,
  payment_method      TEXT,
  razorpay_payout_id  TEXT,
  payslip_url         TEXT,   -- PDF in storage bucket
  breakdown           JSONB DEFAULT '{}',
  -- {bookings: [{id, service, commission}], adjustments: [...]}
  approved_by         UUID FK → auth.users,
  notes               TEXT,
  generated_at        TIMESTAMPTZ DEFAULT now(),
  created_at          TIMESTAMPTZ DEFAULT now(),
  UNIQUE(staff_id, period_start, period_end)
)
```

---

### `scheduling` schema

```sql
scheduling.configs (
  id                          UUID PK DEFAULT gen_random_uuid(),
  org_id                      UUID FK → orgs.organizations ON DELETE CASCADE,
  branch_id                   UUID FK → orgs.branches,  -- NULL = org-wide default
  slot_duration_minutes       INT DEFAULT 30,
  buffer_default_minutes      INT DEFAULT 10,
  advance_booking_days        INT DEFAULT 30,
  cancellation_window_hours   INT DEFAULT 24,
  max_utilization_pct         INT DEFAULT 80,  -- AI optimizer target ceiling
  waitlist_enabled            BOOLEAN DEFAULT true,
  auto_assign_enabled         BOOLEAN DEFAULT true,
  ai_optimizer_enabled        BOOLEAN DEFAULT false,
  business_hours              JSONB DEFAULT '{}',
  -- {"mon":{"open":"09:00","close":"20:00","closed":false}, ...}
  peak_hours_config           JSONB DEFAULT '{}',
  settings                    JSONB DEFAULT '{}',
  created_at                  TIMESTAMPTZ DEFAULT now(),
  updated_at                  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, COALESCE(branch_id, '00000000-0000-0000-0000-000000000000'))
)

scheduling.staff_availability (
  id          UUID PK DEFAULT gen_random_uuid(),
  staff_id    UUID FK → ops.staff_members ON DELETE CASCADE,
  org_id      UUID FK → orgs.organizations,
  date        DATE NOT NULL,
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL,
  block_type  TEXT DEFAULT 'available',
  -- 'available'|'lunch'|'break'|'leave'|'blocked'|'custom'
  reason      TEXT,
  created_by  UUID FK → auth.users,
  created_at  TIMESTAMPTZ DEFAULT now()
)
-- Index: (staff_id, date)

scheduling.waitlist (
  id                  UUID PK DEFAULT gen_random_uuid(),
  org_id              UUID FK → orgs.organizations ON DELETE CASCADE,
  branch_id           UUID FK → orgs.branches,
  customer_id         UUID FK → crm.customers ON DELETE CASCADE,
  service_id          UUID FK → ops.service_catalogue,
  preferred_staff_id  UUID FK → ops.staff_members,  -- NULL = no preference
  requested_date      DATE,
  earliest_time       TIME,
  latest_time         TIME,
  flexibility_minutes INT DEFAULT 30,
  status              TEXT DEFAULT 'waiting',
  -- 'waiting'|'offered'|'accepted'|'expired'|'cancelled'|'fulfilled'
  offered_slot        JSONB,    -- {date, start_time, staff_id, booking_id}
  offered_at          TIMESTAMPTZ,
  offer_expires_at    TIMESTAMPTZ,
  wa_message_id       TEXT,     -- WA job_id for the offer message
  priority            INT DEFAULT 0,   -- higher = served first (VIP customers get +50)
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
)

scheduling.queue (
  id          UUID PK DEFAULT gen_random_uuid(),
  org_id      UUID FK → orgs.organizations ON DELETE CASCADE,
  branch_id   UUID FK → orgs.branches,
  booking_id  UUID FK → crm.bookings ON DELETE CASCADE UNIQUE,
  priority    INT DEFAULT 0,
  constraints JSONB DEFAULT '{}',
  -- {skills_required:[...], preferred_staff_id:null, not_before:"09:00", not_after:"18:00"}
  status      TEXT DEFAULT 'pending', -- 'pending'|'assigned'|'cancelled'
  created_at  TIMESTAMPTZ DEFAULT now()
)
-- Index: (org_id, status, priority DESC)
```

---

### `inventory` schema

```sql
inventory.products (
  id              UUID PK DEFAULT gen_random_uuid(),
  org_id          UUID FK → orgs.organizations ON DELETE CASCADE,
  name            TEXT NOT NULL,
  category        TEXT,
  brand           TEXT,
  sku             TEXT,
  unit            TEXT NOT NULL DEFAULT 'pcs',
  purchase_price  NUMERIC(12,2) DEFAULT 0,
  selling_price   NUMERIC(12,2) DEFAULT 0,
  gst_rate        NUMERIC(5,2) DEFAULT 0,
  current_stock   INT DEFAULT 0,
  reorder_level   INT DEFAULT 5,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
)

inventory.suppliers (
  id         UUID PK DEFAULT gen_random_uuid(),
  org_id     UUID FK → orgs.organizations ON DELETE CASCADE,
  name       TEXT NOT NULL,
  phone      TEXT,
  email      TEXT,
  address    TEXT,
  gst_number TEXT,
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)

inventory.purchases (
  id             UUID PK DEFAULT gen_random_uuid(),
  org_id         UUID FK → orgs.organizations ON DELETE CASCADE,
  product_id     UUID FK → inventory.products ON DELETE RESTRICT,
  supplier_id    UUID FK → inventory.suppliers,
  quantity       INT NOT NULL,
  unit_price     NUMERIC(12,2) NOT NULL,
  total_price    NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  invoice_number TEXT,
  purchase_date  DATE NOT NULL,
  notes          TEXT,
  created_by     UUID FK → auth.users,
  created_at     TIMESTAMPTZ DEFAULT now()
)
```

---

### `billing` schema

```sql
billing.plans (
  id                UUID PK DEFAULT gen_random_uuid(),
  plan_key          TEXT UNIQUE NOT NULL,  -- 'starter'|'growth'|'pro'|'enterprise'
  display_name      TEXT NOT NULL,
  price_monthly     NUMERIC(12,2) NOT NULL DEFAULT 0,
  price_yearly      NUMERIC(12,2) NOT NULL DEFAULT 0,
  max_branches      INT DEFAULT 1,
  max_staff         INT DEFAULT 5,
  max_customers     INT DEFAULT 500,
  razorpay_plan_id  TEXT,
  is_active         BOOLEAN DEFAULT true,
  is_public         BOOLEAN DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
)

billing.plan_features (
  id          UUID PK DEFAULT gen_random_uuid(),
  plan_id     UUID FK → billing.plans ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  enabled     BOOLEAN DEFAULT false,
  limit_value INT,        -- NULL = unlimited
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(plan_id, feature_key)
)

billing.subscriptions (
  id                       UUID PK DEFAULT gen_random_uuid(),
  org_id                   UUID FK → orgs.organizations ON DELETE CASCADE,
  plan_id                  UUID FK → billing.plans,
  status                   TEXT DEFAULT 'trialing',
  -- 'trialing'|'active'|'past_due'|'canceled'|'grace'|'expired'|'paused'
  start_date               DATE,
  end_date                 DATE,
  trial_start              DATE,
  trial_end                DATE,
  grace_end                DATE,
  razorpay_subscription_id TEXT UNIQUE,
  cancelled_at             TIMESTAMPTZ,
  cancellation_reason      TEXT,
  created_at               TIMESTAMPTZ DEFAULT now(),
  updated_at               TIMESTAMPTZ DEFAULT now()
)

billing.payment_events (
  id                  UUID PK DEFAULT gen_random_uuid(),
  org_id              UUID FK → orgs.organizations,
  subscription_id     UUID FK → billing.subscriptions,
  razorpay_payment_id TEXT UNIQUE,
  amount              NUMERIC(12,2) NOT NULL,
  currency            TEXT DEFAULT 'INR',
  status              TEXT,  -- 'captured'|'failed'|'refunded'
  metadata            JSONB DEFAULT '{}',
  created_at          TIMESTAMPTZ DEFAULT now()
)

billing.webhook_events (
  id                UUID PK DEFAULT gen_random_uuid(),
  razorpay_event_id TEXT UNIQUE NOT NULL,  -- idempotency key
  event_type        TEXT,
  payload           JSONB DEFAULT '{}',
  processed_at      TIMESTAMPTZ DEFAULT now()
)
```

---

### `comms` schema

```sql
comms.templates (
  id          UUID PK DEFAULT gen_random_uuid(),
  org_id      UUID,    -- NULL = platform-level (system templates)
  name        TEXT NOT NULL,
  channel     TEXT NOT NULL,  -- 'whatsapp'|'sms'|'email'
  event_type  TEXT NOT NULL,
  -- 'booking_confirm'|'reminder'|'birthday'|'anniversary'|'manual_crm'
  -- 'appointment_assigned'|'waitlist_offer'|'booking_cancelled'
  -- 'payslip_ready'|'clock_in_reminder'|'re_engagement'
  subject     TEXT,           -- email only
  body        TEXT NOT NULL,
  variables   TEXT[] DEFAULT '{}',  -- ['{{name}}', '{{service}}', '{{time}}']
  is_active   BOOLEAN DEFAULT true,
  is_system   BOOLEAN DEFAULT false,
  created_by  UUID FK → auth.users,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
)

comms.automation_rules (
  id                     UUID PK DEFAULT gen_random_uuid(),
  org_id                 UUID FK → orgs.organizations ON DELETE CASCADE,
  rule_name              TEXT NOT NULL,
  channel                TEXT NOT NULL,
  trigger_event          TEXT NOT NULL,
  -- 'booking.assigned'|'booking.reminder'|'booking.completed'|'booking.cancelled'
  -- 'waitlist.slot_available'|'payroll.payslip_ready'|'attendance.morning'
  trigger_offset_minutes INT DEFAULT 0,  -- negative = before event
  template_id            UUID FK → comms.templates,
  conditions             JSONB DEFAULT '{}',
  is_active              BOOLEAN DEFAULT true,
  total_fired            INT DEFAULT 0,
  created_by             UUID FK → auth.users,
  created_at             TIMESTAMPTZ DEFAULT now(),
  updated_at             TIMESTAMPTZ DEFAULT now()
)

comms.campaigns (
  id                UUID PK DEFAULT gen_random_uuid(),
  org_id            UUID FK → orgs.organizations ON DELETE CASCADE,
  name              TEXT NOT NULL,
  channel           TEXT NOT NULL,
  template_id       UUID FK → comms.templates,
  target_filter     JSONB DEFAULT '{}',
  status            TEXT DEFAULT 'draft',
  total_recipients  INT DEFAULT 0,
  sent_count        INT DEFAULT 0,
  delivered_count   INT DEFAULT 0,
  failed_count      INT DEFAULT 0,
  scheduled_at      TIMESTAMPTZ,
  started_at        TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  created_by        UUID FK → auth.users,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
)

comms.notifications (
  id           UUID PK DEFAULT gen_random_uuid(),
  recipient_id UUID FK → auth.users NOT NULL,
  title        TEXT NOT NULL,
  body         TEXT,
  type         TEXT DEFAULT 'info',  -- 'info'|'warning'|'success'|'error'
  channel      TEXT DEFAULT 'in_app', -- 'in_app'|'push'|'email'|'sms'
  is_read      BOOLEAN DEFAULT false,
  data         JSONB DEFAULT '{}',
  sent_at      TIMESTAMPTZ DEFAULT now()
)
```

---

### `platform` schema

```sql
platform.settings (
  key        TEXT PK,
  value      JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID FK → auth.users
)

platform.audit_logs (
  id           UUID PK DEFAULT gen_random_uuid(),
  actor_id     UUID FK → auth.users,
  actor_role   TEXT,
  action       TEXT NOT NULL,
  target_type  TEXT,   -- 'org'|'booking'|'staff'|'plan'|'subscription'|etc.
  target_id    UUID,
  org_id       UUID,   -- context org
  before_state JSONB,
  after_state  JSONB,
  ip_address   INET,
  user_agent   TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
)
-- Index: (org_id, created_at DESC), (actor_id, created_at DESC)

platform.instance_requests (
  id            UUID PK DEFAULT gen_random_uuid(),
  org_id        UUID,           -- set after approval
  contact_name  TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_email TEXT,
  business_name TEXT NOT NULL,
  notes         TEXT,
  status        TEXT DEFAULT 'pending',
  -- 'pending'|'approved'|'rejected'|'waitlisted'
  admin_notes   TEXT,
  instance_name TEXT,
  reviewed_by   UUID FK → auth.users,
  reviewed_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
)
```

---

## C. Model Layer — Zod Pattern

Every entity has a model file in `src/models/<schema>/`. The pattern is:

```typescript
// src/models/crm/customer.model.ts
import { z } from 'zod'

// 1. Enum schemas
export const CustomerTypeSchema = z.enum(['walk_in','member','vip','subscriber','guest'])
export const WaConsentSchema    = z.enum(['opted_in','opted_out','pending'])

// 2. Full row (mirrors DB 1:1)
export const CustomerRowSchema = z.object({
  id:            z.string().uuid(),
  org_id:        z.string().uuid(),
  branch_id:     z.string().uuid().nullable(),
  name:          z.string().min(1).max(255),
  phone:         z.string().min(7).max(20),
  customer_type: CustomerTypeSchema.default('walk_in'),
  wa_consent:    WaConsentSchema.default('pending'),
  total_visits:  z.number().int().default(0),
  total_spend:   z.number().default(0),
  deleted_at:    z.string().datetime().nullable(),
  created_at:    z.string().datetime(),
  updated_at:    z.string().datetime(),
  // ... all columns
})
export type CustomerRow = z.infer<typeof CustomerRowSchema>

// 3. Insert (omit auto-generated)
export const CustomerInsertSchema = CustomerRowSchema.omit({
  id: true, created_at: true, updated_at: true,
  deleted_at: true, total_visits: true, total_spend: true,
})
export type CustomerInsert = z.infer<typeof CustomerInsertSchema>

// 4. Update (all optional)
export const CustomerUpdateSchema = CustomerInsertSchema.partial()
export type CustomerUpdate = z.infer<typeof CustomerUpdateSchema>

// 5. API request schemas (validated in route handlers)
export const CreateCustomerRequestSchema = z.object({
  org_id:        z.string().uuid(),
  name:          z.string().min(1),
  phone:         z.string().min(7),
  customer_type: CustomerTypeSchema.optional(),
  wa_consent:    WaConsentSchema.optional(),
})
export type CreateCustomerRequest = z.infer<typeof CreateCustomerRequestSchema>

// 6. Enriched response types (for joined queries)
export const CustomerWithStatsSchema = CustomerRowSchema.extend({
  recent_bookings_count: z.number().optional(),
  last_booking_date:     z.string().datetime().nullable().optional(),
})
export type CustomerWithStats = z.infer<typeof CustomerWithStatsSchema>
```

### Model files to create (38 total)

```
src/models/
├── _shared/
│   ├── pagination.model.ts     -- PaginatedResponse<T>, ApiResponse<T>
│   └── guard.model.ts          -- PermissionContext type
├── iam/
│   ├── tier.model.ts
│   ├── role.model.ts
│   ├── module.model.ts
│   ├── actor-role.model.ts
│   ├── permission-override.model.ts
│   └── invitation.model.ts
├── orgs/
│   ├── organization.model.ts
│   └── branch.model.ts
├── crm/
│   ├── customer.model.ts
│   ├── booking.model.ts        -- includes BookingService JSONB schema
│   ├── review.model.ts
│   └── contact-request.model.ts
├── ops/
│   ├── staff-member.model.ts   -- includes preferred_hours JSONB schema
│   ├── service-catalogue.model.ts
│   ├── expense.model.ts
│   ├── day-closing.model.ts
│   ├── attendance-log.model.ts
│   └── payroll-record.model.ts
├── scheduling/
│   ├── scheduling-config.model.ts
│   ├── staff-availability.model.ts
│   ├── waitlist.model.ts
│   └── scheduling-queue.model.ts
├── inventory/
│   ├── product.model.ts
│   ├── supplier.model.ts
│   └── inventory-purchase.model.ts
├── billing/
│   ├── plan.model.ts
│   ├── plan-feature.model.ts
│   ├── subscription.model.ts
│   ├── payment-event.model.ts
│   └── webhook-event.model.ts
├── comms/
│   ├── template.model.ts
│   ├── automation-rule.model.ts
│   ├── campaign.model.ts
│   └── notification.model.ts
└── platform/
    ├── platform-setting.model.ts
    ├── audit-log.model.ts
    └── instance-request.model.ts
```

---

## D. IAM Guard Layer

### New guard replaces `requireAdmin()` / `requirePartner()`

```typescript
// src/lib/auth/iam.ts
export async function requirePermission(
  module: string,
  action: string,
  contextType: 'platform' | 'org' | 'branch' = 'platform',
  contextId?: string
): Promise<{ user: User; orgId?: string; response: null }
         | { user: null; response: NextResponse }>

// Usage in any API route:
const auth = await requirePermission('crm', 'view', 'org', orgId)
if (auth.response) return auth.response
```

### ROLE_HOME (updated for new tiers)

```typescript
export const ROLE_HOME: Record<string, string> = {
  core_admin:       '/admin/dashboard',
  mgmt_admin:       '/admin/dashboard',
  ops_admin:        '/admin/dashboard',
  support_admin:    '/admin/dashboard',
  audit_admin:      '/admin/dashboard',
  org_owner:        '/partner/dashboard',
  owner_partner:    '/partner/dashboard',
  mgr_partner:      '/partner/dashboard',
  branch_partner:   '/partner/dashboard',
  franchise_partner:'/partner/dashboard',
  supervisor:       '/employee/today',
  floor_staff:      '/employee/today',
  cashier:          '/employee/today',
  technician:       '/employee/today',
  walk_in:          '/customer',
  member:           '/customer',
  vip:              '/customer',
  subscriber:       '/customer',
  guest:            '/customer',
}
```

---

## E. Scheduling Module

### Greedy Auto-Assignment Algorithm

```
src/lib/scheduling/greedy-assign.ts

Input:
  service_id, requested_at (nullable), org_id, branch_id,
  customer_id (VIP check), preferred_staff_id (nullable)

Step 1: Load eligible staff
  → ops.staff_members WHERE org_id AND branch_id AND skills @> [service_id] AND is_active

Step 2: For each candidate date window (requested_at ± 30min, then +1d, +2d, +3d):
  For each eligible staff member:
    a. Load bookings for that date: crm.bookings WHERE staff_id AND DATE(scheduled_at)
    b. Load availability blocks: scheduling.staff_availability WHERE staff_id AND date
    c. Compute free slots:
       business_hours_slots - booked_slots - availability_blocks - buffers
    d. Filter: slot_duration >= service.duration_minutes + staff.buffer_time_minutes
    e. Score staff: utilization% (ascending) + VIP bonus if customer_type='vip'

Step 3: Pick highest-scoring (lowest utilization) available slot
  → Update crm.bookings SET staff_id, scheduled_at, scheduling_method='auto_assigned'
  → Fire WA notification: appointment_assigned (customer + staff)

Step 4: If no slot found in 3 days → insert into scheduling.waitlist
  → Return {assigned: false, waitlisted: true}
```

### AI Day Optimizer

```
Supabase Edge Function: scheduling-ai-optimizer

Input: org_id, branch_id, date
Output: proposed_reassignments [{booking_id, new_staff_id, new_start_time}]
        does NOT auto-apply — partner must click "Apply Plan"

Algorithm:
  1. Load all bookings for date + staff availability
  2. Current utilization per staff: (booked_minutes / working_minutes) * 100
  3. Target: minimize std_dev(utilization[]) i.e. balance the workload
  4. Constraint check per swap: skills match, no overlap, no buffer violation
  5. Return proposed plan with before/after utilization comparison
```

### WA Triggers for Scheduling

| Event | Trigger | WA Message Type | Recipients |
|---|---|---|---|
| Booking assigned (auto) | `booking.assigned` | `appointment_assigned` | Customer + Staff |
| 24h before scheduled_at | Cron -1440min | `appointment_reminder` | Customer |
| Booking cancelled | `booking.cancelled` | `booking_cancelled` | Customer |
| Waitlist slot opens | `waitlist.slot_available` | `waitlist_offer` | Waitlisted Customer |
| Payslip generated | `payroll.payslip_ready` | `payslip_ready` | Staff (employee) |

---

## F. Employee Portal (E-01 to E-07)

| Screen | Route | Key Data |
|---|---|---|
| E-01 My Schedule | `/employee/schedule` | 7-day timeline, ops.staff_members + crm.bookings |
| E-02 Today | `/employee/today` | Agenda list, start/complete booking, mark attendance |
| E-03 Availability | `/employee/availability` | scheduling.staff_availability CRUD |
| E-04 Profile | `/employee/profile` | ops.staff_members read + photo update |
| E-05 History | `/employee/history` | Past bookings + earnings (crm.bookings + ops.payroll_records) |
| E-06 Attendance | `/employee/attendance` | ops.attendance_logs 30-day heatmap, clock-in/out |
| E-07 Payroll | `/employee/payroll` | ops.payroll_records list + PDF payslip download |

---

## G. WA_API Compliance

### New MessageType values to add to `src/types/whatsapp.ts`

```typescript
export type MessageType =
  | "campaign" | "booking_confirm" | "reminder" | "birthday"
  | "anniversary" | "manual_crm" | "re_engagement" | "inbound"
  | "appointment_assigned"   // NEW
  | "waitlist_offer"          // NEW
  | "booking_cancelled"       // NEW
  | "payslip_ready"           // NEW
  | "clock_in_reminder"       // NEW
```

### API field rename: `partner_id` → `org_id`
All WA API routes and types that use `partner_id` in the context of org identification
must be updated to `org_id`. The `AdminCreateInstanceRequest`, `StartCampaignRequest`,
and related types need this rename for consistency with the new schema.

---

## H. Complete File Structure (new directories only)

```
src/
├── models/                      ← NEW: 38 Zod model files
│   ├── _shared/, iam/, orgs/, crm/, ops/
│   ├── scheduling/, inventory/, billing/, comms/, platform/
│   └── index.ts                 ← barrel export
│
├── lib/
│   ├── auth/
│   │   ├── iam.ts               ← NEW: requirePermission() + check_permission RPC
│   │   ├── guard.ts             ← REWRITE
│   │   └── roles.ts             ← REWRITE
│   └── scheduling/
│       ├── greedy-assign.ts     ← NEW
│       └── availability.ts      ← NEW
│
├── app/
│   ├── (employee)/              ← NEW route group
│   │   ├── layout.tsx
│   │   └── employee/
│   │       ├── schedule/page.tsx    E-01
│   │       ├── today/page.tsx       E-02
│   │       ├── availability/page.tsx E-03
│   │       ├── profile/page.tsx     E-04
│   │       ├── history/page.tsx     E-05
│   │       ├── attendance/page.tsx  E-06
│   │       └── payroll/page.tsx     E-07
│   │
│   ├── book/[orgSlug]/          ← NEW: public booking flow
│   │   └── page.tsx
│   │
│   └── api/
│       ├── scheduling/          ← NEW
│       │   ├── availability/route.ts
│       │   ├── auto-assign/route.ts
│       │   ├── ai-optimize/route.ts
│       │   ├── queue/route.ts
│       │   ├── waitlist/route.ts
│       │   └── waitlist/[id]/offer/route.ts
│       ├── employee/            ← NEW
│       │   ├── schedule/route.ts
│       │   ├── today/route.ts
│       │   ├── today/[id]/start/route.ts
│       │   ├── today/[id]/complete/route.ts
│       │   ├── availability/route.ts
│       │   ├── profile/route.ts
│       │   ├── history/route.ts
│       │   ├── attendance/route.ts
│       │   ├── attendance/clock-in/route.ts
│       │   ├── attendance/clock-out/route.ts
│       │   ├── payroll/route.ts
│       │   └── payroll/[id]/route.ts
│       ├── admin/
│       │   ├── iam/roles/route.ts          ← NEW
│       │   ├── iam/roles/[id]/route.ts     ← NEW
│       │   ├── iam/modules/route.ts        ← NEW
│       │   ├── iam/actor-roles/route.ts    ← NEW
│       │   └── iam/invitations/route.ts    ← NEW
│       └── book/[orgSlug]/
│           ├── services/route.ts   ← NEW: public
│           ├── slots/route.ts      ← NEW: public
│           └── confirm/route.ts    ← NEW: public
│
└── supabase/
    └── migrations/
        ├── 019_create_schemas.sql
        ├── 020_iam_schema.sql
        ├── 021_orgs_schema.sql
        ├── 022_crm_schema.sql
        ├── 023_ops_schema.sql
        ├── 024_scheduling_schema.sql
        ├── 025_inventory_schema.sql
        ├── 026_billing_schema.sql
        ├── 027_comms_schema.sql
        ├── 028_platform_schema.sql
        ├── 029_iam_check_permission_fn.sql
        ├── 030_iam_seed_roles_modules.sql
        ├── 031_data_migration.sql
        └── 032_drop_public_deprecated.sql
```

---

## I. Complete API Route Map

### Admin
| Method | Route | Permission |
|---|---|---|
| GET | `/api/admin/dashboard` | `analytics:view` @ platform |
| GET/POST | `/api/admin/partners` | `crm:view` @ platform |
| GET/PUT/DELETE | `/api/admin/partners/[id]` | `crm:manage` @ platform |
| GET/POST | `/api/admin/orgs` | `crm:manage` @ platform |
| GET/PUT/DELETE | `/api/admin/orgs/[id]` | `crm:manage` @ platform |
| GET/POST | `/api/admin/iam/roles` | `auth_iam:manage` @ platform |
| GET/PUT/DELETE | `/api/admin/iam/roles/[id]` | `auth_iam:manage` @ platform |
| GET | `/api/admin/iam/modules` | `auth_iam:view` @ platform |
| GET/POST/DELETE | `/api/admin/iam/actor-roles` | `auth_iam:manage` @ platform |
| GET/POST | `/api/admin/iam/invitations` | `auth_iam:manage` @ platform |
| GET | `/api/admin/revenue` | `analytics:view` @ platform |
| GET | `/api/admin/revenue/stats` | `analytics:view` @ platform |
| GET | `/api/admin/bookings-report` | `analytics:view` @ platform |
| GET | `/api/admin/customers` | `crm:view` @ platform |
| GET/PUT | `/api/admin/onboarding/[id]` | `onboarding:approve` @ platform |
| GET/POST | `/api/admin/plans` | `billing:manage` @ platform |
| GET/PUT/DELETE | `/api/admin/plans/[id]` | `billing:manage` @ platform |
| GET/POST | `/api/admin/plans/features` | `billing:manage` @ platform |
| GET | `/api/admin/trials` | `billing:view` @ platform |
| GET/PUT/DELETE | `/api/admin/communications/[id]` | `comms:manage` @ platform |
| GET | `/api/admin/audit-log` | `audit_logs:view` @ platform |
| GET/PUT | `/api/admin/settings` | `settings:configure` @ platform |
| GET | `/api/admin/notifications` | `notifications:view` @ platform |

### Partner/Org
| Method | Route | Permission |
|---|---|---|
| GET | `/api/partner/dashboard` | `analytics:view` @ org |
| POST | `/api/partner/walkin` | `bookings:create` @ org |
| GET/POST | `/api/partner/bookings` | `bookings:view` @ org |
| GET/PUT/DELETE | `/api/partner/bookings/[id]` | `bookings:edit` @ org |
| GET/POST | `/api/partner/customers` | `crm:view` @ org |
| GET/PUT/DELETE | `/api/partner/customers/[id]` | `crm:edit` @ org |
| GET/POST | `/api/partner/staff` | `staff_mgmt:view` @ org |
| GET/PUT/DELETE | `/api/partner/staff/[id]` | `staff_mgmt:edit` @ org |
| GET/PUT | `/api/partner/staff/[id]/availability` | `scheduling:manage` @ org |
| GET | `/api/partner/staff/[id]/payroll` | `staff_mgmt:view` @ org |
| GET | `/api/partner/scheduler` | `scheduling:view` @ org |
| GET/PUT | `/api/partner/scheduler/queue` | `scheduling:manage` @ org |
| POST | `/api/partner/invitations` | `auth_iam:manage` @ org |
| GET/POST | `/api/partner/services` | `bookings:manage` @ org |
| GET/PUT/DELETE | `/api/partner/services/[id]` | `bookings:manage` @ org |
| GET/POST | `/api/partner/branches` | `settings:manage` @ org |
| GET/PUT/DELETE | `/api/partner/branches/[id]` | `settings:manage` @ org |
| GET | `/api/partner/inventory` | `inventory:view` @ org |
| POST | `/api/partner/inventory/purchases` | `inventory:create` @ org |
| GET | `/api/partner/revenue` | `analytics:view` @ org |
| GET/POST | `/api/partner/expenses` | `expenses:view` @ org |
| GET/PUT/DELETE | `/api/partner/expenses/[id]` | `expenses:edit` @ org |
| POST | `/api/partner/day-closing` | `day_closing:create` @ org |
| GET | `/api/partner/reviews` | `crm:view` @ org |
| GET/POST | `/api/partner/contact-requests` | `crm:view` @ org |
| GET/POST | `/api/partner/automation` | `comms:manage` @ org |
| GET/PUT/DELETE | `/api/partner/automation/[id]` | `comms:manage` @ org |
| GET/PUT | `/api/partner/settings` | `settings:view` @ org |
| GET | `/api/partner/payments` | `billing:view` @ org |

### Scheduling (new)
| Method | Route | Auth |
|---|---|---|
| GET | `/api/scheduling/availability` | partner or public (org slug) |
| POST | `/api/scheduling/auto-assign` | `scheduling:manage` @ org |
| POST | `/api/scheduling/ai-optimize` | `scheduling:manage` @ org |
| GET/PUT | `/api/scheduling/queue` | `scheduling:manage` @ org |
| GET/POST | `/api/scheduling/waitlist` | `scheduling:view` @ org |
| POST | `/api/scheduling/waitlist/[id]/offer` | `scheduling:manage` @ org |

### Employee Portal (new)
| Method | Route | Auth |
|---|---|---|
| GET | `/api/employee/schedule` | own staff session |
| GET | `/api/employee/today` | own staff session |
| POST | `/api/employee/today/[id]/start` | own staff session |
| POST | `/api/employee/today/[id]/complete` | own staff session |
| GET/PUT | `/api/employee/availability` | own staff session |
| GET/PUT | `/api/employee/profile` | own staff session |
| GET | `/api/employee/history` | own staff session |
| GET | `/api/employee/attendance` | own staff session |
| POST | `/api/employee/attendance/clock-in` | own staff session |
| POST | `/api/employee/attendance/clock-out` | own staff session |
| GET | `/api/employee/payroll` | own staff session |
| GET | `/api/employee/payroll/[id]` | own staff session |

### Public Booking (new)
| Method | Route | Auth |
|---|---|---|
| GET | `/api/book/[orgSlug]/services` | public |
| GET | `/api/book/[orgSlug]/slots` | public |
| POST | `/api/book/[orgSlug]/confirm` | public (customer phone OTP) |
| POST | `/api/book/[orgSlug]/cancel/[id]` | public (customer phone OTP) |

---

## J. Migration Sequence (14 migrations)

```
019_create_schemas.sql          CREATE SCHEMA iam, orgs, crm, ops, scheduling,
                                inventory, billing, comms, platform;
                                GRANT USAGE ON SCHEMA ... TO authenticated, service_role;

020_iam_schema.sql              tiers + roles + modules + module_actions +
                                role_permissions + actor_roles + permission_overrides +
                                invitations tables

021_orgs_schema.sql             organizations + branches

022_crm_schema.sql              customers + bookings (with scheduling cols) +
                                reviews + contact_requests

023_ops_schema.sql              staff_members + service_catalogue + expenses +
                                day_closings + attendance_logs + payroll_records

024_scheduling_schema.sql       configs + staff_availability + waitlist + queue

025_inventory_schema.sql        products + suppliers + purchases

026_billing_schema.sql          plans + plan_features + subscriptions +
                                payment_events + webhook_events

027_comms_schema.sql            templates + automation_rules + campaigns +
                                notifications

028_platform_schema.sql         settings + audit_logs + instance_requests

029_iam_check_permission_fn.sql iam.check_permission() function

030_iam_seed_roles_modules.sql  INSERT tiers, system roles, modules, module_actions,
                                default role_permissions

031_data_migration.sql          Copy public.partners → orgs.organizations,
                                public.branches → orgs.branches,
                                public.employees → ops.staff_members,
                                public.customers → crm.customers,
                                public.bookings → crm.bookings,
                                ... all 21 public tables mapped to new schemas
                                + create actor_roles for all existing users

032_drop_public_deprecated.sql  DROP TABLE public.partners, public.branches,
                                public.employees, ... (only after 031 verified)
```
