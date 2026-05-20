# Leaex V2 Architecture Overview

## 1. Technology Stack
- **Frontend**: Next.js (App Router), Tailwind CSS.
- **Backend**: Supabase (PostgreSQL, Auth, Storage).
- **Messaging**: Evolution API + WA-API (Rust Gateway).
- **Communication Protocol**: WhatsApp-first notifications and OTPs.

## 2. Schema Architecture
The database is partitioned into domain-specific schemas to ensure isolation:
- `crm`: Customer lifecycle and bookings.
- `ops`: Daily business operations (Staff, Catalogue).
- `orgs`: Multi-tenancy and branch hierarchy.
- `platform`: Global SaaS management and audit logs.
- `iam`: Module-based access control.

## 3. The Partner Hierarchy
- **Organization**: The top-level legal entity.
- **Branch**: A physical location under an organization.
- **Staff**: Employees assigned to specific branches.

## 4. Key Security Mechanisms
- **Handshake OTPs**: 6-digit codes for verifying service start and completion.
- **Identity Bridge**: Fuzzy matching to unify customer profiles across the platform.
- **MBAC**: Granular permissions (Bookings, CRM, Ops, Billing, Platform).

## 5. Deployment
- **API/Frontend**: Vercel or Railway.
- **Database**: Supabase.
- **Messaging Gateway**: Railway (Running Rust and Node services).
