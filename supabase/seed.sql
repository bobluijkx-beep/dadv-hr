-- Local development seed data. Never run against a production project.
-- Login for every seeded user below: password "password123".

begin;

-- ---------------------------------------------------------------------
-- Organization, departments, configurable rules
-- ---------------------------------------------------------------------

insert into public.organizations (id, name, kvk_number, address)
values ('00000000-0000-0000-0000-000000000001', 'Voorbeeld B.V.', '12345678', 'Hoofdstraat 1, 1234 AB Amsterdam');

insert into public.departments (id, organization_id, name) values
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Directie'),
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Operations'),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'HR');

insert into public.leave_types (id, organization_id, name, is_statutory, accrual_factor) values
  ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', 'Wettelijk verlof', true, 4),
  ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', 'Bovenwettelijk verlof', false, 1);

insert into public.break_rules (organization_id, min_hours, deduction_minutes, sort_order) values
  ('00000000-0000-0000-0000-000000000001', 5.5, 30, 1),
  ('00000000-0000-0000-0000-000000000001', 8, 45, 2);

-- ---------------------------------------------------------------------
-- Employees (one per role, so every RLS path has something to exercise)
-- ---------------------------------------------------------------------

insert into public.employees (
  id, organization_id, employee_number, first_name, last_name, gender,
  date_of_birth, department_id, job_title, employment_start_date, is_active
) values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', '0001', 'Anna', 'Bakker', 'vrouw', '1985-03-12', '00000000-0000-0000-0000-000000000010', 'Directeur', '2018-01-01', true),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', '0002', 'Sanne', 'de Vries', 'vrouw', '1990-07-04', '00000000-0000-0000-0000-000000000012', 'HR Adviseur', '2019-04-01', true),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000001', '0003', 'Tom', 'Jansen', 'man', '1982-11-23', '00000000-0000-0000-0000-000000000011', 'Teamleider Operations', '2017-06-01', true),
  ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000001', '0004', 'Bram', 'Visser', 'man', '1995-02-17', '00000000-0000-0000-0000-000000000011', 'Medewerker Operations', '2021-09-01', true);

-- Tom is the manager of Bram (direct report — the only hierarchy depth per §11.1)
update public.employees set manager_id = '00000000-0000-0000-0000-000000000103' where id = '00000000-0000-0000-0000-000000000104';

insert into public.employee_addresses (employee_id, street, postal_code, city) values
  ('00000000-0000-0000-0000-000000000101', 'Kerkstraat 1', '1234 AB', 'Amsterdam'),
  ('00000000-0000-0000-0000-000000000102', 'Dorpsplein 5', '2345 CD', 'Utrecht'),
  ('00000000-0000-0000-0000-000000000103', 'Molenweg 9', '3456 EF', 'Rotterdam'),
  ('00000000-0000-0000-0000-000000000104', 'Havenkade 22', '4567 GH', 'Den Haag');

insert into public.employee_contact_details (employee_id, phone, email) values
  ('00000000-0000-0000-0000-000000000101', '0611111111', 'anna.bakker@voorbeeld.test'),
  ('00000000-0000-0000-0000-000000000102', '0622222222', 'sanne.devries@voorbeeld.test'),
  ('00000000-0000-0000-0000-000000000103', '0633333333', 'tom.jansen@voorbeeld.test'),
  ('00000000-0000-0000-0000-000000000104', '0644444444', 'bram.visser@voorbeeld.test');

insert into public.contracts (id, employee_id, contract_number, start_date, contract_type, hours_per_week) values
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000101', 'C-0001', '2018-01-01', 'onbepaalde_tijd', 40),
  ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000102', 'C-0002', '2019-04-01', 'onbepaalde_tijd', 32),
  ('00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000103', 'C-0003', '2017-06-01', 'onbepaalde_tijd', 40),
  ('00000000-0000-0000-0000-000000000204', '00000000-0000-0000-0000-000000000104', 'C-0004', '2021-09-01', 'bepaalde_tijd', 32);

insert into public.contract_compensation (contract_id, salary_amount, salary_scale) values
  ('00000000-0000-0000-0000-000000000201', 6500, 'schaal-10'),
  ('00000000-0000-0000-0000-000000000202', 3800, 'schaal-6'),
  ('00000000-0000-0000-0000-000000000203', 4200, 'schaal-7'),
  ('00000000-0000-0000-0000-000000000204', 3100, 'schaal-4');

-- ---------------------------------------------------------------------
-- Auth users, one per role. handle_new_user() (00000000000019) reads role
-- + organization_id + employee_id from raw_user_meta_data and creates the
-- matching profiles row automatically.
-- ---------------------------------------------------------------------

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000301', 'authenticated', 'authenticated',
   'admin@voorbeeld.test', extensions.crypt('password123', extensions.gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}',
   '{"organization_id":"00000000-0000-0000-0000-000000000001","role":"admin","employee_id":"00000000-0000-0000-0000-000000000101"}',
   '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000302', 'authenticated', 'authenticated',
   'hr@voorbeeld.test', extensions.crypt('password123', extensions.gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}',
   '{"organization_id":"00000000-0000-0000-0000-000000000001","role":"hr","employee_id":"00000000-0000-0000-0000-000000000102"}',
   '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000303', 'authenticated', 'authenticated',
   'manager@voorbeeld.test', extensions.crypt('password123', extensions.gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}',
   '{"organization_id":"00000000-0000-0000-0000-000000000001","role":"manager","employee_id":"00000000-0000-0000-0000-000000000103"}',
   '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000304', 'authenticated', 'authenticated',
   'medewerker@voorbeeld.test', extensions.crypt('password123', extensions.gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}',
   '{"organization_id":"00000000-0000-0000-0000-000000000001","role":"employee","employee_id":"00000000-0000-0000-0000-000000000104"}',
   '', '', '', '');

-- Close the loop: point each employee at their profile (= auth user id).
update public.employees set user_id = '00000000-0000-0000-0000-000000000301' where id = '00000000-0000-0000-0000-000000000101';
update public.employees set user_id = '00000000-0000-0000-0000-000000000302' where id = '00000000-0000-0000-0000-000000000102';
update public.employees set user_id = '00000000-0000-0000-0000-000000000303' where id = '00000000-0000-0000-0000-000000000103';
update public.employees set user_id = '00000000-0000-0000-0000-000000000304' where id = '00000000-0000-0000-0000-000000000104';

commit;
