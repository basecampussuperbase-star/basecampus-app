'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Save, Plus, Trash2, FileText, Video, Link as LinkIcon, Loader2, ListChecks, Layout } from 'lucide-react';
import Link from 'next/link';
import { updateLesson } from '../../../actions';
import QuizBuilder from '../../../QuizBuilder';

interface LessonEditorClientProps {
    lesson: any;
    courseId: string;
    initialQuiz: any;
}

export default function LessonEditorClient({ lesson, courseId, initialQuiz }: LessonEditorClientProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'content' | 'quiz'>('content');

    // Content State
    const [title, setTitle] = useState(lesson.title);
    const [description, setDescription] = useState(lesson.content || '');
    const [videoUrl, setVideoUrl] = useState(lesson.video_url || '');
    const [pdfUrl, setPdfUrl] = useState(lesson.pdf_url || '');
    const [isFree, setIsFree] = useState(lesson.is_free);
    const [resources, setResources] = useState<any[]>(lesson.resources || []);
    const [saving, setSaving] = useState(false);

    const handleAddResource = () => {
        setResources([...resources, { label: 'Nuevo Recurso', url: '' }]);
    };

    const handleResourceChange = (index: number, field: string, value: string) => {
        const newResources = [...resources];
        newResources[index] = { ...newResources[index], [field]: value };
        setResources(newResources);
    };

    const handleRemoveResource = (index: number) => {
        const newResources = resources.filter((_, i) => i !== index);
        setResources(newResources);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateLesson(lesson.id, courseId, {
                title,
                content: description,
                video_url: videoUrl,
                pdf_url: pdfUrl,
                is_free: isFree,
                resources
            });
            alert('Lección guardada correctamente');
            router.refresh();
        } catch (error) {
            alert('Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 pb-32">

            {/* Header with Tabs */}
            <div className="flex flex-col gap-6 border-b pb-4">
                <div className="flex items-center gap-4">
                    <Link href={`/dashboard/courses/${courseId}`} className="p-2 hover:bg-muted rounded-full">
                        <ChevronLeft className="h-5 w-5" />
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold">Editar Lección</h1>
                        <p className="text-muted-foreground text-sm">Gestiona el contenido y materiales.</p>
                    </div>
                    {activeTab === 'content' && (
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 bg-zinc-900 text-white px-6 py-2 rounded-full hover:bg-zinc-700 disabled:opacity-50 transition-all font-medium"
                        >
                            {saving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
                            Guardar Cambios
                        </button>
                    )}
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('content')}
                        className={`flex items-center gap-2 pb-2 px-2 border-b-2 transition-colors ${activeTab === 'content' ? 'border-primary font-bold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    >
                        <Layout className="h-4 w-4" /> Contenido
                    </button>
                    <button
                        onClick={() => setActiveTab('quiz')}
                        className={`flex items-center gap-2 pb-2 px-2 border-b-2 transition-colors ${activeTab === 'quiz' ? 'border-primary font-bold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    >
                        <ListChecks className="h-4 w-4" /> Cuestionario
                    </button>
                </div>
            </div>

            {/* TAB CONTENT */}
            {activeTab === 'content' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left Column: Main Info */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Título de la Lección</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full p-3 bg-muted/30 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-lg"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Descripción / Notas</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={6}
                                className="w-full p-3 bg-muted/30 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                                placeholder="Instrucciones para el estudiante..."
                            />
                        </div>
                    </div>

                    {/* Right Column: Key Assets */}
                    <div className="space-y-6">
                        <div className="p-5 border rounded-xl bg-card shadow-sm space-y-4">
                            <h3 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
                                <Video className="h-4 w-4" /> Video
                            </h3>
                            <div className="space-y-2">
                                <label className="text-xs font-medium">URL del Video (YouTube/Vimeo)</label>
                                <input
                                    type="text"
                                    value={videoUrl}
                                    onChange={(e) => setVideoUrl(e.target.value)}
                                    placeholder="https://..."
                                    className="w-full p-2 bg-background border rounded-md text-sm"
                                />
                            </div>
                        </div>

                        <div className="p-5 border rounded-xl bg-card shadow-sm space-y-4">
                            <h3 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
                                <FileText className="h-4 w-4" /> Material PDF
                            </h3>
                            <div className="space-y-2">
                                <label className="text-xs font-medium">URL del PDF</label>
                                <input
                                    type="text"
                                    value={pdfUrl}
                                    onChange={(e) => setPdfUrl(e.target.value)}
                                    placeholder="https://..."
                                    className="w-full p-2 bg-background border rounded-md text-sm"
                                />
                            </div>
                        </div>

                        <div className="p-5 border rounded-xl bg-card shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
                                    <LinkIcon className="h-4 w-4" /> Botones / Recursos
                                </h3>
                                <button onClick={handleAddResource} className="text-primary hover:bg-primary/10 p-1 rounded">
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                                {resources.map((res, idx) => (
                                    <div key={idx} className="flex flex-col gap-2 p-3 bg-muted/50 rounded-lg relative group">
                                        <button
                                            onClick={() => handleRemoveResource(idx)}
                                            className="absolute top-2 right-2 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                        <input
                                            placeholder="Texto del botón (ej: Descargar Plantilla)"
                                            value={res.label}
                                            onChange={(e) => handleResourceChange(idx, 'label', e.target.value)}
                                            className="bg-transparent text-sm font-medium focus:outline-none border-b border-transparent focus:border-primary"
                                        />
                                        <input
                                            placeholder="https://..."
                                            value={res.url}
                                            onChange={(e) => handleResourceChange(idx, 'url', e.target.value)}
                                            className="bg-transparent text-xs text-muted-foreground focus:outline-none border-b border-transparent focus:border-primary"
                                        />
                                    </div>
                                ))}
                                {resources.length === 0 && (
                                    <p className="text-xs text-muted-foreground italic text-center py-2">Sin recursos extra</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="max-w-3xl">
                    <QuizBuilder lessonId={lesson.id} courseId={courseId} existingQuiz={initialQuiz} />
                </div>
            )}
        </div>
    );
}
