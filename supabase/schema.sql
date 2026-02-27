-- Create a table for public profiles
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique,
  full_name text,
  avatar_url text,
  role text check (role in ('admin', 'mentor', 'student')) default 'student',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table profiles enable row level security;

-- Create policies for profiles
create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- Create table for Courses
create table courses (
  id uuid default uuid_generate_v4() primary key,
  mentor_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  description text,
  price decimal(10, 2) default 0.00,
  thumbnail_url text,
  published boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Courses
alter table courses enable row level security;

create policy "Courses are viewable by everyone if published." on courses
  for select using (published = true);

create policy "Mentors can view all their own courses." on courses
  for select using (auth.uid() = mentor_id);

create policy "Mentors can insert their own courses." on courses
  for insert with check (auth.uid() = mentor_id);

create policy "Mentors can update their own courses." on courses
  for update using (auth.uid() = mentor_id);

create policy "Mentors can delete their own courses." on courses
  for delete using (auth.uid() = mentor_id);

-- Create table for Modules
create table modules (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid references courses(id) on delete cascade not null,
  title text not null,
  position integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table modules enable row level security;

create policy "Public view of modules for published courses" on modules
  for select using (exists (select 1 from courses where id = modules.course_id and published = true));

create policy "Mentors manage modules" on modules
  for all using (exists (select 1 from courses where id = modules.course_id and mentor_id = auth.uid()));

-- Create table for Lessons
create table lessons (
  id uuid default uuid_generate_v4() primary key,
  module_id uuid references modules(id) on delete cascade not null,
  title text not null,
  content text, -- Markdown or HTML description
  video_url text, -- Mux or other video provider URL
  position integer not null,
  is_free boolean default false, -- Previewable lesson
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table lessons enable row level security;

create policy "Public view of lessons for published courses" on lessons
  for select using (exists (
    select 1 from modules 
    join courses on modules.course_id = courses.id 
    where modules.id = lessons.module_id and courses.published = true
  ));

create policy "Mentors manage lessons" on lessons
  for all using (exists (
    select 1 from modules 
    join courses on modules.course_id = courses.id 
    where modules.id = lessons.module_id and courses.mentor_id = auth.uid()
  ));

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
