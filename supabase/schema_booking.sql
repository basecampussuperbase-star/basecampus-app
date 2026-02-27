-- ... (Previous schema content) ...

-- Create table for Rooms / Spaces
create table rooms (
  id uuid default uuid_generate_v4() primary key,
  name text not null, -- e.g., "Sala Conferencia A", "Estudio de Grabación 1"
  capacity integer not null,
  type text check (type in ('classroom', 'studio', 'meeting_room')) not null,
  hourly_rate decimal(10, 2) default 0.00, -- Rate for non-members or extra hours
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table rooms enable row level security;
create policy "Rooms are viewable by everyone" on rooms for select using (true);

-- Create table for Bookings
create table bookings (
  id uuid default uuid_generate_v4() primary key,
  room_id uuid references rooms(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  status text check (status in ('pending', 'confirmed', 'cancelled', 'completed')) default 'pending',
  total_price decimal(10, 2) default 0.00,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Prevent overlapping bookings for the same room
  exclude using gist (
    room_id with =,
    tstzrange(start_time, end_time) with &&
  )
);

alter table bookings enable row level security;

create policy "Users can view their own bookings" on bookings
  for select using (auth.uid() = user_id);

create policy "Users can insert their own bookings" on bookings
  for insert with check (auth.uid() = user_id);

-- Insert initial rooms (Seeds)
insert into rooms (name, capacity, type, hourly_rate) values
('Sala Conferencia (40p)', 40, 'classroom', 50.00),
('Sala Taller (25p)', 25, 'classroom', 35.00),
('Sala Reunión (6p)', 6, 'meeting_room', 20.00),
('Estudio de Grabación A', 5, 'studio', 45.00),
('Estudio de Grabación B', 5, 'studio', 45.00);
