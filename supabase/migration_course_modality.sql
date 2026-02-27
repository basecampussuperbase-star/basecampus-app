-- Add modality and logistics columns to courses table
alter table courses 
add column if not exists modality text default 'online' check (modality in ('online', 'in-person', 'hybrid')),
add column if not exists is_live boolean default false,
add column if not exists address text,
add column if not exists schedule_info text,
add column if not exists max_students int;

-- Add checking for modality types
-- (Already included in the check constraint above)
