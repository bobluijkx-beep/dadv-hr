-- Verzuim. Kept deliberately flat for the MVP (no Poortwachter timeline yet)
-- per §5.9 of docs/functioneel-ontwerp.md — a dedicated absence_timeline
-- table can be added later without touching this one.

create table public.absence_records (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id),
  first_sick_day date not null,
  is_full_time_absence boolean not null default true,
  incapacity_percentage numeric(5, 2) check (incapacity_percentage between 0 and 100),
  recovery_date date,
  status public.absence_status not null default 'actief',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (recovery_date is null or recovery_date >= first_sick_day)
);

create index absence_records_employee_id_idx on public.absence_records (employee_id);
create index absence_records_status_idx on public.absence_records (status);

create trigger set_updated_at
  before update on public.absence_records
  for each row execute function public.set_updated_at();

-- §11.2 (approved): managers may only see status + period, never the
-- percentage or notes. The `absence_status_view` that enforces this is
-- defined in 00000000000015_rls_policies.sql, once the auth_role() /
-- is_manager_of() helper functions it depends on exist.
