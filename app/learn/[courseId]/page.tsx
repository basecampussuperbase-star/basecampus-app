import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Play } from 'lucide-react';
import Link from 'next/link';

export default async function CourseWelcomePage({ params }: { params: Promise<{ courseId: string }> }) {
    const supabase = await createClient();
    const { courseId } = await params;

    // Find the first lesson to direct the user
    const { data: firstModule } = await supabase
        .from('modules')
        .select('lessons(id)')
        .eq('course_id', courseId)
        .order('position')
        .limit(1)
        .single();

    const firstLessonId = firstModule?.lessons?.[0]?.id;

    // Fetch course details with mentor data
    const { data: course } = await supabase
        .from('courses')
        .select(`
            *,
            mentor:profiles(*)
        `)
        .eq('id', courseId)
        .single();

    // Cast mentor to any to avoid strict type issues for now, or define interface
    const mentor = course?.mentor as any;

    return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center max-w-3xl mx-auto space-y-12">
            <div className="flex flex-col items-center space-y-6">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                    <div className="relative h-24 w-24 bg-card rounded-full flex items-center justify-center border-4 border-background shadow-xl">
                        <Play className="h-10 w-10 text-primary ml-1" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h2 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
                        ¡Bienvenido al Curso!
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-lg mx-auto leading-relaxed">
                        Estás a punto de comenzar tu aprendizaje. Prepara tu material y busca un lugar cómodo.
                    </p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 w-full text-left">
                {/* Course Schedule Info */}
                {course && (course.modality === 'in-person' || course.modality === 'hybrid' || (course.modality === 'online' && course.is_live)) && (
                    <div className="bg-gradient-to-br from-card to-secondary/10 border border-border rounded-2xl p-6 shadow-sm flex flex-col h-full">
                        <div className="flex items-center gap-3 mb-6 border-b border-border/50 pb-4">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                <span className="text-xl">📅</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg leading-none">Cronograma</h3>
                                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mt-1">
                                    {course.is_live ? "Sesiones En Vivo" : "Clases Presenciales"}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6 flex-1">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2">Horario</p>
                                <div className="text-sm bg-background/50 p-3 rounded-lg border border-border/50 font-medium whitespace-pre-wrap">
                                    {course.schedule_info || (
                                        /* Fallback: Fetch bookings if summary is missing */
                                        async () => {
                                            const { data: bookings } = await supabase
                                                .from('bookings')
                                                .select('start_time, end_time')
                                                .eq('course_id', courseId)
                                                .neq('status', 'cancelled')
                                                .order('start_time', { ascending: true });

                                            if (bookings && bookings.length > 0) {
                                                return bookings.map((b: any) => {
                                                    const d = new Date(b.start_time);
                                                    const dateStr = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
                                                    const startStr = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                                                    const endStr = new Date(b.end_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                                                    return `${dateStr} (${startStr} - ${endStr})`;
                                                }).join('\n');
                                            }
                                            return "Por definir con el mentor.";
                                        }
                                    )()}
                                </div>
                            </div>

                            <div>
                                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2">Ubicación</p>
                                <div className="text-sm font-medium">
                                    {course.modality === 'online' ? (
                                        <div className="space-y-2">
                                            <p className="flex items-center gap-2 text-foreground">
                                                💻 Online Vía <span className="capitalize font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">{course.meeting_platform || 'Zoom'}</span>
                                            </p>
                                            <p className="text-xs text-muted-foreground bg-yellow-50 text-yellow-800 p-3 rounded-lg border border-yellow-200 leading-snug">
                                                ⚠️ Los enlaces se enviarán por WhatsApp antes de cada clase.
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="flex items-center gap-2">
                                            📍 <span>{course.address || 'Sede Principal BASE'}</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Instructor Profile */}
                {mentor && (
                    <div className="bg-gradient-to-br from-card to-secondary/10 border border-border rounded-2xl p-6 shadow-sm flex flex-col h-full">
                        <div className="flex items-center gap-4 mb-6 border-b border-border/50 pb-4">
                            <div className="relative h-14 w-14 rounded-full overflow-hidden border-2 border-primary/20 bg-muted">
                                {mentor.avatar_url ? (
                                    <img src={mentor.avatar_url} alt={mentor.full_name} className="object-cover w-full h-full" />
                                ) : (
                                    <div className="flex items-center justify-center w-full h-full bg-primary/10 text-primary font-bold text-xl">
                                        {mentor.full_name?.[0] || 'I'}
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-0.5">Tu Instructor</p>
                                <h3 className="font-bold text-lg leading-none">{mentor.full_name}</h3>
                                {mentor.headline && <p className="text-sm text-primary font-medium mt-1">{mentor.headline}</p>}
                            </div>
                        </div>

                        <div className="space-y-6 flex-1 flex flex-col">
                            <div className="text-sm text-muted-foreground leading-relaxed flex-1">
                                {mentor.bio || "Experto en la materia listo para guiarte."}
                            </div>

                            {/* Actions */}
                            <div className="grid gap-3 pt-2">
                                {mentor.whatsapp && (
                                    <a
                                        href={`https://wa.me/${mentor.whatsapp.replace(/[^0-9]/g, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-2.5 rounded-xl font-bold transition-all shadow-sm hover:shadow-md"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                                        Contactar por WhatsApp
                                    </a>
                                )}
                                <div className="flex gap-2 justify-center">
                                    {mentor.website && (
                                        <a href={mentor.website} target="_blank" className="p-2 text-muted-foreground hover:text-primary transition-colors bg-background rounded-lg border border-input">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></svg>
                                        </a>
                                    )}
                                    {mentor.linkedin_url && (
                                        <a href={mentor.linkedin_url} target="_blank" className="p-2 text-muted-foreground hover:text-primary transition-colors bg-background rounded-lg border border-input">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" /></svg>
                                        </a>
                                    )}
                                    {mentor.instagram_url && (
                                        <a href={mentor.instagram_url} target="_blank" className="p-2 text-muted-foreground hover:text-primary transition-colors bg-background rounded-lg border border-input">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {firstLessonId ? (
                <Link
                    href={`/learn/${courseId}/lessons/${firstLessonId}`}
                    className="group relative inline-flex items-center justify-center px-8 py-3 font-semibold text-white transition-all duration-200 bg-primary rounded-full hover:bg-primary/90 hover:scale-105 shadow-lg hover:shadow-primary/30"
                >
                    <span className="mr-2">Comenzar Clase</span>
                    <Play className="w-5 h-5 fill-current" />
                </Link>
            ) : (
                <div className="p-6 bg-yellow-50 text-yellow-800 rounded-xl border border-yellow-200 shadow-sm max-w-lg">
                    <p className="font-semibold text-lg flex items-center justify-center gap-2 mb-2">
                        🚫 No hay lecciones disponibles
                    </p>
                    <p className="opacity-90">El mentor aún no ha publicado contenido para este curso.</p>
                </div>
            )}
        </div>
    );
}
