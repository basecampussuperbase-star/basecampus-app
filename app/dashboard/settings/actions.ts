'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateProfile(formData: {
    full_name: string;
    headline: string;
    bio: string;
    website: string;
    linkedin_url: string;
    instagram_url: string;
    whatsapp: string;
    avatar_url?: string;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'No autorizado' };
    }

    const { error } = await supabase
        .from('profiles')
        .update({
            full_name: formData.full_name,
            headline: formData.headline,
            bio: formData.bio,
            website: formData.website,
            linkedin_url: formData.linkedin_url,
            instagram_url: formData.instagram_url,
            whatsapp: formData.whatsapp,
            avatar_url: formData.avatar_url,
        })
        .eq('id', user.id);

    if (error) {
        console.error('Error updating profile:', JSON.stringify(error, null, 2));
        return { success: false, error: error.message || 'Error al actualizar perfil' };
    }

    revalidatePath('/dashboard/settings');
    return { success: true };
}
