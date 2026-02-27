import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, PlayCircle, ChevronLeft, User, MessageCircle } from 'lucide-react';

export default async function LearnLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ courseId: string }>;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { courseId } = await params;

    if (!user) redirect('/login');

    // Fetch Course & Syllabus with Mentor Profile
    const { data: course } = await supabase
        .from('courses')
        .select('*, mentor:profiles(*)')
        .eq('id', courseId)
        .single();

    if (!course) notFound();

    // If course is not published and user is not the mentor, deny access
    if (!course.published && course.mentor_id !== user.id) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4">
                <h1 className="text-2xl font-bold">Curso no disponible</h1>
                <p className="text-muted-foreground">Este curso aún no ha sido publicado.</p>
                <Link href="/dashboard" className="text-primary hover:underline">Volver al Dashboard</Link>
            </div>
        )
    }

    const { data: modules } = await supabase
        .from('modules')
        .select('*, lessons(*), instructor:profiles(*)')
        .eq('course_id', courseId)
        .order('position');

    // Sort modules and lessons
    const sortedModules = modules?.map(mod => ({
        ...mod,
        lessons: mod.lessons.sort((a: any, b: any) => a.position - b.position)
    })) || [];


    return (
        <div className="flex h-screen bg-background">
            {/* Sidebar - Syllabus */}
            <aside className="w-80 border-r border-border bg-card flex flex-col h-full z-10 hidden md:flex">
                <div className="p-4 border-b border-border">
                    <Link href="/dashboard" className="flex items-center gap-2 text-xs text-muted-foreground mb-4 hover:text-foreground">
                        <ChevronLeft className="h-3 w-3" /> Volver
                    </Link>
                    <h1 className="font-bold leading-tight">{course.title}</h1>
                    <div className="mt-2 h-1 w-full bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-[0%] transition-all duration-500" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">0% Completado</p>
                    <div className="mt-4 border-t pt-4 border-border/50">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold flex items-center gap-1">
                            Actualizado: {new Date(course.updated_at).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {sortedModules.map(module => (
                        <div key={module.id}>
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                                {module.title}
                                {module.instructor && (
                                    <span className="block text-[10px] text-primary font-normal normal-case mt-0.5">
                                        Instructor: {module.instructor.full_name.split(' ')[0]}
                                    </span>
                                )}
                            </h3>
                            <div className="space-y-1">
                                {module.lessons.map((lesson: any) => (
                                    <Link
                                        key={lesson.id}
                                        href={`/learn/${courseId}/lessons/${lesson.id}`}
                                        className="flex items-center gap-3 p-2 rounded-md hover:bg-muted text-sm transition-colors"
                                    >
                                        {lesson.is_completed ? (
                                            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                        ) : (
                                            <PlayCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                        )}
                                        <span className="line-clamp-1">{lesson.title}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-background/50 relative flex flex-col">
                {/* Instructor Banner */}
                <div className="bg-card border-b border-border px-4 md:px-8 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm min-h-[70px]">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full overflow-hidden bg-muted border border-border flex-shrink-0">
                            {course.mentor?.avatar_url ? (
                                <img src={course.mentor.avatar_url} alt={course.mentor.full_name || 'Instructor'} className="h-full w-full object-cover" />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center text-muted-foreground bg-primary/10 text-primary font-bold">
                                    {course.mentor?.full_name?.[0] || <User className="h-5 w-5" />}
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                                    Organizado por
                                </span>
                            </div>
                            <p className="font-bold text-sm leading-tight mt-0.5">{course.mentor?.full_name || 'Academia BASE'}</p>
                        </div>
                    </div>
                    {/* ... (WhatsApp button remains) ... */}
                    {course.mentor?.whatsapp && (
                        <a
                            href={`https://wa.me/${course.mentor.whatsapp.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-[#25D366] text-white px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-bold hover:bg-[#128C7E] transition-all shadow-sm hover:shadow-md active:scale-95"
                        >
                            <MessageCircle className="h-4 w-4" />
                            <span className="hidden md:inline">Contacto WhatsApp</span>
                            <span className="md:hidden">WhatsApp</span>
                        </a>
                    )}
                </div>

                <div className="flex-1">
                    {children}
                </div>
            </main>
        </div>
    );
}
