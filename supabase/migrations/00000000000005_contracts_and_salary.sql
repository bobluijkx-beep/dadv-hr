-- Contractbeheer + Salarisbeheer.
--
-- Design note: contract_compensation is a deliberate 1:1 split off of
-- contracts, so RLS can hide salary from a manager while still letting them
-- read contract hours/dates for scheduling and overtime (see §5.4 / §8 of
-- docs/functioneel-ontwerp.md).

create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id),
  contract_number text not null,
  start_date date not null,
  end_date date,
  contract_type public.contract_type not null,
  hours_per_week numeric(5, 2) not null check (hours_per_week > 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (end_date is null or end_date >= start_date)
);

create index contracts_employee_id_idx on public.contracts (employee_id);

create trigger set_updated_at
  before update on public.contracts
  for each row execute function public.set_updated_at();

create table public.contract_compensation (
  contract_id uuid primary key references public.contracts (id),
  salary_amount numeric(10, 2) not null check (salary_amount >= 0),
  salary_scale text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.contract_compensation
  for each row execute function public.set_updated_at();

create table public.salary_history (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id),
  change_date date not null default current_date,
  old_salary numeric(10, 2),
  new_salary numeric(10, 2) not null,
  absolute_difference numeric(10, 2) generated always as (new_salary - coalesce(old_salary, 0)) stored,
  percentage_increase numeric(6, 2) generated always as (
    case
      when old_salary is null or old_salary = 0 then null
      else round(((new_salary - old_salary) / old_salary) * 100, 2)
    end
  ) stored,
  reason text,
  changed_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create index salary_history_employee_id_idx on public.salary_history (employee_id);
