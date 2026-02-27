'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function inviteInstructor(courseId: string, email: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Unauthorized' };

    // Check if user is course owner
    const { data: course } = await supabase
        .from('courses')
        .select('mentor_id')
        .eq('id', courseId)
        .single();

    if (!course || course.mentor_id !== user.id) {
        return { success: false, error: 'Only the course owner can invite instructors.' };
    }

    // Check if email is already invited
    const { data: existingInvite } = await supabase
        .from('course_invites')
        .select('id')
        .eq('course_id', courseId)
        .eq('email', email)
        .single();

    if (existingInvite) {
        return { success: false, error: 'This email is already invited.' };
    }

    // Check if user already exists in profiles (to add directly? For now let's just use invites for flow consistency)
    // Actually, if they exist, we could add them directly to course_instructors if we wanted, 
    // but the invite flow is safer/politer.

    // Create Invite
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const { data: newInvite, error } = await supabase
        .from('course_invites')
        .insert({
            course_id: courseId,
            email,
            token,
            role: 'collaborator'
        })
        .select()
        .single();

    if (error) {
        console.error('Error inviting:', error);
        return { success: false, error: `Error sending invite: ${error.message} (${error.code})` };
    }

    revalidatePath(`/dashboard/courses/${courseId}`);
    return {
        success: true,
        message: 'Invitación enviada correctamente.',
        invite: newInvite
    };
}

export async function removeInstructor(courseId: string, instructorId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Unauthorized' };

    // Check owner
    const { data: course } = await supabase
        .from('courses')
        .select('mentor_id')
        .eq('id', courseId)
        .single();

    if (!course || course.mentor_id !== user.id) {
        return { success: false, error: 'Unauthorized' };
    }

    const { error } = await supabase
        .from('course_instructors')
        .delete()
        .eq('course_id', courseId)
        .eq('instructor_id', instructorId);

    if (error) return { success: false, error: 'Error removing instructor.' };

    revalidatePath(`/dashboard/courses/${courseId}`);
    return { success: true };
}

export async function revokeInvite(inviteId: string, courseId: string) { // Added courseId param for revalidation
    const supabase = await createClient();
    // ... auth checks ...
    const { error } = await supabase.from('course_invites').delete().eq('id', inviteId);
    if (error) return { success: false, error: 'Error.' };
    revalidatePath(`/dashboard/courses/${courseId}`);
    return { success: true };
}
