'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getQuizForLesson(lessonId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('quizzes')
        .select(`
            *,
            questions (
                *,
                options (*)
            )
        `)
        .eq('lesson_id', lessonId)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
        console.error('Error fetching quiz:', error);
    }

    // Sort questions and options
    if (data) {
        data.questions.sort((a: any, b: any) => a.position - b.position);
        data.questions.forEach((q: any) => {
            q.options.sort((a: any, b: any) => a.created_at.localeCompare(b.created_at));
        });
    }

    return data;
}

export async function createQuizForLesson(lessonId: string, courseId: string, title: string) {
    const supabase = await createClient();

    const { data: quiz, error } = await supabase
        .from('quizzes')
        .insert({
            course_id: courseId,
            lesson_id: lessonId,
            title: title,
            type: 'lesson'
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating quiz:', error);
        throw new Error(error.message);
    }
    revalidatePath(`/dashboard/courses/${courseId}/lessons/${lessonId}`);
    return quiz;
}

export async function addQuestion(quizId: string, text: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('questions')
        .insert({ quiz_id: quizId, question_text: text })
        .select()
        .single();

    if (error) throw new Error(error.message);
}

export async function deleteQuestion(questionId: string) {
    const supabase = await createClient();
    await supabase.from('questions').delete().eq('id', questionId);
}

export async function addOption(questionId: string, text: string, isCorrect: boolean) {
    const supabase = await createClient();
    await supabase.from('options').insert({
        question_id: questionId,
        option_text: text,
        is_correct: isCorrect
    });
}

export async function deleteOption(optionId: string) {
    const supabase = await createClient();
    await supabase.from('options').delete().eq('id', optionId);
}

export async function setCorrectOption(questionId: string, optionId: string) {
    const supabase = await createClient();

    // 1. Reset all options for this question to false
    await supabase
        .from('options')
        .update({ is_correct: false })
        .eq('question_id', questionId);

    // 2. Set the selected option to true
    await supabase
        .from('options')
        .update({ is_correct: true })
        .eq('id', optionId);
}

export async function submitQuizAttempt(quizId: string, score: number, passed: boolean, answers: any) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    const { error } = await supabase
        .from('user_quiz_attempts')
        .insert({
            user_id: user.id,
            quiz_id: quizId,
            score,
            passed,
            answers
        });

    if (error) {
        console.error('Error submitting quiz:', error);
        throw new Error('Failed to submit quiz');
    }

    revalidatePath('/learn');
}
