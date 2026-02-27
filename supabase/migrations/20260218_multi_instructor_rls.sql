-- Update RLS for Modules
-- Allow Course Owner OR Assigned Instructor to update modules
create policy "Instructors can update assigned modules" on modules
    for update using (
        instructor_id = auth.uid() 
        or 
        exists (select 1 from courses where id = modules.course_id and mentor_id = auth.uid())
    );

-- Update RLS for Lessons
-- Allow Course Owner OR Assigned Module Instructor to manage lessons
create policy "Instructors can manage lessons in assigned modules" on lessons
    for all using (
        exists (
            select 1 from modules 
            where modules.id = lessons.module_id 
            and (
                modules.instructor_id = auth.uid()
                or
                exists (select 1 from courses where id = modules.course_id and mentor_id = auth.uid())
            )
        )
    );
