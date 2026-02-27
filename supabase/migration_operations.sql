-- Add course_id and notes to bookings to link them to courses
alter table bookings 
add column if not exists course_id uuid references courses(id) on delete set null,
add column if not exists notes text;

-- Insert or Update default rooms (Rooms 40, 25, 12)
-- We use a do block or just insert if not exists logic.
-- Since I can't easy do upsert on name without unique constraint, I'll just insert them.
-- Assuming table is empty or we just add them.

insert into rooms (name, capacity, type, hourly_rate)
select 'Sala Magna (40p)', 40, 'classroom', 0
where not exists (select 1 from rooms where name = 'Sala Magna (40p)');

insert into rooms (name, capacity, type, hourly_rate)
select 'Sala Media (25p)', 25, 'classroom', 0
where not exists (select 1 from rooms where name = 'Sala Media (25p)');

insert into rooms (name, capacity, type, hourly_rate)
select 'Sala Focus (12p)', 12, 'meeting_room', 0
where not exists (select 1 from rooms where name = 'Sala Focus (12p)');
