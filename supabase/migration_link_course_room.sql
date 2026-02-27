-- Link courses to rooms
alter table courses 
add column if not exists room_id uuid references rooms(id) on delete set null;

-- Update Room Capacities explicitly to match requirements if not already
update rooms set capacity = 50 where name like '%Magna%';
update rooms set capacity = 25 where name like '%Media%';
update rooms set capacity = 12 where name like '%Focus%';

-- Ensure names are correct
update rooms set name = 'Sala Magna (Máximo 50 personas)' where name like '%Magna%';
update rooms set name = 'Sala Media (Máximo 25 personas)' where name like '%Media%';
update rooms set name = 'Sala Focus (Máximo 12 personas)' where name like '%Focus%';
