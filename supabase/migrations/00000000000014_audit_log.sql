-- Generic audit log for every module. Filled exclusively by triggers (see
-- 00000000000017_audit_triggers.sql) — never written to from application
-- code, so it can't be bypassed by a buggy or malicious server action.

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id),
  table_name text not null,
  record_id uuid not null,
  action public.audit_action not null,
  old_data jsonb,
  new_data jsonb,
  changed_by uuid references public.profiles (id),
  module text not null,
  changed_at timestamptz not null default now()
);

create index audit_log_table_record_idx on public.audit_log (table_name, record_id);
create index audit_log_organization_id_idx on public.audit_log (organization_id);
create index audit_log_changed_at_idx on public.audit_log (changed_at desc);
