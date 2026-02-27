

import { createClient } from '@/lib/supabase/server';
import { ChevronLeft, ExternalLink, Users } from 'lucide-react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import SyllabusEditor from '../SyllabusEditor';
import PublishButton from '../PublishButton';
import CourseSettings from '../CourseSettings';

export default async function EditCoursePage({ params }: { params: Promise<{ courseId: string }> }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    const { courseId } = await params;

    // Fetch course details
    const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

    if (courseError || !course) {
        notFound();
    }

    // Fetch modules and lessons
    const { data: modules, error: modulesError } = await supabase
        .from('modules')
        .select(`
      *,
      lessons (*)
    `)
        .eq('course_id', course.id)
        .order('position', { ascending: true });

    const sortedModules = modules?.map(mod => ({
        ...mod,
        lessons: mod.lessons.sort((a: any, b: any) => a.position - b.position)
    })) || [];

    // Fetch enrolled students count
    const { count: studentsCount } = await supabase
        .from('course_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', course.id);

    // Fetch Instructors
    const { data: instructors } = await supabase
        .from('course_instructors')
        .select('*, instructor:profiles(*)')
        .eq('course_id', course.id);

    // Fetch Invites
    const { data: invites } = await supabase
        .from('course_invites')
        .select('*')
        .eq('course_id', course.id);

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard/courses"
                        className="p-2 rounded-full hover:bg-muted transition-colors"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Editar Contenido</h2>
                        <p className="text-muted-foreground">{course.title}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Link
                        href={`/learn/${course.id}`}
                        target="_blank"
                        className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border border-input bg-background hover:bg-muted transition-colors text-foreground"
                    >
                        <ExternalLink className="h-3 w-3" />
                        Ver como Estudiante
                    </Link>
                    <Link
                        href={`/dashboard/courses/${course.id}/students`}
                        className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                        <Users className="h-3 w-3" />
                        Estudiantes ({studentsCount || 0})
                    </Link>
                    <PublishButton courseId={course.id} isPublished={course.published} />
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Main Content: Syllabus */}
                <div className="lg:col-span-2 space-y-6">
                    <SyllabusEditor
                        courseId={course.id}
                        initialModules={sortedModules as any[]}
                        instructors={instructors || []}
                        isOwner={course.mentor_id === user.id}
                        currentUserId={user.id}
                    />
                </div>

                {/* Sidebar: Course Settings */}
                {/* Sidebar: Course Settings */}
                <div className="space-y-6">
                    <CourseSettings
                        course={course}
                        instructors={instructors || []}
                        invites={invites || []}
                        ownerId={course.mentor_id}
                        currentUserId={user.id}
                    />
                </div>
            </div>
        </div>
    );
}
