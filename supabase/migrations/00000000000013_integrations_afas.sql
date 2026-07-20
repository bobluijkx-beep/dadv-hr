-- AFAS-voorbereiding (Fase 11). No live coupling — just the mapping/log
-- tables so a future integration layer (lib/integrations/afas) has
-- somewhere to record external keys and sync history from day one.

create table public.integration_mappings (
  id uuid primary key default gen_random_uuid(),
  system text not null default 'afas',
  local_table text not null,
  local_id uuid not null,
  external_id text not null,
  created_at timestamptz not null default now(),
  unique (system, local_table, local_id)
);

create table public.integration_sync_log (
  id uuid primary key default gen_random_uuid(),
  system text not null default 'afas',
  direction public.integration_direction not null,
  entity text not null,
  status public.integration_sync_status not null default 'pending',
  payload jsonb,
  synced_at timestamptz not null default now()
);

create index integration_sync_log_entity_idx on public.integration_sync_log (entity);
