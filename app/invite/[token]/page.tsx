import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { acceptInvite } from './actions';
import { CheckCircle, XCircle, ArrowRight, LogIn } from 'lucide-react';
import Link from 'next/link';

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { token } = await params;

    // 1. Verify Token Validity (Peek)
    const { data: inviteData } = await supabase
        .rpc('get_invite_details', { _token: token });

    const invite = inviteData && inviteData.length > 0 ? inviteData[0] : null;

    if (!invite) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center space-y-4">
                    <XCircle className="h-12 w-12 text-red-500 mx-auto" />
                    <h1 className="text-xl font-bold text-gray-900">Invitación No Encontrada</h1>
                    <p className="text-gray-500">
                        Este enlace no es válido o ya ha sido utilizado.
                        <br />
                        Si acabas de aceptar la invitación, es probable que ya tengas acceso.
                    </p>
                    <div className="flex flex-col gap-2">
                        <Link href="/dashboard/courses" className="inline-block bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors">
                            Ir a Mis Cursos
                        </Link>
                        <Link href="/" className="inline-block text-sm text-gray-500 hover:underline">
                            Volver al Inicio
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // 2. If valid but not logged in -> Prompt Login
    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center space-y-6">
                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-blue-600">
                        <LogIn className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Te han invitado a colaborar</h1>
                        <p className="text-gray-500 mt-2">
                            Has sido invitado a formar parte del equipo de instructores del curso: <br />
                            <span className="font-semibold text-gray-900">{invite.course_title}</span>
                        </p>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-sm text-amber-800">
                        Para aceptar la invitación, necesitas iniciar sesión o crear una cuenta.
                    </div>

                    <Link
                        href={`/login?returnTo=/invite/${token}`}
                        className="block w-full bg-primary text-primary-foreground py-2 rounded-md font-medium hover:bg-primary/90 transition-colors"
                    >
                        Iniciar Sesión para Aceptar
                    </Link>
                    <p className="text-xs text-gray-400">
                        ¿No tienes cuenta? <Link href={`/register?returnTo=/invite/${token}`} className="text-primary hover:underline">Regístrate aquí</Link>
                    </p>
                </div>
            </div>
        );
    }

    // 3. User logged in -> Attempt Accept
    const result = await acceptInvite(token);

    if (result.success) {
        redirect(`/dashboard/courses/${result.courseId}`);
    } else {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center space-y-4">
                    <XCircle className="h-12 w-12 text-red-500 mx-auto" />
                    <h1 className="text-xl font-bold text-gray-900">Estado de la Invitación</h1>
                    <p className="text-gray-500">{result.error}</p>
                    <p className="text-sm text-gray-400">Si el error dice que "ya eres instructor", revisa tu dashboard.</p>
                    <Link href="/dashboard/courses" className="inline-block bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors">
                        Ir a Mis Cursos
                    </Link>
                </div>
            </div>
        );
    }
}
