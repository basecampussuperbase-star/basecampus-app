-- Asegurar que la tabla bookings existe y tiene la estructura correcta
create table if not exists bookings (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  course_id uuid references courses(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  room_id uuid references rooms(id) on delete set null, -- Puede ser nulo para Online
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  status text check (status in ('pending', 'confirmed', 'cancelled')) default 'pending',
  notes text,
  constraint bookings_dates_check check (end_time > start_time)
);

-- Asegurar que room_id pueda ser nulo (para cursos online)
alter table bookings alter column room_id drop not null;

-- Habilitar RLS
alter table bookings enable row level security;

-- Limpiar políticas antiguas para evitar conflictos
drop policy if exists "Users can view their own bookings" on bookings;
drop policy if exists "Users can insert their own bookings" on bookings;
drop policy if exists "Users can update their own bookings" on bookings;
drop policy if exists "Users can delete their own bookings" on bookings;

-- Crear políticas
-- 1. Ver bookings: Un usuario puede ver sus propios bookings, Y los instructores pueden ver bookings de sus cursos
create policy "Users and Instructors can view bookings"
  on bookings for select
  using (
    auth.uid() = user_id OR 
    exists (
      select 1 from courses 
      where courses.id = bookings.course_id 
      and courses.mentor_id = auth.uid()
    )
  );

-- 2. Insertar bookings: Los usuarios pueden crear bookings para sí mismos
create policy "Users can insert their own bookings"
  on bookings for insert
  with check ( auth.uid() = user_id );

-- 3. Actualizar bookings: Los usuarios pueden editar sus bookings
create policy "Users can update their own bookings"
  on bookings for update
  using ( auth.uid() = user_id );

-- 4. Borrar bookings: Los usuarios pueden borrar sus bookings
create policy "Users can delete their own bookings"
  on bookings for delete
  using ( auth.uid() = user_id );
