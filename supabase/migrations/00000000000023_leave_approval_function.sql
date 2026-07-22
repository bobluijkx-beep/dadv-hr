-- Approving a leave request must also write a leave_transactions "opname"
-- entry and roll it into leave_balances.taken_hours — but §Verlof's RLS
-- deliberately restricts direct leave_transactions/leave_balances writes to
-- admin/hr only ("ledger integrity"), while the approved rechtenmatrix gives
-- a manager R/U-goedkeuring on their own team's leave_requests. A manager
-- therefore can't do the ledger write directly; this SECURITY DEFINER
-- function is the one sanctioned bridge, re-checking authorization itself
-- rather than trusting the caller already passed an RLS check on a
-- different table.

create or replace function public.approve_leave_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_request public.leave_requests%rowtype;
  v_year int;
begin
  select * into v_request from public.leave_requests where id = p_request_id for update;

  if not found then
    raise exception 'Verlofaanvraag niet gevonden';
  end if;

  if v_request.status <> 'aangevraagd' then
    raise exception 'Alleen aangevraagde verlofaanvragen kunnen worden goedgekeurd';
  end if;

  if not (
    public.auth_role() in ('admin', 'hr')
    or (public.auth_role() = 'manager' and public.is_manager_of(v_request.employee_id))
  ) then
    raise exception 'Onvoldoende rechten om deze verlofaanvraag goed te keuren';
  end if;

  update public.leave_requests
  set status = 'goedgekeurd', approver_id = auth.uid()
  where id = p_request_id;

  insert into public.leave_transactions (employee_id, leave_type_id, transaction_date, hours, transaction_type, leave_request_id)
  values (v_request.employee_id, v_request.leave_type_id, current_date, -v_request.hours, 'opname', p_request_id);

  v_year := extract(year from v_request.start_date);

  insert into public.leave_balances (employee_id, leave_type_id, year, accrued_hours, taken_hours)
  values (v_request.employee_id, v_request.leave_type_id, v_year, 0, v_request.hours)
  on conflict (employee_id, leave_type_id, year)
  do update set taken_hours = public.leave_balances.taken_hours + v_request.hours, updated_at = now();
end;
$$;

grant execute on function public.approve_leave_request(uuid) to authenticated;
