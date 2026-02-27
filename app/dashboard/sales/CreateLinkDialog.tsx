'use client';

import { useState } from 'react';
import { createPaymentLink } from './actions';
import { Plus, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CreateLinkDialog({ courses }: { courses: any[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        const res = await createPaymentLink(null, formData);
        setLoading(false);
        if (res?.success) {
            setIsOpen(false);
            router.refresh();
        } else {
            alert(res?.message || 'Error');
        }
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors gap-2"
            >
                <Plus className="h-4 w-4" /> Nuevo Enlace
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md bg-background rounded-lg shadow-lg p-6 space-y-4 animate-in fade-in zoom-in-95">
                <h3 className="text-lg font-semibold">Crear Enlace de Pago</h3>

                <form action={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Seleccionar Curso</label>
                        <select name="courseId" required className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                            {courses.map(c => (
                                <option key={c.id} value={c.id}>{c.title} (${c.price})</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Tag de Vendedora (Opcional)</label>
                        <input
                            name="sellerTag"
                            placeholder="Ej. MARIA_VENTAS"
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                        <p className="text-[10px] text-muted-foreground">Útil para rastrear quién realizó la venta.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Enlace al Grupo de WhatsApp (Opcional)</label>
                        <input
                            name="whatsappLink"
                            placeholder="https://chat.whatsapp.com/..."
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                        <p className="text-[10px] text-muted-foreground">El alumno será redirigido aquí tras el pago.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Precio Especial (Opcional)</label>
                        <input
                            name="priceOverride"
                            type="number"
                            step="0.01"
                            placeholder="Dejar vacío para usar precio del curso"
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-md transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                        >
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                            Crear Enlace
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
