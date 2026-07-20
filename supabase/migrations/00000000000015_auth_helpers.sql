-- Reusable auth/scope helpers used by every RLS policy below. Each is
-- SECURITY DEFINER + a pinned search_path so it (a) reads `profiles`
-- bypassing that table's own RLS, avoiding infinite recursion, and (b)
-- can't be tricked via search_path hijacking. All are STABLE so Postgres
-- can cache the result within a single statement.

create or replace function public.auth_profile()
returns public.profiles
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select * from public.profiles where id = auth.uid();
$$;

create or replace function public.auth_role()
returns public.user_role
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.auth_employee_id()
returns uuid
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select employee_id from public.profiles where id = auth.uid();
$$;

create or replace function public.auth_organization_id()
returns uuid
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select organization_id from public.profiles where id = auth.uid();
$$;

-- §11.1 (approved): direct reports only, one level — not recursive.
create or replace function public.is_manager_of(target_employee_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.employees e
    where e.id = target_employee_id
      and e.manager_id = public.auth_employee_id()
  );
$$;

revoke execute on function public.auth_profile() from public;
revoke execute on function public.auth_role() from public;
revoke execute on function public.auth_employee_id() from public;
revoke execute on function public.auth_organization_id() from public;
revoke execute on function public.is_manager_of(uuid) from public;

grant execute on function public.auth_profile() to authenticated;
grant execute on function public.auth_role() to authenticated;
grant execute on function public.auth_employee_id() to authenticated;
grant execute on function public.auth_organization_id() to authenticated;
grant execute on function public.is_manager_of(uuid) to authenticated;
