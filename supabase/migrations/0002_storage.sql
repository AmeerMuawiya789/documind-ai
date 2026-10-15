-- DocuMind AI — private storage for uploaded documents
-- Files live under "<user_id>/<document_id>/<filename>" and RLS keeps
-- every user inside their own folder.

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Upload: only into your own folder
create policy "documents_storage_insert_own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Read: only your own folder
create policy "documents_storage_select_own"
on storage.objects for select
to authenticated
using (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Delete: only your own folder
create policy "documents_storage_delete_own"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- No public access, no update policy: files are immutable once uploaded.
-- The service role (server-side upload + extraction) bypasses RLS.
