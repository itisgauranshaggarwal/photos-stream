-- ============================================================
-- PhotoStream — 04_storage.sql
-- Run in: Supabase Dashboard → SQL Editor → Run
-- Lets signed-in users upload / delete their own photos in the
-- private `photos` bucket (folder = the user's own auth uid).
-- Viewing is by expiring signed URL, so no public read policy.
-- ============================================================

create policy "photos_upload" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "photos_delete" on storage.objects for delete to authenticated
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- The lines below should print 'ready'. If they error, re-check above.
select 'storage policies applied' as status;