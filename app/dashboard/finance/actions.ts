'use server';

import { createClient } from '@/lib/supabase/server';

export async function getLatestExchangeRate() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('exchange_rates')
        .select('*')
        .order('effective_date', { ascending: false })
        .limit(1)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found (first fetch)
        console.error('Error fetching exchange rate:', error);
        return null;
    }

    return data;
}

export async function updateExchangeRate(rate: number) {
    const supabase = await createClient();

    // Check if user is admin is BEST practice
    // For now we rely on RLS but let's double check role if possible for better errors
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    // We fetch profile to check role
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') {
        return { success: false, error: 'Solo administradores pueden cambiar la tasa.' };
    }

    const { error } = await supabase.from('exchange_rates').insert({
        rate: rate,
        created_by: user.id
    });

    if (error) {
        console.error('Error updating rate:', error);
        return { success: false, error: 'Error al actualizar tasa.' };
    }

    return { success: true };
}
