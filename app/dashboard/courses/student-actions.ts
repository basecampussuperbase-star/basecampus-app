'use server';

import { createClient } from '@/lib/supabase/server';

export type StudentProgress = {
    user_id: string;
    full_name: string;
    email: string;
    avatar_url: string;
    enrolled_at: string;
    progress_percentage: number;
    average_quiz_grade: number | null;
    completed_lessons: number;
    total_lessons: number;
};

export async function getCourseStudents(courseId: string): Promise<StudentProgress[]> {
    const supabase = await createClient();

    // 1. Get all enrollments for this course
    const { data: enrollments, error: enrollError } = await supabase
        .from('course_enrollments')
        .select(`
            enrolled_at,
            profiles:user_id (
                id,
                full_name,
                email,
                avatar_url
            )
        `)
        .eq('course_id', courseId);

    if (enrollError) throw new Error(enrollError.message);
    if (!enrollments) return [];

    // 2. Get Course Modules & Lessons for efficient filtering
    const { data: modules } = await supabase
        .from('modules')
        .select('id, lessons(id)')
        .eq('course_id', courseId);

    // Flatten lessons into a Set for fast lookup
    const courseLessonIds = new Set<string>();
    modules?.forEach(m => {
        m.lessons?.forEach((l: any) => courseLessonIds.add(l.id));
    });

    const validTotalLessons = courseLessonIds.size;

    // 3. For each student, calculate progress and grades
    const enrichedStudents = await Promise.all(enrollments.map(async (enrollment: any) => {
        const studentId = enrollment.profiles.id;

        // A. Get Quiz Averages (Filtered by course)
        const { data: courseQuizAttempts } = await supabase
            .from('user_quiz_attempts')
            .select(`
                score,
                quizzes!inner (
                    course_id
                )
             `)
            .eq('quizzes.course_id', courseId)
            .eq('user_id', studentId);

        let avgGrade = null;
        if (courseQuizAttempts && courseQuizAttempts.length > 0) {
            const totalScore = courseQuizAttempts.reduce((acc, curr) => acc + curr.score, 0);
            avgGrade = Math.round(totalScore / courseQuizAttempts.length);
        }

        // B. Calculate Completion
        // Get user completions filtered by our valid list
        const { data: completions } = await supabase
            .from('lesson_completions')
            .select('lesson_id')
            .eq('user_id', studentId);

        const validCompletions = completions?.filter(c => courseLessonIds.has(c.lesson_id)).length || 0;
        const progress = validTotalLessons > 0 ? Math.round((validCompletions / validTotalLessons) * 100) : 0;

        return {
            user_id: studentId,
            full_name: enrollment.profiles.full_name,
            email: enrollment.profiles.email,
            avatar_url: enrollment.profiles.avatar_url,
            enrolled_at: enrollment.enrolled_at,
            progress_percentage: progress,
            average_quiz_grade: avgGrade,
            completed_lessons: validCompletions,
            total_lessons: validTotalLessons
        };
    }));

    return enrichedStudents;
}

// Now update the students data with real progress

