-- Bugfix (Fase 2): the dossier page embeds the manager's name via a
-- foreign-key join (employees.manager_id -> employees.id). Without a
-- policy granting that read, PostgREST's embed silently drops the *entire*
-- parent row for any role that can't also read the manager's row (e.g. an
-- employee reading their own record) — RLS's job is still just to say who
-- may see the manager's name, not to change how the join behaves.

create or replace function public.is_own_manager(target_employee_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.employees e
    where e.id = public.auth_employee_id()
      and e.manager_id = target_employee_id
  );
$$;

revoke execute on function public.is_own_manager(uuid) from public;
grant execute on function public.is_own_manager(uuid) to authenticated;

create policy "select own manager" on public.employees
  for select to authenticated
  using (public.is_own_manager(id));
