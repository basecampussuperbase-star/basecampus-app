-- 1. Create Lesson Status Enum
do $$ begin
    create type lesson_status as enum ('draft', 'review', 'published');
exception
    when duplicate_object then null;
end $$;

-- 2. Add status to lessons
alter table lessons 
add column if not exists status lesson_status not null default 'draft';

-- 3. Add instructor_id to modules
alter table modules
add column if not exists instructor_id uuid references profiles(id);

-- 4. Create course_instructors table (Active Team)
create table if not exists course_instructors (
    id uuid default uuid_generate_v4() primary key,
    course_id uuid references courses(id) on delete cascade not null,
    instructor_id uuid references profiles(id) on delete cascade not null,
    role text default 'collaborator',
    created_at timestamp with time zone default now(),
    unique(course_id, instructor_id)
);

alter table course_instructors enable row level security;

-- 5. Create course_invites table (Pending Invites)
create table if not exists course_invites (
    id uuid default uuid_generate_v4() primary key,
    course_id uuid references courses(id) on delete cascade not null,
    email text not null,
    token text not null unique,
    role text default 'collaborator',
    created_at timestamp with time zone default now(),
    expires_at timestamp with time zone default (now() + interval '7 days'),
    unique(course_id, email)
);

alter table course_invites enable row level security;

-- POLICIES

-- course_instructors
create policy "Course owners and admins can manage instructors" on course_instructors
    for all using (
        exists (select 1 from courses where id = course_instructors.course_id and mentor_id = auth.uid())
        or
        exists (select 1 from profiles where id = auth.uid() and role = 'admin')
    );

create policy "Instructors can view their own memberships" on course_instructors
    for select using (instructor_id = auth.uid());

-- course_invites
create policy "Course owners can manage invites" on course_invites
    for all using (
        exists (select 1 from courses where id = course_invites.course_id and mentor_id = auth.uid())
    );

-- course access for instructors (Reading the course they are invited to)
create policy "Instructors can view courses they are assigned to" on courses
    for select using (
        exists (select 1 from course_instructors where course_id = courses.id and instructor_id = auth.uid())
    );
