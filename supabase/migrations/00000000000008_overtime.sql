-- Overuren: worked_hours/contract_hours are snapshotted per period (rather
-- than recomputed live from schedule_days on every read) so that approved/
-- processed entries stay stable even if the underlying rooster is corrected
-- later — any such correction should create a new entry, not mutate history.

create table public.overtime_entries (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id),
  period_start date not null,
  period_end date not null,
  worked_hours numeric(6, 2) not null,
  contract_hours numeric(6, 2) not null,
  overtime_hours numeric(6, 2) generated always as (worked_hours - contract_hours) stored,
  status public.overtime_status not null default 'geregistreerd',
  payout_percentage smallint check (payout_percentage in (100, 125, 150, 200)),
  approved_by uuid references public.profiles (id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (period_end >= period_start)
);

create index overtime_entries_employee_id_idx on public.overtime_entries (employee_id);
create index overtime_entries_status_idx on public.overtime_entries (status);

create trigger set_updated_at
  before update on public.overtime_entries
  for each row execute function public.set_updated_at();
