-- 1. Payment Links Table
create table if not exists payment_links (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid references courses(id) on delete cascade not null,
  mentor_id uuid references profiles(id) on delete cascade not null,
  seller_tag text, -- e.g., "MARIA_VENTAS"
  whatsapp_group_link text,
  price_override numeric(10, 2), -- If the mentor wants to offer a special price via this link
  views integer default 0,
  sales_count integer default 0,
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table payment_links enable row level security;

-- RLS for Payment Links

-- Mentors manage their own links
create policy "Mentors manage own payment links" on payment_links
    for all using (auth.uid() = mentor_id);

-- Public read access for active links (needed for the landing page /enroll/[id])
create policy "Public view active payment links" on payment_links
    for select using (active = true);


-- 2. Update Enrollments Table to track Sales
alter table course_enrollments 
add column if not exists payment_link_id uuid references payment_links(id),
add column if not exists amount_paid numeric(10, 2) default 0,
add column if not exists payment_status text default 'free'; -- 'paid', 'pending', 'free'

-- 3. Functions to increment counters safely
create or replace function increment_link_views(link_id uuid)
returns void as $$
begin
  update payment_links
  set views = views + 1
  where id = link_id;
end;
$$ language plpgsql security definer;
