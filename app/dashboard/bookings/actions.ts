'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getRooms() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .order('capacity', { ascending: false });

    if (error) throw new Error('Failed to fetch rooms');
    return data;
}

export async function createBookingRequest(data: {
    courseId: string;
    roomId: string;
    startTime: string; // ISO string
    endTime: string; // ISO string
    notes?: string;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    // Basic validation: Check if room is already booked in that slot
    // This is a "nice to have" check, usually DB constraint handles it too, 
    // but explicit check helps return better error.

    // Check overlapping confirmed bookings
    const { data: conflicts } = await supabase
        .from('bookings')
        .select('id')
        .eq('room_id', data.roomId)
        .eq('status', 'confirmed') // Only check confirmed for blocking? Or pending too? Usually confirmed.
        .or(`and(start_time.lte.${data.endTime},end_time.gte.${data.startTime})`);

    if (conflicts && conflicts.length > 0) {
        // throw new Error('La sala ya está ocupada en ese horario.');
        // Actually, let's let them request even if busy? No, better block.
        return { success: false, error: 'La sala seleccionada ya tiene una reserva confirmada en ese horario.' };
    }

    const { error } = await supabase.from('bookings').insert({
        user_id: user.id,
        course_id: data.courseId,
        room_id: data.roomId,
        start_time: data.startTime,
        end_time: data.endTime,
        status: 'pending', // Always request first
        notes: data.notes
    });

    if (error) {
        console.error('Booking error:', error);
        return { success: false, error: 'Error al procesar la solicitud.' };
    }

    revalidatePath('/dashboard/bookings');
    revalidatePath(`/dashboard/courses/${data.courseId}`);
    return { success: true };
}

export async function createBatchBookingRequests(requests: {
    courseId: string;
    roomId: string;
    startTime: string;
    endTime: string;
    notes?: string;
}[]) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');
    if (!requests || requests.length === 0) return { success: false, error: 'No requests provided' };

    // 1. Check all conflicts first
    // Optimization: Check date range of batch? For now, simple loop check is safer for logic.
    // Or we can trust the insert to fail if we had exclusion constraints (which we don't yet).

    // Let's do a quick pre-check for conflicts for ANY of the requests
    // Proper way: `WHERE (room_id = .. AND (...)) OR (room_id = .. AND (...))`
    // For simplicity, we loop checks.

    for (const req of requests) {
        const { data: conflicts } = await supabase
            .from('bookings')
            .select('id')
            .eq('room_id', req.roomId)
            .eq('status', 'confirmed')
            .or(`and(start_time.lte.${req.endTime},end_time.gte.${req.startTime})`);

        if (conflicts && conflicts.length > 0) {
            return { success: false, error: `Conflicto de horario para la sesión iniciada en ${req.startTime}` };
        }
    }

    // 2. Insert all
    const bookingsToInsert = requests.map(req => ({
        user_id: user.id,
        course_id: req.courseId,
        room_id: req.roomId,
        start_time: req.startTime,
        end_time: req.endTime,
        status: 'pending',
        notes: req.notes
    }));

    const { error } = await supabase.from('bookings').insert(bookingsToInsert);

    if (error) {
        console.error('Batch booking error:', error);
        return { success: false, error: 'Error al procesar las solicitudes en lote.' };
    }

    // 3. Sync Schedule (assuming all same course)
    const courseId = requests[0].courseId;
    if (courseId) {
        await syncCourseScheduleInfo(courseId, supabase);
        revalidatePath(`/dashboard/courses/${courseId}`);
    }

    revalidatePath('/dashboard/bookings');
    return { success: true };
}


async function syncCourseScheduleInfo(courseId: string, supabase: any) {
    // Fetch all active bookings for this course
    const { data: bookings } = await supabase
        .from('bookings')
        .select('start_time, end_time')
        .eq('course_id', courseId)
        .neq('status', 'cancelled'); // Include pending and confirmed

    if (!bookings || bookings.length === 0) {
        // No bookings left, clear schedule info
        await supabase.from('courses').update({ schedule_info: '' }).eq('id', courseId);
        return;
    }

    // Sort by date
    bookings.sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    // Format
    const scheduleSummary = bookings.map((b: any) => {
        const date = b.start_time.split('T')[0];
        const start = b.start_time.split('T')[1].substring(0, 5);
        const end = b.end_time.split('T')[1].substring(0, 5);
        return `${date} (${start} - ${end})`;
    }).join('\n');

    await supabase.from('courses').update({ schedule_info: scheduleSummary }).eq('id', courseId);
}

export async function deleteBooking(bookingId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // Get booking to know course_id
    const { data: booking } = await supabase.from('bookings').select('course_id, user_id').eq('id', bookingId).single();

    if (!booking) return { success: false, error: 'Reserva no encontrada' };
    if (booking.user_id !== user.id) return { success: false, error: 'No autorizado' };

    const { error } = await supabase.from('bookings').delete().eq('id', bookingId);

    if (error) {
        console.error('Delete error:', error);
        return { success: false, error: 'Error al eliminar la reserva' };
    }

    if (booking.course_id) {
        await syncCourseScheduleInfo(booking.course_id, supabase);
        revalidatePath(`/dashboard/courses/${booking.course_id}`);
    }

    revalidatePath('/dashboard/bookings');
    return { success: true };
}

export async function updateBookingRequest(bookingId: string, data: {
    roomId: string;
    startTime: string;
    endTime: string;
    notes?: string;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // Get current booking
    const { data: booking } = await supabase.from('bookings').select('course_id, user_id').eq('id', bookingId).single();
    if (!booking) return { success: false, error: 'Reserva no encontrada' };
    if (booking.user_id !== user.id) return { success: false, error: 'No autorizado' };

    // Check conflicts (excluding self)
    const { data: conflicts } = await supabase
        .from('bookings')
        .select('id')
        .eq('room_id', data.roomId)
        .eq('status', 'confirmed')
        .neq('id', bookingId) // Exclude self
        .or(`and(start_time.lte.${data.endTime},end_time.gte.${data.startTime})`);

    if (conflicts && conflicts.length > 0) {
        return { success: false, error: 'La sala seleccionada ya tiene una reserva confirmada en ese horario.' };
    }

    const { error } = await supabase.from('bookings').update({
        room_id: data.roomId,
        start_time: data.startTime,
        end_time: data.endTime,
        notes: data.notes,
        status: 'pending' // FORCE PENDING on edit
    }).eq('id', bookingId);

    if (error) {
        console.error('Update error:', error);
        return { success: false, error: 'Error al actualizar la reserva' };
    }

    if (booking.course_id) {
        await syncCourseScheduleInfo(booking.course_id, supabase);
        revalidatePath(`/dashboard/courses/${booking.course_id}`);
    }

    revalidatePath('/dashboard/bookings');
    return { success: true };
}
