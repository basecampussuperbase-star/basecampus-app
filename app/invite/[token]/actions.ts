'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function acceptInvite(token: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Unauthenticated' };
    }

    // Call secure RPC function
    const { data: result, error } = await supabase.rpc('accept_invite', { _token: token });

    if (error) {
        console.error('RPC Error:', error);
        return { success: false, error: 'Error inesperado al aceptar la invitación.' };
    }

    if (!result.success) {
        return { success: false, error: result.error };
    }

    return { success: true, courseId: result.course_id };
}
