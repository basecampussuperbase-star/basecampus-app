import Link from 'next/link';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function CoursesPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // 1. Fetch courses where user is OWNER
    const { data: ownedCourses, error: ownedError } = await supabase
        .from('courses')
        .select('*')
        .eq('mentor_id', user.id)
        .order('created_at', { ascending: false });

    if (ownedError) {
        return <div>Error cargando cursos propios.</div>;
    }

    // 2. Fetch courses where user is INSTRUCTOR (via course_instructors)
    const { data: sharedCoursesData, error: sharedError } = await supabase
        .from('course_instructors')
        .select('course:courses(*)')
        .eq('instructor_id', user.id);

    if (sharedError) {
        return <div>Error cargando cursos compartidos.</div>;
    }

    // Extract courses from the join relation and cast to any for now to avoid complex TS mapping
    const sharedCourses = (sharedCoursesData?.map(item => item.course).filter(Boolean) || []) as any[];

    // Merge and deduplicate (just in case)
    const allCourses = [...(ownedCourses || []), ...sharedCourses].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Use 'allCourses' for rendering
    const courses = allCourses;



    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Mis Cursos</h2>
                    <p className="text-muted-foreground">Gestiona tu contenido educativo.</p>
                </div>
                <Link
                    href="/dashboard/courses/new"
                    className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Nuevo Curso
                </Link>
            </div>

            {/* 1. Owned Courses */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    Mis Cursos
                    <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {ownedCourses?.length || 0}
                    </span>
                </h3>
                <div className="rounded-md border border-border bg-card">
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Título</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Estado</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Modalidad</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Precio</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Creado</th>
                                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {ownedCourses?.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                            No tienes cursos creados aún.
                                        </td>
                                    </tr>
                                ) : (
                                    ownedCourses?.map((course) => (
                                        <tr key={course.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                            <td className="p-4 align-middle font-medium">
                                                <Link href={`/dashboard/courses/${course.id}`} className="hover:underline">
                                                    {course.title}
                                                </Link>
                                            </td>
                                            <td className="p-4 align-middle">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${course.published
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                                                    }`}>
                                                    {course.published ? 'Publicado' : 'Borrador'}
                                                </span>
                                            </td>
                                            <td className="p-4 align-middle">
                                                <div className="flex items-center gap-2">
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${course.modality === 'online'
                                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                                        : course.modality === 'in-person'
                                                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                                                            : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
                                                        }`}>
                                                        {course.modality === 'online' ? 'Online' : course.modality === 'in-person' ? 'Presencial' : 'Híbrido'}
                                                    </span>
                                                    {course.is_live && (
                                                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-300 animate-pulse">
                                                            En Vivo
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle">${course.price}</td>
                                            <td className="p-4 align-middle">{new Date(course.created_at).toLocaleDateString()}</td>
                                            <td className="p-4 align-middle text-right">
                                                <Link
                                                    href={`/dashboard/courses/${course.id}`}
                                                    className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
                                                >
                                                    Gestionar
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* 2. Shared Courses (Collaborations) */}
            {sharedCourses.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-border">
                    <h3 className="text-lg font-semibold flex items-center gap-2 text-blue-600">
                        Colaboraciones
                        <span className="text-xs font-normal text-white bg-blue-600 px-2 py-0.5 rounded-full">
                            {sharedCourses.length}
                        </span>
                    </h3>
                    <div className="rounded-md border border-blue-200 bg-blue-50/50">
                        <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm">
                                <thead className="[&_tr]:border-b border-blue-100">
                                    <tr className="border-b border-blue-100 transition-colors hover:bg-blue-100/50">
                                        <th className="h-12 px-4 text-left align-middle font-medium text-blue-900">Título</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-blue-900">Estado</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-blue-900">Modalidad</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-blue-900">Organizador</th>
                                        <th className="h-12 px-4 text-right align-middle font-medium text-blue-900">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {sharedCourses.map((course) => (
                                        <tr key={course.id} className="border-b border-blue-100 transition-colors hover:bg-blue-100/50">
                                            <td className="p-4 align-middle font-medium text-blue-950">
                                                <Link href={`/dashboard/courses/${course.id}`} className="hover:underline">
                                                    {course.title}
                                                </Link>
                                            </td>
                                            <td className="p-4 align-middle">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${course.published
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {course.published ? 'Publicado' : 'Borrador'}
                                                </span>
                                            </td>
                                            <td className="p-4 align-middle text-blue-900">
                                                {course.modality === 'online' ? 'Online' : course.modality === 'in-person' ? 'Presencial' : 'Híbrido'}
                                            </td>
                                            <td className="p-4 align-middle text-blue-900 text-xs">
                                                {/* We don't have mentor name loaded here, could add if needed */}
                                                Invited
                                            </td>
                                            <td className="p-4 align-middle text-right">
                                                <Link
                                                    href={`/dashboard/courses/${course.id}`}
                                                    className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                                                >
                                                    Colaborar
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
