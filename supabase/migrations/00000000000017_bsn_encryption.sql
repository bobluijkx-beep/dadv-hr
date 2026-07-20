-- BSN encryption (§7.2, §11.3 approved): pgcrypto symmetric encryption with
-- the key held in Supabase Vault, never in a table column or client-visible
-- setting. Only encrypt_bsn/decrypt_bsn touch the key, both SECURITY
-- DEFINER and both gated on auth_role() so no policy mistake elsewhere can
-- expose a BSN — the gate lives in the function, not just in RLS.
--
-- One-time setup after this migration runs (dashboard or CLI, not SQL,
-- since it's a secret): create the vault secret named 'bsn_encryption_key'.
--   select vault.create_secret('<a long random value>', 'bsn_encryption_key');
-- See docs/deployment.md for the production procedure.

create or replace function public.get_bsn_encryption_key()
returns text
language plpgsql
security definer
stable
set search_path = public, vault, pg_temp
as $$
declare
  key_value text;
begin
  select decrypted_secret into key_value
  from vault.decrypted_secrets
  where name = 'bsn_encryption_key'
  limit 1;

  if key_value is null then
    raise exception 'bsn_encryption_key secret is not configured in Supabase Vault';
  end if;

  return key_value;
end;
$$;

-- Intentionally not granted to anyone — only called from within
-- encrypt_bsn/decrypt_bsn below, which run as the same definer.
revoke execute on function public.get_bsn_encryption_key() from public, authenticated;

create or replace function public.encrypt_bsn(bsn text)
returns bytea
language plpgsql
security definer
stable
set search_path = public, extensions, pg_temp
as $$
begin
  if public.auth_role() not in ('admin', 'hr') then
    raise exception 'insufficient privileges to encrypt a BSN';
  end if;

  return extensions.pgp_sym_encrypt(bsn, public.get_bsn_encryption_key());
end;
$$;

create or replace function public.decrypt_bsn(bsn_encrypted bytea)
returns text
language plpgsql
security definer
stable
set search_path = public, extensions, pg_temp
as $$
begin
  if bsn_encrypted is null then
    return null;
  end if;

  if public.auth_role() not in ('admin', 'hr') then
    raise exception 'insufficient privileges to decrypt a BSN';
  end if;

  return extensions.pgp_sym_decrypt(bsn_encrypted, public.get_bsn_encryption_key());
end;
$$;

revoke execute on function public.encrypt_bsn(text) from public;
revoke execute on function public.decrypt_bsn(bytea) from public;
grant execute on function public.encrypt_bsn(text) to authenticated;
grant execute on function public.decrypt_bsn(bytea) to authenticated;

-- Convenience wrapper used by the HR/admin "edit employee" Server Action so
-- application code never needs to know the encryption function names or
-- touch bsn_encrypted directly.
create or replace function public.set_employee_bsn(p_employee_id uuid, p_bsn text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if public.auth_role() not in ('admin', 'hr') then
    raise exception 'insufficient privileges to set a BSN';
  end if;

  update public.employees
  set bsn_encrypted = public.encrypt_bsn(p_bsn)
  where id = p_employee_id;
end;
$$;

revoke execute on function public.set_employee_bsn(uuid, text) from public;
grant execute on function public.set_employee_bsn(uuid, text) to authenticated;
