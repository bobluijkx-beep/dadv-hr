-- Documentbeheer (Fase 4): the `documents` Storage bucket + upload
-- policies. supabase/config.toml's [storage.buckets.documents] section only
-- provisions the bucket for local `supabase start` — this migration is
-- what actually creates it on a linked hosted project (storage.buckets is
-- itself just a Postgres table the Storage API reads from).

insert into storage.buckets (id, name, public, file_size_limit)
values ('documents', 'documents', false, 26214400) -- 25 MiB, matches config.toml
on conflict (id) do nothing;

-- Only INSERT policies are granted here. Downloads never go through
-- storage.objects RLS at all — they're always a short-lived signed URL
-- generated server-side (service-role client) after the caller's access to
-- the document's *metadata* row has already been checked via the
-- documents/document_versions RLS policies (00000000000016_rls_policies.sql).
-- That keeps "which categories can a manager see" a single source of truth
-- instead of duplicating it in a storage-path convention.

create policy "admin/hr upload any document" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'documents' and public.auth_role() in ('admin', 'hr'));

-- Files are stored at `{employee_id}/{document_id}/{version}-{filename}`;
-- this restricts an employee's own uploads to their own folder.
create policy "employee uploads into own folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = public.auth_employee_id()::text
  );
