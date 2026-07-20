-- Generic audit trigger (§7.3): attached to every table the approved design
-- calls out as requiring a full change history. SECURITY DEFINER so it can
-- write to audit_log even though no role has a direct INSERT policy there —
-- the trigger is the only path in.
--
-- Note: bsn_encrypted is still bytea/ciphertext inside to_jsonb(NEW/OLD), so
-- audit rows never leak a plaintext BSN even for the employees table.

create or replace function public.audit_log_trigger()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_action public.audit_action;
  v_record_id uuid;
  v_module text;
  v_new_data jsonb;
  v_old_data jsonb;
begin
  v_new_data := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end;
  v_old_data := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end;

  -- Extracted via jsonb rather than `new.id` directly: most tables use `id`
  -- as their primary key, but contract_compensation's PK is `contract_id`.
  -- ->> on a missing key returns null instead of erroring, so this works
  -- for both shapes without a table-by-table special case.
  v_record_id := coalesce(
    (v_new_data ->> 'id')::uuid,
    (v_old_data ->> 'id')::uuid,
    (v_new_data ->> 'contract_id')::uuid,
    (v_old_data ->> 'contract_id')::uuid
  );

  if tg_op = 'INSERT' then
    v_action := 'insert';
  elsif tg_op = 'UPDATE' then
    v_action := 'update';
  else
    v_action := 'delete';
  end if;

  v_module := case tg_table_name
    when 'employees' then 'personeelsgegevens'
    when 'employee_addresses' then 'personeelsgegevens'
    when 'employee_contact_details' then 'personeelsgegevens'
    when 'contracts' then 'contract'
    when 'contract_compensation' then 'salaris'
    when 'salary_history' then 'salaris'
    when 'leave_requests' then 'verlof'
    when 'leave_transactions' then 'verlof'
    when 'absence_records' then 'verzuim'
    when 'overtime_entries' then 'overuren'
    else tg_table_name
  end;

  insert into public.audit_log (
    organization_id, table_name, record_id, action, old_data, new_data, changed_by, module
  )
  values (
    public.auth_organization_id(),
    tg_table_name,
    v_record_id,
    v_action,
    v_old_data,
    v_new_data,
    auth.uid(),
    v_module
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger audit_log
  after insert or update or delete on public.employees
  for each row execute function public.audit_log_trigger();

create trigger audit_log
  after insert or update or delete on public.employee_addresses
  for each row execute function public.audit_log_trigger();

create trigger audit_log
  after insert or update or delete on public.employee_contact_details
  for each row execute function public.audit_log_trigger();

create trigger audit_log
  after insert or update or delete on public.contracts
  for each row execute function public.audit_log_trigger();

create trigger audit_log
  after insert or update or delete on public.contract_compensation
  for each row execute function public.audit_log_trigger();

create trigger audit_log
  after insert or update or delete on public.salary_history
  for each row execute function public.audit_log_trigger();

create trigger audit_log
  after insert or update or delete on public.leave_requests
  for each row execute function public.audit_log_trigger();

create trigger audit_log
  after insert or update or delete on public.leave_transactions
  for each row execute function public.audit_log_trigger();

create trigger audit_log
  after insert or update or delete on public.absence_records
  for each row execute function public.audit_log_trigger();

create trigger audit_log
  after insert or update or delete on public.overtime_entries
  for each row execute function public.audit_log_trigger();
