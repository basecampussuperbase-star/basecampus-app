'use client';

import Link from 'next/link';

export default function AuthCodeError() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8 text-center">
                <h1 className="text-4xl font-bold tracking-tight text-destructive">Error de Autenticación</h1>
                <p className="mt-2 text-lg text-muted-foreground">
                    No pudimos verificar tu sesión. El enlace puede haber expirado o ser inválido.
                </p>
                <div className="mt-6">
                    <Link href="/login" className="text-sm font-medium text-primary hover:underline">
                        Volver al inicio de sesión
                    </Link>
                </div>
            </div>
        </div>
    );
}
