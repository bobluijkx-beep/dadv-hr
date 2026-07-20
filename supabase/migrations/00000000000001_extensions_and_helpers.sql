-- Fase 1: extensions and generic helpers shared by every later migration.

create extension if not exists "pgcrypto" with schema extensions;
create extension if not exists "pg_trgm" with schema extensions;

-- Generic updated_at maintenance, reused by every table below.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Generic trigger: stamps updated_at = now() on every UPDATE. Attached per-table in each migration.';
