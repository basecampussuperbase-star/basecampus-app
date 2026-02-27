'use client';

import { useState } from 'react';
import { Loader2, Mail, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { requestPasswordReset } from '@/app/auth/actions';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const result = await requestPasswordReset(email);

        if (!result.success) {
            setError(result.error || 'Error desconocido.');
            setLoading(false);
        } else {
            setSuccess(true);
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-background">
            <div className="w-full max-w-md space-y-8 bg-card p-10 rounded-2xl border border-border shadow-sm">
                <Link href="/login" className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver al login
                </Link>

                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight">Recuperar Contraseña</h1>
                    <p className="text-sm text-muted-foreground">Te enviaremos un enlace para restablecerla.</p>
                </div>

                {success ? (
                    <div className="flex flex-col items-center justify-center space-y-4 py-6 animate-in fade-in zoom-in">
                        <div className="h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-8 w-8" />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="font-semibold text-lg">¡Correo Enviado!</h3>
                            <p className="text-sm text-muted-foreground">
                                Revisa tu bandeja de entrada (y spam) en <b>{email}</b>.
                                <br />Haz clic en el enlace para crear una nueva contraseña.
                            </p>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleReset} className="space-y-6">
                        <div className="bg-yellow-50 text-yellow-800 p-3 rounded-md text-xs flex gap-2 items-start border border-yellow-200">
                            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                            <p>
                                Por razones de seguridad, tienes un máximo de <strong>3 intentos diarios</strong>.
                                Si excedes este límite, deberás esperar 24 horas.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none" htmlFor="email">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="nombre@ejemplo.com"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm pl-10 focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md font-medium">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-2.5 px-4 rounded-full text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Enviar Enlace'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

