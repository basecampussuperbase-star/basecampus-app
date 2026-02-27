import Link from 'next/link';
import { MessageCircle, ArrowRight, CheckCircle } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ wa?: string; course?: string }> }) {
    const { wa, course } = await searchParams;

    if (!course) redirect('/dashboard');

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden text-center">
                <div className="bg-green-50 p-6 flex flex-col items-center justify-center border-b border-green-100">
                    <div className="h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle className="h-8 w-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">¡Inscripción Exitosa!</h1>
                    <p className="text-green-800 mt-2">Ya tienes acceso al curso.</p>
                </div>

                <div className="p-8 space-y-6">
                    {wa && (
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-left">
                            <h3 className="font-semibold text-blue-900 flex items-center gap-2 mb-2">
                                <MessageCircle className="h-4 w-4" /> Importante
                            </h3>
                            <p className="text-sm text-blue-800 mb-4">
                                Para recibir los enlaces de las clases en vivo y notificaciones, únete al grupo de WhatsApp.
                            </p>
                            <a
                                href={wa}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full bg-[#25D366] text-white font-bold py-3 rounded-md hover:opacity-90 transition-opacity text-center shadow-sm"
                            >
                                Unirme al Grupo de WhatsApp
                            </a>
                        </div>
                    )}

                    <div className="space-y-3">
                        <Link
                            href={`/dashboard/courses/${course}`}
                            className="block w-full bg-primary text-primary-foreground font-bold py-3 rounded-md hover:bg-primary/90 transition-opacity shadow-md"
                        >
                            Ir al Curso Ahora
                        </Link>

                        <Link href="/dashboard" className="block text-sm text-muted-foreground hover:underline">
                            Ir a mi Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
