-- Roosters: configurable break rules + historical schedule periods/days.
-- The contract rooster itself is just contracts.hours_per_week (§5.4) —
-- schedule_periods/schedule_days record the actual, dated rooster history.

create table public.break_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  min_hours numeric(4, 2) not null check (min_hours > 0),
  deduction_minutes int not null check (deduction_minutes >= 0),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index break_rules_organization_id_idx on public.break_rules (organization_id);

create trigger set_updated_at
  before update on public.break_rules
  for each row execute function public.set_updated_at();

-- A period with end_date = null is the employee's current rooster.
create table public.schedule_periods (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id),
  start_date date not null,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or end_date >= start_date)
);

create index schedule_periods_employee_id_idx on public.schedule_periods (employee_id);
create unique index schedule_periods_current_idx
  on public.schedule_periods (employee_id)
  where end_date is null;

create trigger set_updated_at
  before update on public.schedule_periods
  for each row execute function public.set_updated_at();

create table public.schedule_days (
  id uuid primary key default gen_random_uuid(),
  schedule_period_id uuid not null references public.schedule_periods (id),
  weekday int not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  -- Raw worked hours before break deduction. Break rules are applied in the
  -- application layer (lib/services/overtime) when rolling this up into
  -- overtime_entries, since the applicable rule depends on org_settings /
  -- break_rules that can change independently of a schedule day.
  computed_hours numeric(4, 2) generated always as (
    round(extract(epoch from (end_time - start_time)) / 3600.0, 2)
  ) stored,
  created_at timestamptz not null default now(),
  check (end_time > start_time),
  unique (schedule_period_id, weekday)
);

create index schedule_days_schedule_period_id_idx on public.schedule_days (schedule_period_id);
