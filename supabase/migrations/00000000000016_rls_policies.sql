-- Row Level Security for every table, per docs/functioneel-ontwerp.md §8.
--
-- Table-level grants (SELECT/INSERT/UPDATE/DELETE to `authenticated`) are
-- inherited from Supabase's project-level `ALTER DEFAULT PRIVILEGES` setup
-- and intentionally not repeated here — RLS is the actual access boundary.
--
-- Design notes carried over from the approved design:
--  - `employees` has no employee-role UPDATE policy: contact-detail edits go
--    through `employee_contact_details` (a new dated row), not a direct
--    column-level patch on `employees` — Postgres RLS can't restrict access
--    to a subset of columns on the same table, so this is done at the table
--    boundary instead.
--  - `contract_compensation` / `salary_history` grant nothing to manager or
--    employee, by design (§11.3 confirms no salary visibility for managers).
--  - `absence_records` grants nothing directly to manager; managers instead
--    read `absence_status_view` (§11.2, approved), which exposes status and
--    dates only.
--  - Overtime/leave *workflow* validity (e.g. "a manager may only set status
--    to goedgekeurd, never uitbetaald") is enforced in the Server Action
--    layer (lib/services/*), not in RLS — RLS's job here is row/column
--    scoping, not business-process validation.

-- ---------------------------------------------------------------------
-- organizations / departments / org_settings
-- ---------------------------------------------------------------------

alter table public.organizations enable row level security;

create policy "select own organization" on public.organizations
  for select to authenticated
  using (id = public.auth_organization_id());

create policy "admin manages organization" on public.organizations
  for update to authenticated
  using (public.auth_role() = 'admin' and id = public.auth_organization_id())
  with check (public.auth_role() = 'admin' and id = public.auth_organization_id());

alter table public.departments enable row level security;

create policy "select departments in own org" on public.departments
  for select to authenticated
  using (organization_id = public.auth_organization_id());

create policy "admin/hr manage departments" on public.departments
  for all to authenticated
  using (public.auth_role() in ('admin', 'hr') and organization_id = public.auth_organization_id())
  with check (public.auth_role() in ('admin', 'hr') and organization_id = public.auth_organization_id());

alter table public.org_settings enable row level security;

create policy "select org_settings in own org" on public.org_settings
  for select to authenticated
  using (organization_id = public.auth_organization_id());

create policy "admin manages org_settings" on public.org_settings
  for all to authenticated
  using (public.auth_role() = 'admin' and organization_id = public.auth_organization_id())
  with check (public.auth_role() = 'admin' and organization_id = public.auth_organization_id());

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------

alter table public.profiles enable row level security;

create policy "select own profile" on public.profiles
  for select to authenticated
  using (id = auth.uid());

create policy "admin/hr select profiles in org" on public.profiles
  for select to authenticated
  using (public.auth_role() in ('admin', 'hr') and organization_id = public.auth_organization_id());

create policy "admin manages profiles in org" on public.profiles
  for all to authenticated
  using (public.auth_role() = 'admin' and organization_id = public.auth_organization_id())
  with check (public.auth_role() = 'admin' and organization_id = public.auth_organization_id());

-- ---------------------------------------------------------------------
-- employees
-- ---------------------------------------------------------------------

alter table public.employees enable row level security;

create policy "admin/hr manage employees" on public.employees
  for all to authenticated
  using (public.auth_role() in ('admin', 'hr') and organization_id = public.auth_organization_id())
  with check (public.auth_role() in ('admin', 'hr') and organization_id = public.auth_organization_id());

create policy "manager selects direct reports" on public.employees
  for select to authenticated
  using (public.auth_role() = 'manager' and public.is_manager_of(id));

create policy "employee selects self" on public.employees
  for select to authenticated
  using (id = public.auth_employee_id());

-- ---------------------------------------------------------------------
-- employee_addresses / employee_contact_details
-- (core dossier fields — visible to manager for direct reports, unlike
-- the private-details bucket below)
-- ---------------------------------------------------------------------

alter table public.employee_addresses enable row level security;
alter table public.employee_contact_details enable row level security;

create policy "admin/hr manage addresses" on public.employee_addresses
  for all to authenticated
  using (public.auth_role() in ('admin', 'hr'))
  with check (public.auth_role() in ('admin', 'hr'));

create policy "manager selects team addresses" on public.employee_addresses
  for select to authenticated
  using (public.auth_role() = 'manager' and public.is_manager_of(employee_id));

create policy "employee manages own addresses" on public.employee_addresses
  for all to authenticated
  using (employee_id = public.auth_employee_id())
  with check (employee_id = public.auth_employee_id());

create policy "admin/hr manage contact details" on public.employee_contact_details
  for all to authenticated
  using (public.auth_role() in ('admin', 'hr'))
  with check (public.auth_role() in ('admin', 'hr'));

create policy "manager selects team contact details" on public.employee_contact_details
  for select to authenticated
  using (public.auth_role() = 'manager' and public.is_manager_of(employee_id));

create policy "employee manages own contact details" on public.employee_contact_details
  for all to authenticated
  using (employee_id = public.auth_employee_id())
  with check (employee_id = public.auth_employee_id());

-- ---------------------------------------------------------------------
-- employee_private_details / employee_children
-- (never visible to manager — explicit design decision)
-- ---------------------------------------------------------------------

alter table public.employee_private_details enable row level security;
alter table public.employee_children enable row level security;

create policy "admin/hr manage private details" on public.employee_private_details
  for all to authenticated
  using (public.auth_role() in ('admin', 'hr'))
  with check (public.auth_role() in ('admin', 'hr'));

create policy "employee manages own private details" on public.employee_private_details
  for all to authenticated
  using (employee_id = public.auth_employee_id())
  with check (employee_id = public.auth_employee_id());

create policy "admin/hr manage children" on public.employee_children
  for all to authenticated
  using (public.auth_role() in ('admin', 'hr'))
  with check (public.auth_role() in ('admin', 'hr'));

create policy "employee manages own children" on public.employee_children
  for all to authenticated
  using (employee_id = public.auth_employee_id())
  with check (employee_id = public.auth_employee_id());

-- ---------------------------------------------------------------------
-- contracts (basic fields) vs. contract_compensation (salary — locked down)
-- ---------------------------------------------------------------------

alter table public.contracts enable row level security;
alter table public.contract_compensation enable row level security;
alter table public.salary_history enable row level security;

create policy "admin/hr manage contracts" on public.contracts
  for all to authenticated
  using (public.auth_role() in ('admin', 'hr'))
  with check (public.auth_role() in ('admin', 'hr'));

create policy "manager selects team contracts" on public.contracts
  for select to authenticated
  using (public.auth_role() = 'manager' and public.is_manager_of(employee_id));

create policy "employee selects own contracts" on public.contracts
  for select to authenticated
  using (employee_id = public.auth_employee_id());

create policy "admin/hr manage contract compensation" on public.contract_compensation
  for all to authenticated
  using (public.auth_role() in ('admin', 'hr'))
  with check (public.auth_role() in ('admin', 'hr'));

create policy "admin/hr manage salary history" on public.salary_history
  for all to authenticated
  using (public.auth_role() in ('admin', 'hr'))
  with check (public.auth_role() in ('admin', 'hr'));

-- ---------------------------------------------------------------------
-- documents / document_versions
-- (manager may not read verzuimdocument for their team — the only
-- "gevoelige categorie" called out in §8)
-- ---------------------------------------------------------------------

alter table public.documents enable row level security;
alter table public.document_versions enable row level security;

create policy "admin/hr manage documents" on public.documents
  for all to authenticated
  using (public.auth_role() in ('admin', 'hr'))
  with check (public.auth_role() in ('admin', 'hr'));

create policy "manager selects team documents" on public.documents
  for select to authenticated
  using (
    public.auth_role() = 'manager'
    and public.is_manager_of(employee_id)
    and category <> 'verzuimdocument'
  );

create policy "employee manages own documents" on public.documents
  for select to authenticated
  using (employee_id = public.auth_employee_id());

create policy "employee uploads own documents" on public.documents
  for insert to authenticated
  with check (employee_id = public.auth_employee_id());

create policy "admin/hr manage document versions" on public.document_versions
  for all to authenticated
  using (public.auth_role() in ('admin', 'hr'))
  with check (public.auth_role() in ('admin', 'hr'));

create policy "manager selects team document versions" on public.document_versions
  for select to authenticated
  using (
    public.auth_role() = 'manager'
    and exists (
      select 1 from public.documents d
      where d.id = document_versions.document_id
        and public.is_manager_of(d.employee_id)
        and d.category <> 'verzuimdocument'
    )
  );

create policy "employee selects own document versions" on public.document_versions
  for select to authenticated
  using (
    exists (
      select 1 from public.documents d
      where d.id = document_versions.document_id
        and d.employee_id = public.auth_employee_id()
    )
  );

create policy "employee uploads own document versions" on public.document_versions
  for insert to authenticated
  with check (
    exists (
      select 1 from public.documents d
      where d.id = document_versions.document_id
        and d.employee_id = public.auth_employee_id()
    )
  );

-- ---------------------------------------------------------------------
-- break_rules / schedule_periods / schedule_days
-- ---------------------------------------------------------------------

alter table public.break_rules enable row level security;
alter table public.schedule_periods enable row level security;
alter table public.schedule_days enable row level security;

create policy "select break_rules in own org" on public.break_rules
  for select to authenticated
  using (organization_id = public.auth_organization_id());

create policy "admin/hr manage break_rules" on public.break_rules
  for all to authenticated
  using (public.auth_role() in ('admin', 'hr') and organization_id = public.auth_organization_id())
  with check (public.auth_role() in ('admin', 'hr') and organization_id = public.auth_organization_id());

create policy "admin/hr manage schedule_periods" on public.schedule_periods
  for all to authenticated
  using (public.auth_role() in ('admin', 'hr'))
  with check (public.auth_role() in ('admin', 'hr'));

create policy "manager manages team schedule_periods" on public.schedule_periods
  for all to authenticated
  using (public.auth_role() = 'manager' and public.is_manager_of(employee_id))
  with check (public.auth_role() = 'manager' and public.is_manager_of(employee_id));

create policy "employee selects own schedule_periods" on public.schedule_periods
  for select to authenticated
  using (employee_id = public.auth_employee_id());

create policy "admin/hr manage schedule_days" on public.schedule_days
  for all to authenticated
  using (public.auth_role() in ('admin', 'hr'))
  with check (public.auth_role() in ('admin', 'hr'));

create policy "manager manages team schedule_days" on public.schedule_days
  for all to authenticated
  using (
    public.auth_role() = 'manager'
    and exists (
      select 1 from public.schedule_periods sp
      where sp.id = schedule_days.schedule_period_id and public.is_manager_of(sp.employee_id)
    )
  )
  with check (
    public.auth_role() = 'manager'
    and exists (
      select 1 from public.schedule_periods sp
      where sp.id = schedule_days.schedule_period_id and public.is_manager_of(sp.employee_id)
    )
  );

create policy "employee selects own schedule_days" on public.schedule_days
  for select to authenticated
  using (
    exists (
      select 1 from public.schedule_periods sp
      where sp.id = schedule_days.schedule_period_id and sp.employee_id = public.auth_employee_id()
    )
  );

-- ---------------------------------------------------------------------
-- overtime_entries
-- ---------------------------------------------------------------------

alter table public.overtime_entries enable row level security;

create policy "admin/hr manage overtime_entries" on public.overtime_entries
  for all to authenticated
  using (public.auth_role() in ('admin', 'hr'))
  with check (public.auth_role() in ('admin', 'hr'));

create policy "manager selects team overtime_entries" on public.overtime_entries
  for select to authenticated
  using (public.auth_role() = 'manager' and public.is_manager_of(employee_id));

create policy "manager approves team overtime_entries" on public.overtime_entries
  for update to authenticated
  using (public.auth_role() = 'manager' and public.is_manager_of(employee_id))
  with check (public.auth_role() = 'manager' and public.is_manager_of(employee_id));

create policy "employee selects own overtime_entries" on public.overtime_entries
  for select to authenticated
  using (employee_id = public.auth_employee_id());

create policy "employee submits own overtime_entries" on public.overtime_entries
  for insert to authenticated
  with check (employee_id = public.auth_employee_id());

-- ---------------------------------------------------------------------
-- leave_types / leave_requests / leave_balances / leave_transactions
-- ---------------------------------------------------------------------

alter table public.leave_types enable row level security;
alter table public.leave_requests enable row level security;
alter table public.leave_balances enable row level security;
alter table public.leave_transactions enable row level security;

create policy "select leave_types in own org" on public.leave_types
  for select to authenticated
  using (organization_id = public.auth_organization_id());

create policy "admin/hr manage leave_types" on public.leave_types
  for all to authenticated
  using (public.auth_role() in ('admin', 'hr') and organization_id = public.auth_organization_id())
  with check (public.auth_role() in ('admin', 'hr') and organization_id = public.auth_organization_id());

create policy "admin/hr manage leave_requests" on public.leave_requests
  for all to authenticated
  using (public.auth_role() in ('admin', 'hr'))
  with check (public.auth_role() in ('admin', 'hr'));

create policy "manager selects team leave_requests" on public.leave_requests
  for select to authenticated
  using (public.auth_role() = 'manager' and public.is_manager_of(employee_id));

create policy "manager approves team leave_requests" on public.leave_requests
  for update to authenticated
  using (public.auth_role() = 'manager' and public.is_manager_of(employee_id))
  with check (public.auth_role() = 'manager' and public.is_manager_of(employee_id));

create policy "employee selects own leave_requests" on public.leave_requests
  for select to authenticated
  using (employee_id = public.auth_employee_id());

create policy "employee submits own leave_requests" on public.leave_requests
  for insert to authenticated
  with check (employee_id = public.auth_employee_id());

-- Ledger integrity: only admin/hr (via the approval workflow) write
-- leave_transactions directly; everyone else only reads their own scope.
create policy "admin/hr manage leave_transactions" on public.leave_transactions
  for all to authenticated
  using (public.auth_role() in ('admin', 'hr'))
  with check (public.auth_role() in ('admin', 'hr'));

create policy "manager selects team leave_transactions" on public.leave_transactions
  for select to authenticated
  using (public.auth_role() = 'manager' and public.is_manager_of(employee_id));

create policy "employee selects own leave_transactions" on public.leave_transactions
  for select to authenticated
  using (employee_id = public.auth_employee_id());

create policy "admin/hr manage leave_balances" on public.leave_balances
  for all to authenticated
  using (public.auth_role() in ('admin', 'hr'))
  with check (public.auth_role() in ('admin', 'hr'));

create policy "manager selects team leave_balances" on public.leave_balances
  for select to authenticated
  using (public.auth_role() = 'manager' and public.is_manager_of(employee_id));

create policy "employee selects own leave_balances" on public.leave_balances
  for select to authenticated
  using (employee_id = public.auth_employee_id());

-- ---------------------------------------------------------------------
-- absence_records (base table: admin/hr + self only) and the
-- manager-facing status view (§11.2)
-- ---------------------------------------------------------------------

alter table public.absence_records enable row level security;

create policy "admin/hr manage absence_records" on public.absence_records
  for all to authenticated
  using (public.auth_role() in ('admin', 'hr'))
  with check (public.auth_role() in ('admin', 'hr'));

create policy "employee selects own absence_records" on public.absence_records
  for select to authenticated
  using (employee_id = public.auth_employee_id());

-- No manager policy here on purpose: managers only ever see verzuim through
-- absence_status_view below, which strips percentage/notes entirely.
create view public.absence_status_view as
select
  ar.id,
  ar.employee_id,
  ar.first_sick_day,
  ar.is_full_time_absence,
  ar.recovery_date,
  ar.status
from public.absence_records ar
where
  public.auth_role() in ('admin', 'hr')
  or (public.auth_role() = 'manager' and public.is_manager_of(ar.employee_id))
  or ar.employee_id = public.auth_employee_id();

grant select on public.absence_status_view to authenticated;

-- ---------------------------------------------------------------------
-- expense_claims
-- ---------------------------------------------------------------------

alter table public.expense_claims enable row level security;

create policy "admin/hr manage expense_claims" on public.expense_claims
  for all to authenticated
  using (public.auth_role() in ('admin', 'hr'))
  with check (public.auth_role() in ('admin', 'hr'));

create policy "manager selects team expense_claims" on public.expense_claims
  for select to authenticated
  using (public.auth_role() = 'manager' and public.is_manager_of(employee_id));

create policy "manager approves team expense_claims" on public.expense_claims
  for update to authenticated
  using (public.auth_role() = 'manager' and public.is_manager_of(employee_id))
  with check (public.auth_role() = 'manager' and public.is_manager_of(employee_id));

create policy "employee selects own expense_claims" on public.expense_claims
  for select to authenticated
  using (employee_id = public.auth_employee_id());

create policy "employee submits own expense_claims" on public.expense_claims
  for insert to authenticated
  with check (employee_id = public.auth_employee_id());

-- ---------------------------------------------------------------------
-- audit_log (read-only to admin/hr, never manager/employee)
-- ---------------------------------------------------------------------

alter table public.audit_log enable row level security;

create policy "admin/hr select audit_log in own org" on public.audit_log
  for select to authenticated
  using (public.auth_role() in ('admin', 'hr') and organization_id = public.auth_organization_id());

-- audit_log rows are only ever written by the trigger functions in
-- 00000000000018_audit_triggers.sql (SECURITY DEFINER, bypasses RLS) —
-- deliberately no INSERT/UPDATE/DELETE policy exists for any role.

-- ---------------------------------------------------------------------
-- integration_mappings / integration_sync_log (admin/hr only — internal
-- plumbing for the future AFAS coupling, not user-facing)
-- ---------------------------------------------------------------------

alter table public.integration_mappings enable row level security;
alter table public.integration_sync_log enable row level security;

create policy "admin/hr manage integration_mappings" on public.integration_mappings
  for all to authenticated
  using (public.auth_role() in ('admin', 'hr'))
  with check (public.auth_role() in ('admin', 'hr'));

create policy "admin/hr select integration_sync_log" on public.integration_sync_log
  for select to authenticated
  using (public.auth_role() in ('admin', 'hr'));

-- ---------------------------------------------------------------------
-- notification_log (admin/hr only — operational log, not user-facing)
-- ---------------------------------------------------------------------

alter table public.notification_log enable row level security;

create policy "admin/hr select notification_log" on public.notification_log
  for select to authenticated
  using (public.auth_role() in ('admin', 'hr'));
