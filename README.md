# Leaex V2 - Unified Wellness Platform

Leaex is a multi-tenant platform for wellness organizations (salons, spas, etc.) to manage bookings, customers, and automated communications.

## 🏛 Architecture

- **Frontend**: Next.js 15+ (App Router)
- **Backend**: Next.js Route Handlers + Supabase (Auth/DB) + WhatsApp Engine (wa_api)
- **Database**: PostgreSQL (via Supabase)
- **Automation**: WhatsApp integration via a dedicated Rust-based `wa_api` engine.

## 🔐 Auth Model

- **Admin**: Platform-level access. Can provision instances, review requests, and monitor global analytics.
- **Partner**: Organization-level access. Manages their own salon, employees, and 1:1 customer communications.
- **Guard Logic**: Server-side guards in `@/lib/auth/guard.ts` (Admin) and `@/lib/auth/partner.ts` (Partner) enforce role-based access control.

## 📱 WhatsApp Integration

The platform integrates with a dedicated WhatsApp Automation Engine (`wa_api`).
- **CRM Messages**: 1:1 messages sent via the partner's personal WhatsApp instance.
- **Campaigns**: Bulk broadcasts routed through platform-managed pool numbers (Admin-driven).
- **Client**: Dedicated server-side client in `@/lib/whatsapp/client.ts`.

## ⚙️ Environment Configuration

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service key (Server-only) |
| `WA_API_URL` | Base URL for the WhatsApp engine |
| `X_API_KEY` | Platform API key for wa_api |
| `X_ADMIN_KEY` | Admin API key for wa_api admin operations |

## 🛠 Development

### Setup
1. `npm install`
2. Configure `.env.local`
3. `npm run dev`

### Standards
- **Strict Typing**: All API responses and DB models must be typed in `@/types/`.
- **Security First**: Always use `requireAdmin()` or `requirePartner()` guards in API routes.
- **Error Handling**: Use the structured `WhatsAppError` class for all engine interactions.

## 🚀 CI/CD

Basic CI is configured via GitHub Actions to run linting and type-checking on every PR.
See `.github/workflows/ci.yml`.
