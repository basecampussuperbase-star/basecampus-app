'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function assignModuleInstructor(moduleId: string, instructorId: string | null) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Unauthorized' };

    // Update module
    const { error } = await supabase
        .from('modules')
        .update({ instructor_id: instructorId })
        .eq('id', moduleId);

    if (error) {
        console.error('Error assigning module instructor:', error);
        return { success: false, error: 'Error assigning instructor.' };
    }

    revalidatePath('/dashboard/courses'); // Refresh to show assignment
    return { success: true };
}
