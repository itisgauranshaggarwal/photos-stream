-- ============================================================
-- 07_storage_read.sql
-- Public read on the `photos` bucket.
--
-- WHY: uploading worked (db/04 added insert/delete policies) but
-- feed cards / photostrip showed broken images. Signed-URL creation
-- (createSignedUrl) is a *read* on storage.objects, and with no
-- SELECT policy RLS hides every object → the API returns NoSuchKey.
--
-- Photo paths contain random UUIDs (<uid>/<uuid>.webp), so this is
-- "public only to people who already know the path" — which a feed of
-- public photos already is. Anon access is required so that signed
-- URLs can also be minted for visitors who are not signed in.
-- ============================================================

create policy "photos_read"
  on storage.objects
  for select
  using (bucket_id = 'photos');