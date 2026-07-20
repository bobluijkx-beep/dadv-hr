-- Organizations, departments, org-level settings, and the profiles table
-- that links auth.users to a role and (for non-admin accounts) an employee.
--
-- Design note: everything hangs off organizations even though the MVP only
-- ever has one row here. This is deliberate future-proofing for multi-tenant
-- SaaS use (see docs/functioneel-ontwerp.md §11.5) — no multi-org UI exists
-- or is required in the MVP.

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kvk_number text,
  address text,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger set_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  name text not null,
  parent_department_id uuid references public.departments (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index departments_organization_id_idx on public.departments (organization_id);

create trigger set_updated_at
  before update on public.departments
  for each row execute function public.set_updated_at();

-- Generic, per-organization configurable rules: break rules, leave accrual
-- factors, overtime payout percentages, and a placeholder for future CAO
-- rules. Category/key/value keeps this schema-stable as rules evolve.
create table public.org_settings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  category text not null,
  key text not null,
  value jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, category, key)
);

create trigger set_updated_at
  before update on public.org_settings
  for each row execute function public.set_updated_at();

-- 1:1 with auth.users. employee_id is null for accounts that aren't tied to
-- an employee record (e.g. a future system/service account).
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  organization_id uuid not null references public.organizations (id),
  employee_id uuid, -- FK added in 00000000000004_employees.sql once that table exists
  role public.user_role not null default 'employee',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_organization_id_idx on public.profiles (organization_id);
create index profiles_employee_id_idx on public.profiles (employee_id);

create trigger set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
