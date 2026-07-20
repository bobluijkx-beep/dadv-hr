-- Declaraties: schema for the future medewerkers-app, built now so that app
-- can ship against the existing Supabase project without a migration.

create table public.expense_claims (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id),
  amount numeric(8, 2) not null check (amount > 0),
  description text not null,
  receipt_storage_path text, -- bucket `receipts`, uploaded via future app
  status public.expense_status not null default 'ingediend',
  payment_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index expense_claims_employee_id_idx on public.expense_claims (employee_id);
create index expense_claims_status_idx on public.expense_claims (status);

create trigger set_updated_at
  before update on public.expense_claims
  for each row execute function public.set_updated_at();
