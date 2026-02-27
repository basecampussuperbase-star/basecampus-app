'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function processEnrollment(linkId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Check if user is logged in
    if (!user) {
        // Redirect to login/register with returnTo
        // We use a special query param to indicate they are coming from a payment link
        redirect(`/login?returnTo=/enroll/${linkId}`);
    }

    // 2. Fetch Link Details
    const { data: link } = await supabase
        .from('payment_links')
        .select('*')
        .eq('id', linkId)
        .single();

    if (!link || !link.active) {
        return { success: false, error: 'Enlace no válido o inactivo.' };
    }

    // 3. Create Enrollment (Simulate Payment Success)
    // Upsert to avoid Unique Violation if already enrolled
    // check if already enrolled
    const { data: existing } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', link.course_id)
        .single();

    if (existing) {
        // Already enrolled, just redirect
        // Could update payment info if upgrading, but for now just redirect
        await supabase.rpc('increment_link_views', { link_id: linkId }); // Count as conversion/view? Maybe increment sales only if new? 
        // Let's increment sales count ONLY if new enrollment
    } else {
        const { error } = await supabase.from('course_enrollments').insert({
            user_id: user.id,
            course_id: link.course_id,
            payment_link_id: link.id,
            amount_paid: link.price_override || 0, // Should fetch course price if override is null, but for now 0 or override
            payment_status: 'paid'
        });

        if (error) {
            console.error(error);
            return { success: false, error: 'Error al procesar inscripción.' };
        }

        // Increment Sales Count
        await supabase.rpc('increment_sales_count', { link_id: linkId });
    }

    return { success: true, whatsappLink: link.whatsapp_group_link, courseId: link.course_id };
}

export async function incrementViews(linkId: string) {
    const supabase = await createClient();
    await supabase.rpc('increment_link_views', { link_id: linkId });
}
