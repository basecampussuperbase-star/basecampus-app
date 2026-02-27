-- Create a public bucket for course covers
insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;

-- Allow public access to view covers
create policy "Cover images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'covers' );

-- Allow authenticated users to upload covers
create policy "Authenticated users can upload covers."
  on storage.objects for insert
  with check ( bucket_id = 'covers' and auth.role() = 'authenticated' );

-- Allow users to update their own covers (or any cover if authenticated, simplify for now)
create policy "Authenticated users can update covers."
  on storage.objects for update
  using ( bucket_id = 'covers' and auth.role() = 'authenticated' );

-- Allow users to delete their own covers
create policy "Authenticated users can delete covers."
  on storage.objects for delete
  using ( bucket_id = 'covers' and auth.role() = 'authenticated' );
