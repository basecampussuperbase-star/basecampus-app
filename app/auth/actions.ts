'use server';

import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

export async function requestPasswordReset(email: string) {
    const supabase = await createClient();
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || 'unknown';

    // 1. Check Rate Limit
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // We use the admin/service_role client implicitly via server actions if configured? 
    // Actually createClient() uses user session. We need to check the attempts table.
    // Since RLS denies public/anon, we might need a Service Role client or 
    // we can use a permissive policy if we want ANYone to be able to insert tracking.
    // APPROACH: Let's use a function or just allow insert for anon but NO select.
    // Better: Use `supabase.rpc` if possible, or just standard insert if policy allows.
    // WAIT: RLS for `password_reset_attempts` is empty (deny all). 
    // We need to allow the Server Action to read/write. 
    // In Next.js Server Actions with `createClient` (auth-helpers/ssr), it acts as the user (or anon).
    // So we need RLS policies on `password_reset_attempts` to allow anon inserts?
    // User cannot select to see other's attempts.
    // SECURE WAY: Use `supabase-admin` (Service Role) here. 
    // BUT we don't have SERVICE_KEY in client env usually (it's in .env.local).
    // Let's assume we can set a policy: "Anon can insert" and "Anon can select own email?" -> No, email isn't auth'd.

    // ALTERNATIVE: Use a simple RLS `true` for insert, but `false` for select.
    // Then we can't count previous attempts securely without a Service Role or a Postgres Function.

    // LET'S USE A POSTGRES FUNCTION for the check + insert to be atomic and secure.
    // It's cleaner. But for speed, I will use `supabase.from` and assume we add a policy or use service role.
    // I will use `createClient` but I'll add a policy to the migration to allow Anon Insert/Select for this table strictly for this feature?
    // Use of Service Role is better. capturing process.env.SUPABASE_SERVICE_ROLE_KEY if available.
    // If not, I'll restrict RLS to: "Select count where email = input_email".

    // Simpler for this environment: verify limit via standard query (requires Select policy for Anon on that table).
    // Let's update migration in next step if needed. 
    // For now, let's write the action assuming we can query.

    const { count, error: countError } = await supabase
        .from('password_reset_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('email', email)
        .gte('created_at', oneDayAgo);

    if (countError) {
        // If RLS fails, we might fail open or closed. Let's fail closed.
        console.error('Rate limit check failed:', countError);
        return { success: false, error: 'Error verificando límites. Intenta más tarde.' };
    }

    if (count !== null && count >= 3) {
        return { success: false, error: 'Has excedido el límite de 3 intentos diarios. Por favor espera 24 horas.' };
    }

    // 2. Insert Attempt
    await supabase.from('password_reset_attempts').insert({
        email,
        ip_address: ip
    });

    // 3. Send Reset Email
    // origin is needed for callback
    // We can get origin from headers properly in Next.js?
    const origin = headersList.get('origin') || 'http://localhost:3000';
    const redirectTo = `${origin}/auth/callback?next=/update-password`;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
    });

    if (resetError) {
        console.error(resetError);
        // Supabase specific error handling
        if (resetError.message.includes('rate limit')) {
            return { success: false, error: 'Has excedido el límite de seguridad de correos de nuestra plataforma. Por favor espera unos minutos antes de intentar de nuevo.' };
        }
        return { success: false, error: resetError.message };
    }

    return { success: true };
}
