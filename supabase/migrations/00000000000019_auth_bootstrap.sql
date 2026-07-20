-- Auto-creates a profiles row whenever a new auth.users row appears.
--
-- Accounts are never self-registered (config.toml sets enable_signup =
-- false) — HR/admin invites a user via the Supabase Admin API
-- (supabase.auth.admin.inviteUserByEmail) and passes organization_id,
-- role and employee_id in user_metadata, which this trigger reads.
--
-- MVP simplification tied to §11.5 (confirmed): if organization_id is
-- omitted from the invite metadata, fall back to the single existing
-- organization row, since multi-org is future-proofing only for now.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_organization_id uuid;
  v_role public.user_role;
  v_employee_id uuid;
begin
  v_organization_id := (new.raw_user_meta_data ->> 'organization_id')::uuid;
  if v_organization_id is null then
    select id into v_organization_id from public.organizations limit 1;
  end if;

  v_role := coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'employee');
  v_employee_id := (new.raw_user_meta_data ->> 'employee_id')::uuid;

  insert into public.profiles (id, organization_id, employee_id, role)
  values (new.id, v_organization_id, v_employee_id, v_role);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
