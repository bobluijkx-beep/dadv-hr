-- RLS regression tests for the Fase 1 schema. Run with:
--   supabase test db
--
-- Builds its own fixtures (independent of supabase/seed.sql) so it stays
-- correct even as the seed data changes, and rolls everything back at the
-- end so it never pollutes a real database.

begin;
select plan(10);

-- ---------------------------------------------------------------------
-- Fixtures (created as the unrestricted `postgres` role, i.e. before we
-- switch to `authenticated` below)
-- ---------------------------------------------------------------------

insert into public.organizations (id, name) values
  ('10000000-0000-0000-0000-000000000001', 'Test Org');

insert into public.employees (id, organization_id, employee_number, first_name, last_name, is_active) values
  ('10000000-0000-0000-0000-000000000101', '10000000-0000-0000-0000-000000000001', 'T-001', 'Manon', 'Manager', true),
  ('10000000-0000-0000-0000-000000000102', '10000000-0000-0000-0000-000000000001', 'T-002', 'Ellen', 'Employee', true),
  ('10000000-0000-0000-0000-000000000103', '10000000-0000-0000-0000-000000000001', 'T-003', 'Olaf', 'Outsider', true);

update public.employees set manager_id = '10000000-0000-0000-0000-000000000101'
  where id = '10000000-0000-0000-0000-000000000102';

insert into public.contracts (id, employee_id, contract_number, start_date, contract_type, hours_per_week) values
  ('10000000-0000-0000-0000-000000000201', '10000000-0000-0000-0000-000000000102', 'TC-001', current_date, 'onbepaalde_tijd', 32);

insert into public.contract_compensation (contract_id, salary_amount) values
  ('10000000-0000-0000-0000-000000000201', 3000);

insert into public.absence_records (id, employee_id, first_sick_day, incapacity_percentage, notes) values
  ('10000000-0000-0000-0000-000000000301', '10000000-0000-0000-0000-000000000102', current_date, 100, 'vertrouwelijke medische notitie');

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token, email_change_token_new, email_change)
values
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000401', 'authenticated', 'authenticated', 'manon@test.local', 'x', now(), now(), now(), '{}', '{"organization_id":"10000000-0000-0000-0000-000000000001","role":"manager","employee_id":"10000000-0000-0000-0000-000000000101"}', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000402', 'authenticated', 'authenticated', 'ellen@test.local', 'x', now(), now(), now(), '{}', '{"organization_id":"10000000-0000-0000-0000-000000000001","role":"employee","employee_id":"10000000-0000-0000-0000-000000000102"}', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000403', 'authenticated', 'authenticated', 'olaf@test.local', 'x', now(), now(), now(), '{}', '{"organization_id":"10000000-0000-0000-0000-000000000001","role":"employee","employee_id":"10000000-0000-0000-0000-000000000103"}', '', '', '', '');

-- ---------------------------------------------------------------------
-- As the manager (Manon): should see her direct report (Ellen) but not
-- the outsider (Olaf), and should not be able to read salary at all.
-- ---------------------------------------------------------------------

set local role authenticated;
set local "request.jwt.claims" = '{"sub": "10000000-0000-0000-0000-000000000401", "role": "authenticated"}';

select results_eq(
  $$select employee_number from public.employees where id = '10000000-0000-0000-0000-000000000102'$$,
  $$values ('T-002')$$,
  'manager can select their direct report'
);

select is_empty(
  $$select 1 from public.employees where id = '10000000-0000-0000-0000-000000000103'$$,
  'manager cannot select an employee outside their team'
);

select is_empty(
  $$select 1 from public.contract_compensation$$,
  'manager cannot select contract_compensation at all'
);

select is_empty(
  $$select 1 from public.absence_records$$,
  'manager cannot select absence_records directly'
);

select results_eq(
  $$select status::text from public.absence_status_view where employee_id = '10000000-0000-0000-0000-000000000102'$$,
  $$values ('actief')$$,
  'manager can see status via absence_status_view for their direct report'
);

-- ---------------------------------------------------------------------
-- As the employee (Ellen): sees herself and her own manager (Manon) —
-- needed to resolve "Leidinggevende: ..." on her dossier — but never
-- an unrelated employee (Olaf).
-- ---------------------------------------------------------------------

set local "request.jwt.claims" = '{"sub": "10000000-0000-0000-0000-000000000402", "role": "authenticated"}';

select results_eq(
  $$select count(*) from public.employees$$,
  array[2::bigint],
  'employee sees exactly two employees rows: herself and her own manager'
);

select isnt_empty(
  $$select 1 from public.employees where id = '10000000-0000-0000-0000-000000000101'$$,
  'employee can select her own manager''s row (select own manager policy)'
);

select is_empty(
  $$select 1 from public.employees where id = '10000000-0000-0000-0000-000000000103'$$,
  'employee cannot select an unrelated employee row'
);

select is_empty(
  $$select 1 from public.contract_compensation$$,
  'employee cannot select contract_compensation'
);

-- ---------------------------------------------------------------------
-- Audit logging: an update made as admin/hr must land in audit_log.
-- (Switch back to an unrestricted context to perform + verify the write,
-- since audit_log has no SELECT policy for employee/manager.)
-- ---------------------------------------------------------------------

reset role;

update public.employees set job_title = 'Bijgewerkte functietitel'
  where id = '10000000-0000-0000-0000-000000000102';

select isnt_empty(
  $$select 1 from public.audit_log where table_name = 'employees' and record_id = '10000000-0000-0000-0000-000000000102' and action = 'update'$$,
  'updating an employee writes an audit_log row'
);

select * from finish();
rollback;
