-- Add new columns to profiles table for mentor settings
alter table profiles 
add column if not exists description text,
add column if not exists instagram_url text,
add column if not exists tiktok_url text,
add column if not exists youtube_url text,
add column if not exists linkedin_url text,
add column if not exists facebook_url text,
add column if not exists twitter_url text,
add column if not exists whatsapp_number text;

-- Ensure RLS allows updates (already exists but good to double check via logic, usually 'Users can update own profile' covers it)
-- The existing policy: "create policy "Users can update own profile." on profiles for update using (auth.uid() = id);" handles this.
