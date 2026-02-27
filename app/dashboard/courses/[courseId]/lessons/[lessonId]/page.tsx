import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import LessonEditorClient from './client';
import { getQuizForLesson } from '../../../quiz-actions';

export default async function LessonEditorPage({
    params
}: {
    params: Promise<{ courseId: string; lessonId: string }>
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { courseId, lessonId } = await params;

    // Fetch Lesson
    const { data: lesson, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single();

    if (error || !lesson) {
        return <div className="p-8 text-center">Lección no encontrada</div>;
    }

    // Fetch existing quiz if any
    const quiz = await getQuizForLesson(lessonId);

    return (
        <LessonEditorClient
            lesson={lesson}
            courseId={courseId}
            initialQuiz={quiz}
        />
    );
}
