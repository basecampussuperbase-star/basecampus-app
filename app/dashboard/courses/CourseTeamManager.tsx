'use client';

import { useState, useEffect } from 'react';
import { User, Mail, Trash2, Plus, Users, Shield } from 'lucide-react';
import { inviteInstructor, removeInstructor, revokeInvite } from './team-actions';

import { useRouter } from 'next/navigation';

interface CourseTeamManagerProps {
    courseId: string;
    instructors: any[];
    invites: any[];
    ownerId: string;
    currentUserId: string;
}

export default function CourseTeamManager({ courseId, instructors, invites: initialInvites, ownerId, currentUserId }: CourseTeamManagerProps) {
    const router = useRouter();
    const [invites, setInvites] = useState(initialInvites);
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Update local state if props change (revalidation)
    useEffect(() => {
        setInvites(initialInvites);
    }, [initialInvites]);

    // Only owner can manage team
    const isOwner = ownerId === currentUserId;

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setIsLoading(true);
        const res = await inviteInstructor(courseId, email);
        setIsLoading(false);

        if (res.success) {
            setEmail('');
            // Since we don't have simulated toast, we just rely on the UI update (optimistic or refresh)
            // But actually, we need to show the token/link if possible.
            // For now, allow the user to see it in the list (refresh needed or optimistic).
            // The list updates via router.refresh in the parent or should.
            // Let's alert the token for now as a fallback or just say "Invitación Creada".
            if (res.message && res.message.includes('token')) {
                const token = res.message.split(': ')[1];
                const link = `${window.location.origin}/invite/${token}`;
                navigator.clipboard.writeText(link);
                alert(`Invitación creada. Enlace copiado al portapapeles: ${link}`);
            } else {
                alert('Invitación creada exitosamente.');
            }
        } else {
            alert(res.error);
        }
    };

    if (!isOwner) {
        return <div className="p-4 text-muted-foreground">Solo el dueño del curso puede gestionar el equipo.</div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Equipo de Instructores
                    </h3>
                    <p className="text-sm text-muted-foreground">Gestiona quién puede editar y dictar este curso.</p>
                </div>
            </div>

            {/* Invite Form */}
            <div className="bg-muted/30 p-5 rounded-lg border border-border space-y-4">
                <form onSubmit={handleInvite} className="flex flex-col gap-4">
                    <div className="space-y-2 w-full">
                        <label className="text-sm font-medium">Invitar por Correo</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <input
                                type="email"
                                placeholder="correo@ejemplo.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading || !email}
                        className="w-full bg-primary text-primary-foreground py-2.5 rounded-md font-medium text-sm flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm"
                    >
                        <Plus className="h-4 w-4" />
                        Generar Invitación
                    </button>
                </form>
                <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-md flex gap-2 items-start border border-blue-100">
                    <Shield className="h-4 w-4 shrink-0 mt-0.5" />
                    <p>
                        <strong>Nota:</strong> Al invitar, se generará un enlace único. Debes copiar este enlace y enviárselo manualmente al instructor (por WhatsApp o correo) para que acepte la invitación.
                    </p>
                </div>
            </div>

            <div className="space-y-8">
                {/* Active Instructors */}
                <div className="space-y-4">
                    <h4 className="font-medium text-sm uppercase tracking-wider text-muted-foreground">Miembros Activos</h4>
                    <div className="space-y-2">
                        {/* Owner (Always user) */}
                        <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                    <Shield className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="font-medium text-sm">Organizador (Tú)</p>
                                    <p className="text-xs text-muted-foreground">Dueño del Curso</p>
                                </div>
                            </div>
                        </div>

                        {instructors.map((member) => (
                            <div key={member.id} className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                                        {member.instructor.avatar_url ? (
                                            <img src={member.instructor.avatar_url} className="h-full w-full object-cover" />
                                        ) : (
                                            <User className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">{member.instructor.full_name}</p>
                                        <p className="text-xs text-muted-foreground">{member.instructor.email}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={async () => {
                                        await removeInstructor(courseId, member.instructor_id);
                                        router.refresh();
                                    }}
                                    className="text-destructive hover:bg-destructive/10 p-2 rounded-md transition-colors"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                        {instructors.length === 0 && (
                            <p className="text-sm text-muted-foreground italic pl-2">No hay instructores adicionales.</p>
                        )}
                    </div>
                </div>

                {/* Pending Invites */}
                <div className="space-y-4">
                    <h4 className="font-medium text-sm uppercase tracking-wider text-muted-foreground">Invitaciones Pendientes</h4>
                    <div className="space-y-2">
                        {invites.map((invite) => (
                            <div key={invite.id} className="flex items-center justify-between p-3 bg-muted/50 border border-border rounded-lg border-dashed">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                                        <Mail className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">{invite.email}</p>
                                        <p className="text-xs text-muted-foreground">Expira en 7 días</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => {
                                            const link = `${window.location.origin}/invite/${invite.token}`;
                                            navigator.clipboard.writeText(link);
                                            alert('Enlace copiado al portapapeles: ' + link);
                                        }}
                                        className="text-xs bg-secondary hover:bg-secondary/80 text-secondary-foreground px-2 py-1 rounded transition-colors mr-2"
                                        title="Copiar Enlace de Invitación"
                                    >
                                        Copiar Enlace
                                    </button>
                                    <button
                                        onClick={async () => {
                                            await revokeInvite(invite.id, courseId);
                                            router.refresh();
                                        }}
                                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-2 rounded-md transition-colors"
                                        title="Revocar Invitación"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {invites.length === 0 && (
                            <p className="text-sm text-muted-foreground italic pl-2">No hay invitaciones pendientes.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
