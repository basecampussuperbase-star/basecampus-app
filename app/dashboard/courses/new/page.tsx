'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ChevronLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function CreateCoursePage() {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('0.00');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                alert('Debes iniciar sesión');
                return;
            }

            const { data, error } = await supabase
                .from('courses')
                .insert([
                    {
                        title,
                        description,
                        price: parseFloat(price),
                        mentor_id: user.id
                    }
                ])
                .select()
                .single();

            if (error) throw error;

            // Redirect to edit page to add modules/lessons
            // router.push(`/dashboard/courses/${data.id}/edit`);
            alert('Curso creado exitosamente (Simulación - Redirigiendo...)');
            router.push('/dashboard/courses');

        } catch (error: any) {
            alert('Error creando el curso: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/courses"
                    className="p-2 rounded-full hover:bg-muted transition-colors"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Link>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Crear Nuevo Curso</h2>
                    <p className="text-muted-foreground">Comienza definiendo los detalles básicos.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 bg-card p-8 rounded-xl border border-border shadow-sm">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Título del Curso</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ej. Finanzas Personales para Emprendedores"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Descripción</label>
                        <textarea
                            required
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="¿Qué aprenderán tus estudiantes?"
                            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Precio (USD)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                required
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-7 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">La plataforma cobra una comisión del 25-35% según tu plan.</p>
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <Link
                        href="/dashboard/courses"
                        className="px-4 py-2 text-sm font-medium transition-colors hover:text-primary"
                    >
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 rounded-full bg-primary px-8 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Guardando...' : <><Save className="h-4 w-4" /> Guardar y Continuar</>}
                    </button>
                </div>
            </form>
        </div>
    );
}
