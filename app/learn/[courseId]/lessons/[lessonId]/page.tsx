import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { FileText, Download, Play, CheckCircle } from 'lucide-react';
import { getEmbedUrl, getPdfEmbedUrl } from '@/lib/videoUtils';
import { getQuizForLesson } from '@/app/dashboard/courses/quiz-actions'; // Import action
import QuizPlayer from '@/app/learn/QuizPlayer'; // Import component

export default async function LessonPage({
    params
}: {
    params: Promise<{ courseId: string; lessonId: string }>
}) {
    const supabase = await createClient();
    const { courseId, lessonId } = await params;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    const { data: lesson } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single();

    if (!lesson) notFound();

    // Fetch quiz for this lesson
    const quiz = await getQuizForLesson(lessonId);

    if (!lesson) notFound();

    const embedUrl = getEmbedUrl(lesson.video_url);
    const pdfEmbedUrl = getPdfEmbedUrl(lesson.pdf_url);

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 md:px-8 space-y-8">
            {/* Main Media Area (Video or PDF) */}
            {(embedUrl || (!embedUrl && lesson.pdf_url)) && (
                <div className="rounded-xl overflow-hidden bg-black aspect-video shadow-2xl flex items-center justify-center group relative ring-1 ring-border/50">
                    {embedUrl ? (
                        <iframe
                            src={embedUrl}
                            className="w-full h-full"
                            allowFullScreen
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        />
                    ) : lesson.pdf_url ? (
                        <iframe
                            src={pdfEmbedUrl || lesson.pdf_url}
                            className="w-full h-full bg-white"
                            title="Material PDF"
                        >
                            <p className="text-white">Tu navegador no puede mostrar este PDF. <a href={lesson.pdf_url} className="underline">Descárgalo aquí</a>.</p>
                        </iframe>
                    ) : null}
                </div>
            )}

            <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-1 space-y-6">
                    <div>
                        <h1 className="text-2xl font-bold mb-2">{lesson.title}</h1>
                        <div className="prose dark:prose-invert max-w-none text-muted-foreground">
                            {/* We should ideally strictly sanitize HTML here if using markdown */}
                            <p className="whitespace-pre-wrap">{lesson.content}</p>
                        </div>
                    </div>
                </div>

                {/* Resources Sidebar (Desktop) / Bottom (Mobile) */}
                <div className="w-full md:w-72 space-y-6">

                    {/* Actions */}
                    <div className="p-4 rounded-xl border bg-card space-y-3">
                        <button className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2 rounded-lg font-medium hover:bg-primary/90">
                            <CheckCircle className="h-4 w-4" /> Marcar como Vista
                        </button>
                        {lesson.pdf_url && (
                            <a
                                href={lesson.pdf_url}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full flex items-center justify-center gap-2 border border-input bg-background py-2 rounded-lg font-medium hover:bg-muted"
                            >
                                <Download className="h-4 w-4" /> Descargar PDF
                            </a>
                        )}
                    </div>

                    {/* Extra Resources */}
                    {lesson.resources && lesson.resources.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Recursos</h4>
                            {lesson.resources.map((res: any, idx: number) => (
                                <a
                                    key={idx}
                                    href={res.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block p-3 rounded-lg border bg-card hover:bg-indigo-50 dark:hover:bg-indigo-950/20 border-l-4 border-l-indigo-500 transition-all group"
                                >
                                    <span className="text-sm font-medium group-hover:text-primary flex items-center justify-between">
                                        {res.label}
                                        <Download className="h-3 w-3 opacity-50" />
                                    </span>
                                </a>
                            ))}
                        </div>
                    )}

                    {/* Quiz Section */}
                    {quiz && (
                        <div className="mt-8 pt-8 border-t">
                            <h2 className="text-xl font-bold mb-4">Evaluación</h2>
                            <QuizPlayer quiz={quiz} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
