import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Mail, Search, CheckCircle2, Clock } from 'lucide-react';

export default async function GlobalStudentsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    // 1. Fetch courses owned by mentor
    const { data: myCourses } = await supabase
        .from('courses')
        .select('id, title')
        .eq('mentor_id', user.id);

    const courseIds = myCourses?.map(c => c.id) || [];

    if (courseIds.length === 0) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                No tienes cursos creados aún.
            </div>
        );
    }

    // 2. Fetch enrollments for these courses
    const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select(`
            *,
            student:profiles!student_id(*),
            course:courses(*)
        `)
        .in('course_id', courseIds)
        .order('enrolled_at', { ascending: false });

    // 3. Helper to determine status
    // TODO: Ideally we should calculate real progress here. 
    // For now, let's assume if there is a 'completed_at' in enrollment (if we had it) or just show 'En Curso'
    // Actually, we can fetch progress if we want, but for MVP let's show status based on a simple logic or 
    // we need to fetch lesson completions to calculate % like we did in the course specific view.

    // Let's fetch ALL completions for these students in these courses to be accurate.
    // Optimization: This might be heavy if many students. 
    // For this MVP, let's use the same logic as the specific student list: fetch completions count.

    // We can join with lesson_completions? No, complex query.
    // Let's just fetch all lessons count per course first.

    const { data: allLessons } = await supabase
        .from('lessons')
        .select('id, module_id, modules(course_id)')
        .in('modules.course_id', courseIds);

    // Map courseId -> totalLessons
    const courseLessonCounts: Record<string, number> = {};
    allLessons?.forEach((l: any) => {
        const cId = l.modules.course_id;
        courseLessonCounts[cId] = (courseLessonCounts[cId] || 0) + 1;
    });

    // Fetch completions for these enrollments
    // We need completions where course_id is in myCourses.
    // But completions table doesn't have course_id directly, it links to lesson.
    // We can fetch completions where lesson_id is in allLessons.
    const lessonIds = allLessons?.map(l => l.id) || [];

    // If no lessons, no progress to track
    let studentCompletions: any[] = [];
    if (lessonIds.length > 0) {
        const { data: comps } = await supabase
            .from('lesson_completions')
            .select('student_id, lesson_id')
            .in('lesson_id', lessonIds);
        studentCompletions = comps || [];
    }

    // Helper to get progress
    const getStudentProgress = (studentId: string, courseId: string) => {
        const total = courseLessonCounts[courseId] || 0;
        if (total === 0) return 0;

        // Find lessons for this course
        const courseLessonIds = allLessons?.filter((l: any) => l.modules.course_id === courseId).map(l => l.id) || [];

        // Count completions for this student in this course
        const completed = studentCompletions.filter(c =>
            c.student_id === studentId && courseLessonIds.includes(c.lesson_id)
        ).length;

        return Math.round((completed / total) * 100);
    };


    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Mis Alumnos</h1>
                    <p className="text-muted-foreground">Gestión global de estudiantes inscritos en tus programas.</p>
                </div>
            </div>

            <div className="border rounded-lg bg-card overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted text-muted-foreground font-medium border-b border-border">
                        <tr>
                            <th className="px-6 py-3">Estudiante</th>
                            <th className="px-6 py-3">Programa / Curso</th>
                            <th className="px-6 py-3">Fecha Inscripción</th>
                            <th className="px-6 py-3 text-center">Estado</th>
                            <th className="px-6 py-3 text-right">Progreso</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {enrollments?.map((enrollment: any) => {
                            const progress = getStudentProgress(enrollment.student_id, enrollment.course_id);
                            const isCompleted = progress === 100;

                            return (
                                <tr key={enrollment.id} className="hover:bg-muted/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                                                {enrollment.student.avatar_url ? (
                                                    <img src={enrollment.student.avatar_url} alt="" className="h-full w-full object-cover" />
                                                ) : (
                                                    <span className="text-xs font-bold text-primary">
                                                        {enrollment.student.full_name?.[0] || 'A'}
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium">{enrollment.student.full_name || 'Estudiante'}</p>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Mail className="h-3 w-3" /> {enrollment.student.email}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-medium text-foreground/80">{enrollment.course.title}</span>
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground">
                                        {new Date(enrollment.enrolled_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${isCompleted ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'}`}>
                                            {isCompleted ? (
                                                <>
                                                    <CheckCircle2 className="h-3 w-3" /> Completado
                                                </>
                                            ) : (
                                                <>
                                                    <Clock className="h-3 w-3" /> En Curso
                                                </>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="font-bold">{progress}%</span>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
                {(!enrollments || enrollments.length === 0) && (
                    <div className="p-12 text-center text-muted-foreground">
                        No hay alumnos inscritos en tus cursos todavía.
                    </div>
                )}
            </div>
        </div>
    );
}
