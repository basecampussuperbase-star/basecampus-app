'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createModule(courseId: string, title: string) {
    const supabase = await createClient();

    // Get current max position
    const { data: existingModules } = await supabase
        .from('modules')
        .select('position')
        .eq('course_id', courseId)
        .order('position', { ascending: false })
        .limit(1);

    const newPosition = (existingModules?.[0]?.position || 0) + 1;

    const { error } = await supabase.from('modules').insert({
        course_id: courseId,
        title: title,
        position: newPosition,
    });

    if (error) {
        console.error('Error creating module:', error);
        throw new Error('Failed to create module');
    }

    revalidatePath(`/dashboard/courses/${courseId}`);
}

export async function createLesson(moduleId: string, title: string, courseId: string) {
    const supabase = await createClient();

    // Get current max position for lessons in this module
    const { data: existingLessons } = await supabase
        .from('lessons')
        .select('position')
        .eq('module_id', moduleId)
        .order('position', { ascending: false })
        .limit(1);

    const newPosition = (existingLessons?.[0]?.position || 0) + 1;

    const { error } = await supabase.from('lessons').insert({
        module_id: moduleId,
        title: title,
        position: newPosition,
        content: '', // Empty initially
        is_free: false,
    });

    if (error) {
        console.error('Error creating lesson:', error);
        throw new Error('Failed to create lesson');
    }

    revalidatePath(`/dashboard/courses/${courseId}`);
}

export async function updateLesson(lessonId: string, courseId: string, data: any) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('lessons')
        .update(data)
        .eq('id', lessonId);

    if (error) {
        console.error('Error updating lesson:', error);
        throw new Error('Failed to update lesson');
    }

    revalidatePath(`/dashboard/courses/${courseId}`);
    revalidatePath(`/dashboard/courses/${courseId}/lessons/${lessonId}`);
}

export async function toggleCoursePublication(courseId: string, isPublished: boolean) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('courses')
        .update({ published: isPublished })
        .eq('id', courseId);

    if (error) {
        console.error('Error updating course publication:', error);
        throw new Error('Failed to update course publication');
    }

    revalidatePath(`/dashboard/courses/${courseId}`);
    revalidatePath('/dashboard/courses'); // Update list view as well
}

export async function updateCourseLastUpdated(courseId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('courses')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', courseId);

    if (error) {
        console.error('Error updating course timestamp:', error);
        throw new Error('Failed to update course timestamp');
    }

    revalidatePath(`/dashboard/courses/${courseId}`);
    revalidatePath(`/learn/${courseId}`);
}

export async function updateCourse(courseId: string, data: {
    title?: string;
    description?: string;
    price?: number;
    modality?: string;
    address?: string;
    schedule_info?: string;
    is_live?: boolean;
    max_students?: number;
    room_id?: string;
    meeting_platform?: string;
    image_url?: string;
    logo_url?: string;
    features?: string[];
}) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('courses')
        .update(data)
        .eq('id', courseId);


    if (error) {
        console.error('Error updating course:', error);
        throw new Error(error.message);
    }


    revalidatePath(`/dashboard/courses/${courseId}`);
    revalidatePath('/dashboard/courses');
}

export async function getMentorStats(userId: string) {
    const supabase = await createClient();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

    // Get Limit
    const { data: profile } = await supabase
        .from('profiles')
        .select('monthly_hours_limit')
        .eq('id', userId)
        .single();

    const limit = profile?.monthly_hours_limit || 32;

    // Get Usage
    const { data: bookings } = await supabase
        .from('bookings')
        .select('start_time, end_time')
        .eq('user_id', userId)
        .neq('status', 'cancelled')
        .gte('start_time', startOfMonth)
        .lte('end_time', endOfMonth);

    let usedHours = 0;
    bookings?.forEach(b => {
        const start = new Date(b.start_time).getTime();
        const end = new Date(b.end_time).getTime();
        usedHours += (end - start) / (1000 * 60 * 60);
    });

    return { limit, usedHours };
}

