-- Quizzes Table
create table if not exists quizzes (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid references courses(id) on delete cascade not null,
  lesson_id uuid references lessons(id) on delete cascade unique,
  module_id uuid references modules(id) on delete cascade unique,
  title text not null,
  description text,
  type text check (type in ('lesson', 'module', 'exam')) default 'lesson',
  passing_score integer default 80,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table quizzes enable row level security;

-- Questions Table
create table if not exists questions (
  id uuid default uuid_generate_v4() primary key,
  quiz_id uuid references quizzes(id) on delete cascade not null,
  question_text text not null,
  position integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table questions enable row level security;

-- Options Table
create table if not exists options (
  id uuid default uuid_generate_v4() primary key,
  question_id uuid references questions(id) on delete cascade not null,
  option_text text not null,
  is_correct boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table options enable row level security;

-- Quiz Attempts (Student Results)
create table if not exists user_quiz_attempts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  quiz_id uuid references quizzes(id) on delete cascade not null,
  score integer not null,
  passed boolean default false,
  answers jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table user_quiz_attempts enable row level security;

-- Policies

-- Quizzes: Mentors manage their own course quizzes. Students view them.
create policy "Mentors can manage quizzes for their courses"
  on quizzes for all
  using ( exists ( select 1 from courses where id = quizzes.course_id and mentor_id = auth.uid() ) );

create policy "Students can view quizzes for published courses"
  on quizzes for select
  using ( exists ( select 1 from courses where id = quizzes.course_id and published = true ) );

-- Questions: Same as Quizzes
create policy "Mentors manage questions"
  on questions for all
  using ( exists ( select 1 from quizzes join courses on quizzes.course_id = courses.id where quizzes.id = questions.quiz_id and courses.mentor_id = auth.uid() ) );

create policy "Students view questions"
  on questions for select
  using ( true );

-- Options: Same as Quizzes
create policy "Mentors manage options"
  on options for all
  using ( exists ( select 1 from questions join quizzes on questions.quiz_id = quizzes.id join courses on quizzes.course_id = courses.id where questions.id = options.question_id and courses.mentor_id = auth.uid() ) );

create policy "Students view options"
  on options for select
  using ( true );

-- Attempts: Students manage their own attempts. Mentors can view attempts for their courses.
create policy "Students insert own attempts"
  on user_quiz_attempts for insert
  with check ( auth.uid() = user_id );

create policy "Students view own attempts"
  on user_quiz_attempts for select
  using ( auth.uid() = user_id );

create policy "Mentors view attempts for their courses"
  on user_quiz_attempts for select
  using ( exists ( select 1 from quizzes join courses on quizzes.course_id = courses.id where quizzes.id = user_quiz_attempts.quiz_id and courses.mentor_id = auth.uid() ) );
