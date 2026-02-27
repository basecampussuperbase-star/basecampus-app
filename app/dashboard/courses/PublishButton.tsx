'use client';

import { useState } from 'react';
import { Loader2, Globe, EyeOff, RefreshCw } from 'lucide-react';
import { toggleCoursePublication, updateCourseLastUpdated } from './actions';

interface PublishButtonProps {
    courseId: string;
    isPublished: boolean;
}

export default function PublishButton({ courseId, isPublished }: PublishButtonProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleToggle = async () => {
        setIsLoading(true);
        try {
            if (isPublished) {
                // Course is already published, users might want to "Update" timestamp or "Unpublish"
                // For this requirement, we'll treat the main click as "Update"
                // In a fuller UI, this might be a dropdown. adapting to user request:
                // "Click publish again to update"
                const confirmUpdate = confirm('¿Quieres notificar que el curso ha sido ACTUALIZADO? (Esto actualizará la fecha para los estudiantes). \n\nPara DESPUBLICAR (Borrador), cancela esta acción y usa la opción de configuración.');

                if (confirmUpdate) {
                    await updateCourseLastUpdated(courseId);
                    alert('Curso actualizado exitosamente.');
                } else {
                    // Check if they want to unpublish
                    if (confirm('¿Entonces prefieres DESPUBLICAR el curso y volverlo Borrador?')) {
                        await toggleCoursePublication(courseId, false);
                    }
                }
            } else {
                // Publish Flow
                if (confirm('¿Estás seguro que quieres PUBLICAR este curso? Será visible para los estudiantes.')) {
                    await toggleCoursePublication(courseId, true);
                }
            }
        } catch (error) {
            alert(`Error en la acción.`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleToggle}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${isPublished
                    ? 'bg-green-100 text-green-800 border border-green-200 hover:bg-green-200'
                    : 'bg-zinc-900 text-white hover:bg-zinc-700'
                }`}
        >
            {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
            ) : isPublished ? (
                <>
                    <RefreshCw className="h-3 w-3" />
                    Publicado (Actualizar)
                </>
            ) : (
                <>
                    <EyeOff className="h-3 w-3" />
                    Borrador (Publicar)
                </>
            )}
        </button>
    );
}
