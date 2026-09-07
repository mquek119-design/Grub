-- `recipes.image_url` has existed since 0001 (see the design note in
-- FoodImage.tsx) but nothing has ever written to it: recipe photos have
-- always fallen back to the deterministic tinted tile. This is the storage
-- side of turning that on.
--
-- Objects are keyed `{house_id}/{recipe_id}`, with no file extension — the
-- content type is set explicitly on upload, so an `<img>` tag renders it
-- correctly regardless, and re-uploading with `upsert: true` overwrites the
-- same key rather than accumulating orphans from a changed file type.
--
-- The bucket is public: recipe photos are house dinners, not sensitive data,
-- and a public bucket serves straight from Supabase's CDN without the app
-- having to mint or refresh signed URLs for every card in the grid.

insert into storage.buckets (id, name, public)
values ('recipe-images', 'recipe-images', true)
on conflict (id) do nothing;

create policy "recipe images are publicly readable"
on storage.objects for select
using (bucket_id = 'recipe-images');

-- Upload/replace/remove are all gated the same way: the first path segment
-- must be the caller's own house. A global recipe (house_id null) has no
-- house folder to write into, so uploading a photo to one is simply refused
-- rather than requiring a separate carve-out.
create policy "house members can upload their recipe images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'recipe-images'
  and (storage.foldername(name))[1] = (
    select house_id::text from profiles where id = auth.uid()
  )
);

create policy "house members can replace their recipe images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'recipe-images'
  and (storage.foldername(name))[1] = (
    select house_id::text from profiles where id = auth.uid()
  )
);

create policy "house members can delete their recipe images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'recipe-images'
  and (storage.foldername(name))[1] = (
    select house_id::text from profiles where id = auth.uid()
  )
);
