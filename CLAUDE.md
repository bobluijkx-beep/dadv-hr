@AGENTS.md

# HR Portal

Dutch HR Portal MVP — Next.js (App Router) + TypeScript + Tailwind + shadcn/ui + Supabase (Postgres, Auth, Storage, Edge Functions, RLS). Deploys to Vercel + Supabase + GitHub. Notifications via Resend.

## Design-first workflow

The full functional design, ERD, database/Supabase schema, security model, RLS design, API architecture, and phased roadmap live in [docs/functioneel-ontwerp.md](docs/functioneel-ontwerp.md) — approved before any code was written. Read it before making schema or RLS changes; it is the source of truth for *why* the model looks the way it does (e.g. why `contract_compensation` is split from `contracts`, why managers only see verzuim through a view).

Roadmap phases (each ships code + tests + migrations + deployment notes + a commit proposal): 1) architecture/database/Auth, 2) personeelsdossiers, 3) contractbeheer, 4) documentbeheer, 5) roosters, 6) overuren, 7) verlof, 8) verzuim, 9) dashboards, 10) Resend, 11) AFAS-voorbereiding. Don't pull work forward from a later phase without checking with the user first.

## Structure

- `app/` — Next.js App Router routes and layouts.
- `app/actions/` — Server Actions (all sensitive mutations go through here, never a client-side Supabase write).
- `lib/supabase/` — client factories: `server.ts` (RLS-scoped, Server Components/Actions), `client.ts` (browser, read-only non-sensitive data), `middleware.ts` (session refresh), `admin.ts` (service-role, narrowly scoped, server-only).
- `lib/auth/` — role/scope helpers mirroring the Postgres RLS helper functions; UX gating only, never the actual security boundary.
- `lib/services/` — domain logic (leave accrual, overtime calculation, payroll export prep, notifications).
- `lib/integrations/afas/` — Fase 11 stubs, not implemented yet.
- `supabase/migrations/` — SQL migrations, applied in filename order.
- `supabase/tests/database/` — pgTAP RLS/schema regression tests (`supabase test db`).
- `supabase/seed.sql` — local dev fixtures (admin/hr/manager/employee users, password `password123`).

## Security invariants

- RLS is the only real access boundary. Server Actions and `lib/auth` checks are UX convenience, not security controls — never remove or weaken a policy to make application code simpler.
- BSN is never read/written directly (`employees.bsn_encrypted`); always go through `set_employee_bsn()` / `decrypt_bsn()`, which are gated to admin/hr.
- `contract_compensation` and `salary_history` grant nothing to `manager` or `employee` roles. Don't add a join that leaks salary into a manager-facing query.
- `absence_records` grants nothing to `manager`; use `absence_status_view` (status/dates only) for anything manager-facing.