export async function saveCourseSchedule(courseId: string, sessions: any[], isOnlineLive: boolean = false) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    console.log('--- saveCourseSchedule START ---');
    console.log('Parameters:', { courseId, sessionsCount: sessions.length, isOnlineLive });

    if (!user) {
        console.error('User not authenticated');
        return { success: false, error: 'No autenticado' };
    }

    // Verify Ownership
    const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('mentor_id')
        .eq('id', courseId)
        .single();

    if (courseError || !course) {
        console.error('Error fetching course or not found:', courseError);
        return { success: false, error: 'Curso no encontrado.' };
    }

    if (course.mentor_id !== user.id) {
        console.error('Permission denied. User:', user.id, 'Mentor:', course.mentor_id);
        return { success: false, error: 'No tienes permisos para modficar este curso.' };
    }

    // 1. Calculate impact (Optional, logging for now)
    try {
        const { limit, usedHours } = await getMentorStats(user.id);
        let newHours = 0;
        sessions.forEach(s => {
            const start = new Date(`${s.date}T${s.startTime}`).getTime();
            const end = new Date(`${s.date}T${s.endTime}`).getTime();
            newHours += (end - start) / (1000 * 60 * 60);
        });
        console.log(`Hours Check: Limit=${limit}, Used=${usedHours}, New=${newHours}`);
    } catch (err) {
        console.warn('Error calculating stats (ignoring for save):', err);
    }

    // 2. Sync Bookings (Delete ALL for this course and Re-insert)
    // Simpler and more robust approach for now: Delete all pending/confirmed bookings for this course and re-create them.
    // This avoids "sync" complexity with IDs.
    // However, if we want to keep "past" bookings, we should filter by date.
    // For this debugging phase, let's keep it simple: Replace Schedule.

    console.log('Deleting existing bookings for course:', courseId);
    const { error: deleteError } = await supabase
        .from('bookings')
        .delete()
        .eq('course_id', courseId);

    if (deleteError) {
        console.error('Error deleting old sessions:', deleteError);
        return { success: false, error: 'Error al limpiar agenda anterior: ' + deleteError.message };
    }

    // 3. Insert New Sessions
    if (sessions.length > 0) {
        const bookingsData = sessions.map(s => ({
            user_id: user.id,
            course_id: courseId,
            room_id: isOnlineLive ? null : (s.roomId || null), // Ensure null if undefined
            start_time: new Date(`${s.date}T${s.startTime}`).toISOString(),
            end_time: new Date(`${s.date}T${s.endTime}`).toISOString(),
            status: isOnlineLive ? 'confirmed' : 'pending',
            notes: `Sesión de Curso: ${s.date}`
        }));

        console.log('Inserting new bookings:', bookingsData.length);

        const { error: insertError } = await supabase.from('bookings').insert(bookingsData);

        if (insertError) {
            console.error('Error inserting bookings:', insertError);
            return { success: false, error: 'Error al guardar sesiones: ' + insertError.message };
        }
    }

    // 4. Update Course Schedule Info (Summary Text)
    // Fetch fresh bookings to be sure
    const { data: allBookings, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .eq('course_id', courseId)
        .neq('status', 'cancelled')
        .order('start_time', { ascending: true });

    if (fetchError) console.error('Error fetching back bookings:', fetchError);

    const finalSessions = allBookings || [];

    // Format: "YYYY-MM-DD (HH:mm - HH:mm)"
    const scheduleSummary = finalSessions.map(b => {
        // Handle potentially different timezones or just use string manipulation for simplicity if consistent
        // The DB returns ISO strings (UTC). We want to display reasonably.
        // For simplicity, we'll strip the time part from ISO.
        const d = new Date(b.start_time);
        const dateStr = d.toISOString().split('T')[0];
        const startStr = d.toISOString().split('T')[1].slice(0, 5);
        const endStr = new Date(b.end_time).toISOString().split('T')[1].slice(0, 5);
        return `${dateStr} (${startStr} - ${endStr})`;
    }).join('\n');

    console.log('Updating schedule_info summary:', scheduleSummary);

    const { error: updateError } = await supabase
        .from('courses')
        .update({ schedule_info: scheduleSummary })
        .eq('id', courseId);

    if (updateError) {
        console.error('Error updating schedule_info:', updateError);
    }

    revalidatePath(`/dashboard/courses/${courseId}`);
    revalidatePath('/dashboard/courses');

    console.log('--- saveCourseSchedule SUCCESS ---');
    return { success: true, message: 'Cronograma guardado correctamente.' };
}

export async function getCourseSchedule(courseId: string) {
    const supabase = await createClient();

    const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('course_id', courseId)
        .neq('status', 'cancelled')
        .order('start_time', { ascending: true });

    if (error) {
        console.error('Error fetching schedule:', error);
        return [];
    }

    return bookings.map(b => ({
        id: b.id, // Use booking ID
        date: new Date(b.start_time).toISOString().split('T')[0],
        startTime: new Date(b.start_time).toTimeString().slice(0, 5),
        endTime: new Date(b.end_time).toTimeString().slice(0, 5),
        roomId: b.room_id
    }));
}
