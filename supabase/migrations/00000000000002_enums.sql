-- All enum types used across the schema, defined once up front so later
-- migrations can reference them regardless of file order.

create type public.user_role as enum ('admin', 'hr', 'manager', 'employee');

create type public.gender_type as enum ('man', 'vrouw', 'anders', 'onbekend');

create type public.contract_type as enum (
  'bepaalde_tijd',
  'onbepaalde_tijd',
  'oproep',
  'stage',
  'overig'
);

create type public.document_category as enum (
  'arbeidsovereenkomst',
  'addendum',
  'id_document',
  'certificaat',
  'functioneringsgesprek',
  'beoordelingsgesprek',
  'verzuimdocument',
  'overig'
);

create type public.overtime_status as enum (
  'geregistreerd',
  'goedgekeurd',
  'aangeboden_salarisadministratie',
  'verwerkt',
  'uitbetaald',
  'tijd_voor_tijd'
);

create type public.leave_transaction_type as enum (
  'opbouw',
  'opname',
  'correctie',
  'jaarovergang'
);

create type public.leave_request_status as enum (
  'aangevraagd',
  'goedgekeurd',
  'afgewezen',
  'ingetrokken'
);

create type public.absence_status as enum (
  'actief',
  'hersteld',
  'gedeeltelijk_hersteld'
);

create type public.expense_status as enum (
  'ingediend',
  'goedgekeurd',
  'afgewezen',
  'betaald'
);

create type public.notification_type as enum (
  'verlof_aangevraagd',
  'verlof_goedgekeurd',
  'verlof_afgewezen',
  'overuren_ingediend',
  'overuren_goedgekeurd',
  'overuren_aangeboden',
  'overuren_verwerkt'
);

create type public.notification_status as enum ('verzonden', 'mislukt');

create type public.integration_direction as enum ('inbound', 'outbound');

create type public.integration_sync_status as enum ('success', 'failed', 'pending');

create type public.audit_action as enum ('insert', 'update', 'delete');
