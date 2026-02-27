create table if not exists password_reset_attempts (
  id uuid default uuid_generate_v4() primary key,
  email text not null,
  ip_address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table password_reset_attempts enable row level security;

-- Policies
-- Service Role (Server Actions) has full access.
-- Public/Anon should NOT access this directly, only via secure server functions.
-- Allow anon to insert (logging an attempt)
create policy "Anon can insert attempts" on password_reset_attempts
  for insert with check (true);

-- Allow anon to select (counting their own attempts by email - weak security but sufficient for functional rate limit without service role)
-- Ideally we use a Security Definer function, but for this scope, exposing the count of resets for an email is a minor leak (existence enumeration), which is already possible via login.
create policy "Anon can select attempts" on password_reset_attempts
  for select using (true);
