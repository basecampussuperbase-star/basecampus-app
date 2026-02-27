-- Update Room Names to be more descriptive
update rooms 
set name = 'Sala Magna (Máximo 40 personas)', capacity = 40 
where name like '%40p%' or capacity = 40;

update rooms 
set name = 'Sala Media (Máximo 25 personas)', capacity = 25 
where name like '%25p%' or capacity = 25;

update rooms 
set name = 'Sala Focus (Máximo 12 personas)', capacity = 12 
where name like '%12p%' or name like '%6p%' or capacity = 6 or capacity = 12;

-- Verify if they exist, if not insert them with correct names
insert into rooms (name, capacity, type, hourly_rate)
select 'Sala Magna (Máximo 40 personas)', 40, 'classroom', 0
where not exists (select 1 from rooms where capacity = 40);

insert into rooms (name, capacity, type, hourly_rate)
select 'Sala Media (Máximo 25 personas)', 25, 'classroom', 0
where not exists (select 1 from rooms where capacity = 25);

insert into rooms (name, capacity, type, hourly_rate)
select 'Sala Focus (Máximo 12 personas)', 12, 'meeting_room', 0
where not exists (select 1 from rooms where capacity = 12);
