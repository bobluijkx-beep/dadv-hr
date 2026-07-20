-- E-mail: log of every notification the centrale notificatieservice sends
-- via Resend (Fase 10). related_table/related_id is a generic polymorphic
-- reference rather than one FK per notification type, since the set of
-- notifiable events is expected to grow.

create table public.notification_log (
  id uuid primary key default gen_random_uuid(),
  type public.notification_type not null,
  recipient_email text not null,
  related_table text,
  related_id uuid,
  status public.notification_status not null default 'verzonden',
  resend_message_id text,
  sent_at timestamptz not null default now()
);

create index notification_log_related_idx on public.notification_log (related_table, related_id);
