-- 1. TABLA DE INSCRIPCIONES (Enrollments)
create table if not exists course_enrollments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  course_id uuid references courses(id) on delete cascade not null,
  enrolled_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, course_id)
);

alter table course_enrollments enable row level security;

-- 2. TABLA DE PROGRESO (Lesson Completions)
create table if not exists lesson_completions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  lesson_id uuid references lessons(id) on delete cascade not null,
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, lesson_id)
);

alter table lesson_completions enable row level security;

-- 3. POLITICAS DE SEGURIDAD (RLS)

-- Enrollments Policies
-- Students can see their own enrollments
create policy "Students view own enrollments" on course_enrollments
    for select using (auth.uid() = user_id);

-- Mentors can see enrollments for their courses
create policy "Mentors view enrollments for their courses" on course_enrollments
    for select using (
        exists (
            select 1 from courses
            where courses.id = course_enrollments.course_id
            and courses.mentor_id = auth.uid()
        )
    );

-- Lesson Completions Policies
-- Students can manage their own completions
create policy "Students manage own completions" on lesson_completions
    for all using (auth.uid() = user_id);

-- Mentors can view completions for their lessons
create policy "Mentors view completions for their lessons" on lesson_completions
    for select using (
        exists (
            select 1 from lessons
            join modules on lessons.module_id = modules.id
            join courses on modules.course_id = courses.id
            where lessons.id = lesson_completions.lesson_id
            and courses.mentor_id = auth.uid()
        )
    );
