-- Personeelsdossier: core employee record plus history tables for the
-- fields that must retain their own timeline (address, contact details).
-- Other field changes on `employees` are captured by the generic audit_log
-- (see 00000000000015_audit_log.sql) rather than a bespoke history table.

create table public.employees (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  employee_number text not null,
  first_name text not null,
  insertion text,
  last_name text not null,
  preferred_name text,
  gender public.gender_type not null default 'onbekend',
  date_of_birth date,
  bsn_encrypted bytea, -- see 00000000000016_bsn_encryption.sql, never queried directly
  iban text,
  department_id uuid references public.departments (id),
  manager_id uuid references public.employees (id),
  job_title text,
  employment_start_date date,
  employment_end_date date,
  is_active boolean not null default true,
  user_id uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, employee_number)
);

create index employees_organization_id_idx on public.employees (organization_id);
create index employees_department_id_idx on public.employees (department_id);
create index employees_manager_id_idx on public.employees (manager_id);
create index employees_user_id_idx on public.employees (user_id);

create trigger set_updated_at
  before update on public.employees
  for each row execute function public.set_updated_at();

-- Now that employees exists, complete the profiles -> employees link.
alter table public.profiles
  add constraint profiles_employee_id_fkey
  foreign key (employee_id) references public.employees (id);

create table public.employee_addresses (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id),
  street text not null,
  postal_code text not null,
  city text not null,
  valid_from date not null default current_date,
  valid_to date,
  created_at timestamptz not null default now(),
  check (valid_to is null or valid_to >= valid_from)
);

create index employee_addresses_employee_id_idx on public.employee_addresses (employee_id);
-- Only one "current" address (valid_to is null) per employee at a time.
create unique index employee_addresses_current_idx
  on public.employee_addresses (employee_id)
  where valid_to is null;

create table public.employee_contact_details (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id),
  phone text,
  email text,
  emergency_contact_name text,
  emergency_contact_phone text,
  valid_from date not null default current_date,
  valid_to date,
  created_at timestamptz not null default now(),
  check (valid_to is null or valid_to >= valid_from)
);

create index employee_contact_details_employee_id_idx on public.employee_contact_details (employee_id);
create unique index employee_contact_details_current_idx
  on public.employee_contact_details (employee_id)
  where valid_to is null;

create table public.employee_private_details (
  employee_id uuid primary key references public.employees (id),
  partner_name text,
  partner_date_of_birth date,
  hobbies text,
  interests text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.employee_private_details
  for each row execute function public.set_updated_at();

create table public.employee_children (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id),
  name text not null,
  date_of_birth date,
  created_at timestamptz not null default now()
);

create index employee_children_employee_id_idx on public.employee_children (employee_id);
