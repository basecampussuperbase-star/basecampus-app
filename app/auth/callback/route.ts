import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/dashboard';
    const error = searchParams.get('error');

    if (error) {
        console.error('Auth error from Supabase:', error, searchParams.get('error_description'));
        return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${error}`);
    }

    if (code) {
        const supabase = await createClient();
        const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
        if (!sessionError) {
            return NextResponse.redirect(`${origin}${next}`);
        }
        console.error('Session exchange error:', sessionError);
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}

