'use client';

import { useState } from 'react';
import { Plus, GripVertical, Video, FileText, Loader2, Users } from 'lucide-react';
import { createModule, createLesson } from './actions';
import { assignModuleInstructor } from './module-actions';
import { useRouter } from 'next/navigation';

interface Lesson {
    id: string;
    title: string;
    video_url?: string;
    position: number;
}

interface Module {
    id: string;
    title: string;
    lessons: Lesson[];
    position: number;
    instructor_id?: string | null;
}

interface SyllabusEditorProps {
    courseId: string;
    initialModules: Module[];
    instructors?: any[]; // Passed from parent
    isOwner?: boolean;
    currentUserId?: string;
}

export default function SyllabusEditor({ courseId, initialModules, instructors = [], isOwner = true, currentUserId }: SyllabusEditorProps) {
    const [modules, setModules] = useState<Module[]>(initialModules);
    const [isAddingModule, setIsAddingModule] = useState(false);
    const [newModuleTitle, setNewModuleTitle] = useState('');
    const [loadingModule, setLoadingModule] = useState(false);

    // State to track which module is adding a lesson
    const [addingLessonToModuleId, setAddingLessonToModuleId] = useState<string | null>(null);
    const [newLessonTitle, setNewLessonTitle] = useState('');
    const [loadingLesson, setLoadingLesson] = useState(false);

    const handleAddModule = async () => {
        if (!newModuleTitle.trim()) return;
        setLoadingModule(true);
        try {
            await createModule(courseId, newModuleTitle);
            setNewModuleTitle('');
            setIsAddingModule(false);
        } catch (error) {
            alert('Error al crear el módulo');
        } finally {
            setLoadingModule(false);
        }
    };

    const handleAddLesson = async (moduleId: string) => {
        if (!newLessonTitle.trim()) return;
        setLoadingLesson(true);
        try {
            await createLesson(moduleId, newLessonTitle, courseId);
            setNewLessonTitle('');
            setAddingLessonToModuleId(null);
        } catch (error) {
            alert('Error al crear la lección');
        } finally {
            setLoadingLesson(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Temario</h3>
                {!isAddingModule && isOwner && (
                    <button
                        onClick={() => setIsAddingModule(true)}
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                        <Plus className="h-4 w-4" /> Nuevo Módulo
                    </button>
                )}
            </div>

            {/* Add Module Form */}
            {isAddingModule && (
                <div className="border border-dashed border-primary/50 bg-primary/5 rounded-lg p-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                    <label className="text-sm font-medium">Título del Módulo</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Ej. Introducción"
                            value={newModuleTitle}
                            onChange={(e) => setNewModuleTitle(e.target.value)}
                            autoFocus
                        />
                        <button
                            onClick={handleAddModule}
                            disabled={loadingModule}
                            className="h-9 px-4 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                        >
                            {loadingModule ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar'}
                        </button>
                        <button
                            onClick={() => setIsAddingModule(false)}
                            disabled={loadingModule}
                            className="h-9 px-3 text-muted-foreground hover:text-foreground text-sm"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {/* Modules List */}
            <div className="space-y-4">
                {initialModules.length === 0 && !isAddingModule ? (
                    <div className="text-center p-8 border border-dashed rounded-lg bg-muted/20">
                        <p className="text-muted-foreground">Este curso aún no tiene contenido.</p>
                        <button
                            onClick={() => setIsAddingModule(true)}
                            className="mt-2 text-sm text-primary hover:underline font-medium"
                        >
                            ¡Crea el primer módulo!
                        </button>
                    </div>
                ) : (
                    initialModules.map((module) => (
                        <div key={module.id} className="border border-border rounded-lg bg-card overflow-hidden">

                            <div className="flex items-center justify-between p-4 bg-muted/30 border-b border-border">
                                <div className="flex items-center gap-3">
                                    <div className="p-1 cursor-grab active:cursor-grabbing hover:bg-muted rounded">
                                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <span className="font-medium block">{module.title}</span>
                                        {/* Instructor Assignment */}
                                        {isOwner && instructors.length > 0 && (
                                            <div className="mt-1 flex items-center gap-2">
                                                <Users className="h-3 w-3 text-muted-foreground" />
                                                <select
                                                    className="text-xs bg-transparent border-none text-muted-foreground hover:text-foreground focus:ring-0 cursor-pointer py-0 pl-0 pr-6"
                                                    value={module.instructor_id || ''}
                                                    onChange={async (e) => {
                                                        const newId = e.target.value || null;
                                                        await assignModuleInstructor(module.id, newId);
                                                        // Optimistic update
                                                        setModules(mods => mods.map(m => m.id === module.id ? { ...m, instructor_id: newId } : m));
                                                    }}
                                                >
                                                    <option value="">Asignado a: Mí (Organizador)</option>
                                                    {instructors.map(i => (
                                                        <option key={i.instructor.id} value={i.instructor.id}>
                                                            Asignado a: {i.instructor.full_name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                        {!isOwner && module.instructor_id && (
                                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                                <Users className="h-3 w-3" />
                                                Instructor: {instructors.find(i => i.instructor.id === module.instructor_id)?.instructor.full_name || 'Desconocido'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>


                            <div className="p-2 space-y-1 bg-card">
                                {module.lessons.map((lesson) => (
                                    <div key={lesson.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 group transition-colors">
                                        <div className="flex items-center gap-3 ml-8">
                                            {lesson.video_url ? <Video className="h-4 w-4 text-blue-500" /> : <FileText className="h-4 w-4 text-orange-500" />}
                                            <span className="text-sm">{lesson.title}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            {(isOwner || module.instructor_id === currentUserId) && (
                                                <a
                                                    href={`/dashboard/courses/${courseId}/lessons/${lesson.id}`}
                                                    className="text-xs text-primary bg-primary/10 px-2 py-1 rounded hover:bg-primary/20 transition-colors font-medium opacity-100"
                                                >
                                                    Editar Contenido
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {/* Add Lesson Form/Button */}
                                {addingLessonToModuleId === module.id ? (
                                    <div className="ml-8 mt-2 p-3 border border-dashed border-border rounded-md bg-muted/10 space-y-2 animate-in fade-in">
                                        <input
                                            type="text"
                                            className="w-full h-8 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                            placeholder="Título de la lección..."
                                            value={newLessonTitle}
                                            onChange={(e) => setNewLessonTitle(e.target.value)}
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleAddLesson(module.id);
                                                if (e.key === 'Escape') setAddingLessonToModuleId(null);
                                            }}
                                        />
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => setAddingLessonToModuleId(null)}
                                                className="text-xs text-muted-foreground hover:text-foreground"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={() => handleAddLesson(module.id)}
                                                disabled={loadingLesson}
                                                className="bg-primary text-primary-foreground text-xs px-3 py-1 rounded-md hover:bg-primary/90 disabled:opacity-50"
                                            >
                                                {loadingLesson ? 'Guardando...' : 'Agregar'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    (isOwner || module.instructor_id === currentUserId) && (
                                        <button
                                            onClick={() => setAddingLessonToModuleId(module.id)}
                                            className="w-full py-2 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:bg-muted/50 rounded-md border-t border-dashed border-border mt-2 transition-colors"
                                        >
                                            <Plus className="h-3 w-3" /> Agregar Lección
                                        </button>
                                    )
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
