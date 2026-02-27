-- Add image_url to courses
alter table courses add column if not exists image_url text;

-- Create storage bucket for course covers
insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;

-- Storage Policies for 'covers'

-- Public Access
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'covers' );

-- Authenticated users (Mentors) can upload
create policy "Mentors can upload covers"
  on storage.objects for insert
  with check (
    bucket_id = 'covers' 
    and auth.role() = 'authenticated'
  );

-- Mentors can update/delete their own files (based on naming convention or owner?)
-- Simpler: Allow authenticated to update/delete for now, or refine by owner if we stored owner_id in metadata.
-- For MVP: Allow authenticated update/delete. 
create policy "Mentors can update covers"
  on storage.objects for update
  using ( bucket_id = 'covers' and auth.role() = 'authenticated' );

create policy "Mentors can delete covers"
  on storage.objects for delete
  using ( bucket_id = 'covers' and auth.role() = 'authenticated' );
