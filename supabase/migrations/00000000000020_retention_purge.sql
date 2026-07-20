-- Retention / auto-purge foundation (§11.4, approved: automate this,
-- rather than soft-delete-forever). This migration only lays the
-- groundwork — a configurable retention period per table and a function
-- that hard-deletes rows that were soft-deleted longer ago than that
-- period. Actually *scheduling* this (pg_cron / Edge Function) is left to
-- a later phase, once statutory retention periods per data category (e.g.
-- the 7-year fiscal retention for salary/BSN-adjacent records) are signed
-- off — running this prematurely on the wrong table would be irreversible.

insert into public.org_settings (organization_id, category, key, value)
select id, 'retention', 'default_purge_after_days', '2555' -- ~7 years
from public.organizations
on conflict (organization_id, category, key) do nothing;

create or replace function public.purge_soft_deleted(p_table_name text)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_retention_days int;
  v_deleted_count int;
begin
  if public.auth_role() <> 'admin' then
    raise exception 'insufficient privileges to purge data';
  end if;

  if p_table_name not in ('organizations', 'departments', 'employees', 'contracts', 'documents') then
    raise exception 'purge_soft_deleted is not enabled for table %', p_table_name;
  end if;

  select coalesce((value #>> '{}')::int, 2555) into v_retention_days
  from public.org_settings
  where organization_id = public.auth_organization_id()
    and category = 'retention'
    and key = 'default_purge_after_days';

  execute format(
    'delete from public.%I where deleted_at is not null and deleted_at < now() - make_interval(days => %L)',
    p_table_name,
    v_retention_days
  );

  get diagnostics v_deleted_count = row_count;
  return v_deleted_count;
end;
$$;

revoke execute on function public.purge_soft_deleted(text) from public;
grant execute on function public.purge_soft_deleted(text) to authenticated;

comment on function public.purge_soft_deleted(text) is
  'Hard-deletes soft-deleted rows past the org retention period. Callable by admin only. Not yet scheduled automatically — see docs/functioneel-ontwerp.md §11.4.';
