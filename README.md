# LeadForge CRM — Assignment Documentation

LeadForge is a Next.js CRM prototype for dealership sales operations.

This README is structured for evaluator-friendly understanding of the project architecture, routes, workflows, APIs, and UI previews.

## 1) Project Summary

- **Domain:** Automotive dealership CRM
- **Primary users:** Manager, Sales Advisors
- **Core goal:** Convert inbound leads into bookings/sales with structured operations
- **Mode:** Sandbox-first UX with role switcher on landing page

---

## 2) Key Modules

- **Role-based workspace entry** (`/`)
- **Public lead capture form** (`/capture`)
- **Dashboard analytics & KPI cockpit** (`/dashboard`)
- **Leads desk and lead profile workspace** (`/leads`, `/leads/[id]`)
- **Pipeline Kanban board** (`/pipeline`)
- **Team management, tasks, test-drives, campaigns**
- **Internal messaging module**
- **Partner APIs + inbound webhook endpoints**

---

## 3) Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **UI:** React 19 + Tailwind CSS + shadcn/radix-style components
- **Data/Auth:** Supabase
- **Charts:** Recharts
- **DnD:** @dnd-kit / @hello-pangea/dnd

---

## 4) High-Level Architecture

```mermaid
flowchart LR
    U["End Users<br/>Manager / Sales / Public Lead"] --> N["Next.js App Router"]

    N --> P["Pages & Components"]
    N --> A["Server Actions"]
    N --> R["API Route Handlers"]

    A --> S[("Supabase")]
    R --> S

    W["External Sources<br/>(Ads / Forms / Partners)"] --> H["/api/webhooks/leads"]
    H --> S

    S --> V["CRM Views<br/>Dashboard, Leads, Pipeline, Tasks"]
```

---

## 5) Route Map (Evaluator Quick View)

```mermaid
graph TD
    Root["/"] --> Dash["/dashboard"]
    Root --> Leads["/leads"]
    Root --> Capture["/capture"]

    Dash --> Analytics["/analytics"]
    Dash --> Team["/team"]
    Dash --> Settings["/settings"]
    Dash --> Pipeline["/pipeline"]
    Dash --> Tasks["/tasks"]
    Dash --> Messages["/messages"]
    Dash --> Campaigns["/campaigns"]
    Dash --> TestDrives["/test-drives"]
    Dash --> QR["/qr"]

    Leads --> LeadDetail["/leads/[id]"]

    API["/api/partner/*"] --> Emp["/employees"]
    API --> Msg["/messages"]
    API --> Restore["/ledger/[id]/restore"]

    Webhook["/api/webhooks/leads"] --> Leads

```

---

## 6) Core Workflows

### 6.1 Lead Intake Workflow

```mermaid
sequenceDiagram
    participant Customer
    participant CapturePage as /capture
    participant Action as createLead (Server Action)
    participant DB as Supabase
    participant CRM as Leads Desk

    Customer->>CapturePage: Submit details
    CapturePage->>Action: FormData (name, phone, source, notes)
    Action->>DB: Insert lead row
    DB-->>CRM: Lead available for assignment & follow-up
```

### 6.2 Sales Operations Workflow

```mermaid
flowchart TD
    A[New Lead] --> B[Assign Sales Rep]
    B --> C[Contact + Log Interaction]
    C --> D{Qualified?}
    D -- No --> E[Lost]
    D -- Yes --> F[Test Drive / Negotiation]
    F --> G{Won?}
    G -- Yes --> H[Completed]
    G -- No --> E
```

### 6.3 Automation & Ledger Workflow

```mermaid
flowchart LR
    X[Scheduled/Triggered Automation] --> Y{Lead status + inactivity checks}
    Y -->|Completed/Lost + stale| Z[Archive to Ledger]
    Y -->|Intermediate + stale| N[Reset to New + SLA Log]
    Z --> C[Revalidate Leads/Ledger views]
    N --> C
```

---

## 7) Data Model (Conceptual)

```mermaid
erDiagram
    PROFILES ||--o{ LEADS : assigned_to
    LEADS ||--o{ INTERACTIONS : has
    LEADS ||--o{ TASKS : has
    PROFILES ||--o{ INTERNAL_MESSAGES : sends
    PROFILES ||--o{ INTERNAL_MESSAGES : receives

    PROFILES {
      uuid id PK
      text name
      text email
      text role
    }

    LEADS {
      uuid id PK
      text name
      text email
      text phone
      text source
      text status
      text priority
      text health
      int score
      bool archived
      uuid assigned_to FK
      timestamp created_at
      timestamp last_interaction_at
    }

    INTERACTIONS {
      uuid id PK
      uuid lead_id FK
      text type
      text content
      timestamp created_at
    }

    TASKS {
      uuid id PK
      uuid lead_id FK
      text title
      text status
      timestamp created_at
    }

    INTERNAL_MESSAGES {
      uuid id PK
      text thread_id
      uuid sender_id FK
      uuid recipient_id FK
      text body
      timestamp created_at
    }
```

---

## 8) Screenshots & UI Previews

> Current repository visual assets used as evaluator-friendly previews.

### Authentication / Entry Visuals

![Login Illustration](./public/images/login-illustration.png)

![Signup Illustration](./public/images/signup-illustration.png)

### Workspace Theme / Sidebar Preview

![Partner Sidebar Preview](./public/images/partner-sidebar.png)

### Background Visual

![Auth Background](./public/images/auth-bg.png)

---

## 9) API Snapshot

- `GET /api/partner/employees`
- `GET /api/partner/messages`
- `POST /api/partner/messages`
- `GET /api/partner/messages/[threadId]`
- `POST /api/partner/ledger/[id]/restore`
- `POST /api/webhooks/leads`

---

## 10) Local Setup

```bash
# install dependencies
npm install --legacy-peer-deps

# run development server
npm run dev
```

### Environment Variables

Create `.env.local` with at least:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## 11) Evaluation Guide (Fast Review Path)

1. Open `/` and verify role-based sandbox entry.
2. Open `/capture` and submit a sample lead.
3. Review `/dashboard` for KPI and operational cards.
4. Check `/leads` and `/pipeline` for lead lifecycle flow.
5. Verify API route presence under `src/app/api`.

---

## 12) Notes

- Some advanced modules rely on seeded Supabase data for richer dashboard and workflow states.

