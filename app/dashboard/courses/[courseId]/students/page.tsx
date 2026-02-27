'use client';

import { useState, useEffect, use } from 'react';
import { getCourseStudents, StudentProgress } from '../../student-actions';
import { Loader2, Search, User, Mail, Calendar, BarChart3, GraduationCap, ChevronLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function StudentsPage({ params }: { params: Promise<{ courseId: string }> }) {
    const { courseId } = use(params);
    return <StudentList courseId={courseId} />;
}

function StudentList({ courseId }: { courseId: string }) {
    const [students, setStudents] = useState<StudentProgress[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const data = await getCourseStudents(courseId);
                setStudents(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [courseId]);

    const filteredStudents = students.filter(s =>
        s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-muted-foreground" /></div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <Link
                    href={`/dashboard/courses/${courseId}`}
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
                >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Volver al Curso
                </Link>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight">Estudiantes Inscritos</h2>
                        <p className="text-sm text-muted-foreground">
                            Gestiona y monitorea el progreso de tus {students.length} alumnos.
                        </p>
                    </div>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o correo..."
                            className="w-full pl-9 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {filteredStudents.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-lg bg-muted/20">
                    <User className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-50" />
                    <h3 className="font-medium text-lg">No se encontraron estudiantes</h3>
                    <p className="text-muted-foreground text-sm">
                        {searchTerm ? 'Intenta con otra búsqueda.' : 'Aún no tienes alumnos inscritos en este curso.'}
                    </p>
                </div>
            ) : (
                <div className="border rounded-lg overflow-hidden bg-card">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                            <tr>
                                <th className="px-4 py-3">Estudiante</th>
                                <th className="px-4 py-3">Progreso</th>
                                <th className="px-4 py-3 text-center">Calif. Promedio</th>
                                <th className="px-4 py-3 text-right">Fecha Ingreso</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredStudents.map((student) => (
                                <tr key={student.user_id} className="hover:bg-muted/50 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-zinc-100 overflow-hidden relative border">
                                                {student.avatar_url ? (
                                                    <Image src={student.avatar_url} alt={student.full_name} fill className="object-cover" />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-bold">
                                                        {student.full_name?.[0] || 'U'}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-foreground">{student.full_name || 'Sin Nombre'}</p>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Mail className="h-3 w-3" /> {student.email}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 max-w-[200px]">
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs font-medium">
                                                <span>{student.progress_percentage}%</span>
                                                <span className="text-muted-foreground">{student.completed_lessons}/{student.total_lessons} Lecciones</span>
                                            </div>
                                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary transition-all duration-500"
                                                    style={{ width: `${student.progress_percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {student.average_quiz_grade !== null ? (
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${student.average_quiz_grade >= 80
                                                ? 'bg-green-100 text-green-700'
                                                : (student.average_quiz_grade >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700')
                                                }`}>
                                                <GraduationCap className="h-3 w-3" />
                                                {student.average_quiz_grade}/100
                                            </span>
                                        ) : (
                                            <span className="text-xs text-muted-foreground italic">Checking...</span> // Or "Sin notas"
                                        )}
                                        {student.average_quiz_grade === null && <span className="text-xs text-muted-foreground">-</span>}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1 text-muted-foreground text-xs">
                                            <Calendar className="h-3 w-3" />
                                            {new Date(student.enrolled_at).toLocaleDateString()}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
