-- Documentbeheer: metadata lives in Postgres, file bytes live in the
-- `documents` Supabase Storage bucket (see supabase/config.toml). Every
-- upload creates a new document_versions row so history is never lost.

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id),
  category public.document_category not null,
  current_version_id uuid, -- FK added below once document_versions exists
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index documents_employee_id_idx on public.documents (employee_id);
create index documents_category_idx on public.documents (category);

create trigger set_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();

create table public.document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id),
  version_number int not null,
  storage_path text not null,
  file_name text not null,
  uploaded_by uuid references public.profiles (id),
  uploaded_at timestamptz not null default now(),
  unique (document_id, version_number)
);

create index document_versions_document_id_idx on public.document_versions (document_id);

alter table public.documents
  add constraint documents_current_version_id_fkey
  foreign key (current_version_id) references public.document_versions (id);
