create table if not exists exchange_rates (
  id uuid default uuid_generate_v4() primary key,
  currency_from text default 'USD' not null,
  currency_to text default 'VES' not null,
  rate decimal(10, 2) not null,
  effective_date timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table exchange_rates enable row level security;

-- Policies
-- Anyone can view rates (public)
create policy "Rates are viewable by everyone" on exchange_rates
  for select using (true);

-- Only Admins can insert/update (assuming logic checks role in app, but RLS here adds safety)
-- For now, allowing authenticated users to insert if they are admin is complex in SQL without custom claims
-- We'll rely on application logic for 'created_by' and restriction, or strict RLS if role is in JWT.
-- Simplest for now: Allow all authenticated to read, but we will restrict write in standard RLS if possible.
-- Let's stick to: "Profiles with role='admin' can insert"
create policy "Admins can insert rates" on exchange_rates
  for insert with check (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );
