-- Verlofbeheer. leave_transactions is the ledger / source of truth;
-- leave_balances is a materialized per-year rollup kept in sync by
-- lib/services/leave (and the leave-year-rollover Edge Function) so
-- dashboards don't have to sum the ledger on every read.

create table public.leave_types (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  name text not null,
  is_statutory boolean not null default false,
  -- Multiplier applied to contracts.hours_per_week to get the yearly accrual,
  -- e.g. 4 for wettelijk verlof, 1 for bovenwettelijk verlof. Configurable so
  -- a future CAO can introduce different factors without a schema change.
  accrual_factor numeric(4, 2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, name)
);

create trigger set_updated_at
  before update on public.leave_types
  for each row execute function public.set_updated_at();

create table public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id),
  leave_type_id uuid not null references public.leave_types (id),
  start_date date not null,
  end_date date not null,
  hours numeric(6, 2) not null check (hours > 0),
  status public.leave_request_status not null default 'aangevraagd',
  approver_id uuid references public.profiles (id),
  requested_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create index leave_requests_employee_id_idx on public.leave_requests (employee_id);
create index leave_requests_status_idx on public.leave_requests (status);

create trigger set_updated_at
  before update on public.leave_requests
  for each row execute function public.set_updated_at();

create table public.leave_transactions (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id),
  leave_type_id uuid not null references public.leave_types (id),
  transaction_date date not null default current_date,
  hours numeric(6, 2) not null, -- positive = accrual/correction, negative = taken
  transaction_type public.leave_transaction_type not null,
  leave_request_id uuid references public.leave_requests (id),
  created_at timestamptz not null default now()
);

create index leave_transactions_employee_id_idx on public.leave_transactions (employee_id);
create index leave_transactions_leave_type_id_idx on public.leave_transactions (leave_type_id);

create table public.leave_balances (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id),
  leave_type_id uuid not null references public.leave_types (id),
  year int not null,
  accrued_hours numeric(6, 2) not null default 0,
  taken_hours numeric(6, 2) not null default 0,
  remaining_hours numeric(6, 2) generated always as (accrued_hours - taken_hours) stored,
  updated_at timestamptz not null default now(),
  unique (employee_id, leave_type_id, year)
);

create index leave_balances_employee_id_idx on public.leave_balances (employee_id);

create trigger set_updated_at
  before update on public.leave_balances
  for each row execute function public.set_updated_at();
