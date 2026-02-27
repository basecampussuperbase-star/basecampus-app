'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createPaymentLink(prevState: any, formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { message: 'No autenticado' };

    const courseId = formData.get('courseId') as string;
    const sellerTag = formData.get('sellerTag') as string;
    const whatsappLink = formData.get('whatsappLink') as string;
    const priceOverride = formData.get('priceOverride');

    const { error } = await supabase.from('payment_links').insert({
        course_id: courseId,
        mentor_id: user.id,
        seller_tag: sellerTag || null,
        whatsapp_group_link: whatsappLink || null,
        price_override: priceOverride ? parseFloat(priceOverride as string) : null
    });

    if (error) {
        console.error('Create Link Error:', error);
        return { message: error.message || 'Error al crear enlace de pago', details: error };
    }

    revalidatePath('/dashboard/sales');
    return { success: true, message: 'Enlace creado exitosamente' };
}

export async function toggleLinkStatus(linkId: string, isActive: boolean) {
    const supabase = await createClient();
    await supabase.from('payment_links').update({ active: isActive }).eq('id', linkId);
    revalidatePath('/dashboard/sales');
}

export async function deleteLink(linkId: string) {
    const supabase = await createClient();
    await supabase.from('payment_links').delete().eq('id', linkId);
    revalidatePath('/dashboard/sales');
}

export async function recordView(linkId: string) {
    const supabase = await createClient();
    await supabase.rpc('increment_link_views', { link_id: linkId });
}
