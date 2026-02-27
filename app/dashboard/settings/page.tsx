import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ProfileSettingsForm from './ProfileSettingsForm';
import { User, Globe, Linkedin, Phone } from 'lucide-react';

export default async function SettingsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Configuración del Perfil</h2>
                <p className="text-muted-foreground">Administra tu información pública visible para los estudiantes.</p>
            </div>

            <div className="grid gap-6">
                <ProfileSettingsForm profile={profile} />
            </div>
        </div>
    );
}
