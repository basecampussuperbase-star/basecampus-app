'use client';

import { useState, useEffect } from 'react';
import { Loader2, Calendar as CalendarIcon, Clock, Users, Plus, Trash2 } from 'lucide-react';
import { getRooms, createBookingRequest, updateBookingRequest, createBatchBookingRequests } from './actions';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client'; // Need client for fetching courses

export default function BookingRequestDialog({
    courseId,
    course, // Optional full course object
    isOpen,
    onClose,
    bookingRoomId, // Pre-selected from bookings page
    bookingToEdit
}: {
    courseId?: string;
    course?: any;
    isOpen: boolean;
    onClose: () => void;
    bookingRoomId?: string; // Pre-selected from bookings page
    bookingToEdit?: any;
}) {
    const [rooms, setRooms] = useState<any[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    // Multi-slot state
    const [sessions, setSessions] = useState<{ id: number, date: string, startTime: string, endTime: string }[]>([]);
    const [formData, setFormData] = useState({
        roomId: bookingRoomId || '',
        courseId: courseId || '',
        date: '',
        startTime: '',
        endTime: '',
        notes: ''
    });

    useEffect(() => {
        if (bookingToEdit) {
            const start = new Date(bookingToEdit.start_time);
            const end = new Date(bookingToEdit.end_time);

            setFormData({
                roomId: bookingToEdit.room_id,
                courseId: bookingToEdit.course_id || '',
                date: start.toISOString().split('T')[0],
                startTime: start.toISOString().split('T')[1].substring(0, 5),
                endTime: end.toISOString().split('T')[1].substring(0, 5),
                notes: bookingToEdit.notes || ''
            });
            // Clear sessions in edit mode to avoid confusion, or prepopulate?
            // Decision: Edit is Single Mode. Create is Batch Mode.
            setSessions([]);
        } else if (bookingRoomId) {
            setFormData(prev => ({ ...prev, roomId: bookingRoomId, date: '', startTime: '', endTime: '' }));
            setSessions([]);
        } else {
            // Reset on new open
            setFormData(prev => ({ ...prev, date: '', startTime: '', endTime: '' }));
            setSessions([]);
        }
    }, [bookingRoomId, bookingToEdit, isOpen]);

    useEffect(() => {
        if (isOpen) {
            fetchInitialData();
        }
    }, [isOpen, courseId, course]);

    const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            const roomsData = await getRooms();
            setRooms(roomsData || []);
            if (roomsData && roomsData.length > 0) {
                if (course?.room_id) {
                    setFormData(prev => ({ ...prev, roomId: course.room_id }));
                } else if (!formData.roomId && !bookingToEdit) {
                    setFormData(prev => ({ ...prev, roomId: roomsData[0].id }));
                }
            }

            if (!courseId) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: myCourses } = await supabase
                        .from('courses')
                        .select('id, title, room_id, modality') // Fetch modality to confirm if needed
                        .eq('mentor_id', user.id)
                        .in('modality', ['in-person', 'hybrid']); // Filter by modality

                    setCourses(myCourses || []);
                    if (myCourses && myCourses.length > 0 && !formData.courseId && !bookingToEdit) {
                        setFormData(prev => ({ ...prev, courseId: myCourses[0].id }));
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddSession = () => {
        if (!formData.date || !formData.startTime || !formData.endTime) {
            alert('Completa la fecha y horas para agregar una sesión.');
            return;
        }

        const startDateTime = new Date(`${formData.date}T${formData.startTime}`);
        const endDateTime = new Date(`${formData.date}T${formData.endTime}`);

        if (endDateTime <= startDateTime) {
            alert('La hora de fin debe ser posterior a la hora de inicio.');
            return;
        }

        setSessions([...sessions, {
            id: Date.now(),
            date: formData.date,
            startTime: formData.startTime,
            endTime: formData.endTime
        }]);

        // Reset inputs but keep room/course/notes
        setFormData(prev => ({ ...prev, date: '', startTime: '', endTime: '' }));
    };

    const removeSession = (id: number) => {
        setSessions(sessions.filter(s => s.id !== id));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation: Must have at least one session OR filled inputs
        const hasInputs = formData.date && formData.startTime && formData.endTime;
        if (sessions.length === 0 && !hasInputs) {
            alert('Debes agregar al menos una sesión o completar los campos.');
            return;
        }

        setIsSubmitting(true);

        try {
            let result;

            if (bookingToEdit) {
                // Edit is always single for now
                if (!hasInputs) { alert('Datos incompletos para editar.'); setIsSubmitting(false); return; }

                const startDateTime = new Date(`${formData.date}T${formData.startTime}`);
                const endDateTime = new Date(`${formData.date}T${formData.endTime}`);
                if (endDateTime <= startDateTime) {
                    alert('La hora de fin debe ser posterior a la hora de inicio.');
                    setIsSubmitting(false);
                    return;
                }

                result = await updateBookingRequest(bookingToEdit.id, {
                    roomId: formData.roomId,
                    startTime: startDateTime.toISOString(),
                    endTime: endDateTime.toISOString(),
                    notes: formData.notes
                });

            } else {
                // Create Mode: Gather all sessions
                const requestsToCreate = [...sessions];

                // If there's input data that hasn't been added to the list, ask or include it?
                // Standard behavior: Include it if valid, otherwise ignore if list > 0
                // Let's force user to add it to list OR verify it's the only one.

                if (hasInputs) {
                    const idx = requestsToCreate.findIndex(s => s.id === -1); // Check duplicates? Nah.
                    // Just add it as another session
                    requestsToCreate.push({
                        id: -1,
                        date: formData.date,
                        startTime: formData.startTime,
                        endTime: formData.endTime
                    });
                }

                // Map to API format
                const apiRequests = requestsToCreate.map(s => {
                    const start = new Date(`${s.date}T${s.startTime}`);
                    const end = new Date(`${s.date}T${s.endTime}`);
                    return {
                        courseId: formData.courseId || courseId || '',
                        roomId: formData.roomId,
                        startTime: start.toISOString(),
                        endTime: end.toISOString(),
                        notes: formData.notes
                    };
                });

                if (apiRequests.length === 0) {
                    alert('No hay sesiones para reservar.');
                    setIsSubmitting(false);
                    return;
                }

                result = await createBatchBookingRequests(apiRequests);
            }

            if (result.success) {
                alert(bookingToEdit ? 'Reserva actualizada.' : 'Solicitudes enviadas con éxito.');
                onClose();
                router.refresh();
            } else {
                alert(result.error);
            }
        } catch (error) {
            alert('Error al procesar la solicitud.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const getRoomCapacityInfo = (roomId: string) => {
        const room = rooms.find(r => r.id === roomId);
        if (!room) return null;
        let min = 1, max = 100;
        if (room.name.includes('Magna')) { min = 26; max = 50; }
        else if (room.name.includes('Media')) { min = 13; max = 25; }
        else if (room.name.includes('Focus')) { min = 2; max = 12; }
        return { min, max, name: room.name };
    };

    const capacityInfo = getRoomCapacityInfo(formData.roomId);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-card border border-border rounded-lg shadow-lg p-6 space-y-6 max-h-[90vh] overflow-y-auto">
                <div className="space-y-2">
                    <h3 className="text-lg font-bold">{bookingToEdit ? 'Editar Reserva' : 'Solicitar Reserva'}</h3>
                    <p className="text-sm text-muted-foreground">
                        {bookingToEdit ? 'Modifica tu solicitud.' : 'Puedes agregar múltiples sesiones a la vez.'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!courseId && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Curso Asociado</label>
                            <select
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={formData.courseId}
                                onChange={(e) => {
                                    const cId = e.target.value;
                                    const selectedCourse = courses.find(c => c.id === cId);
                                    setFormData(prev => ({
                                        ...prev,
                                        courseId: cId,
                                        roomId: selectedCourse?.room_id || prev.roomId
                                    }));
                                }}
                                required
                            >
                                <option value="">-- Seleccionar Curso --</option>
                                {courses.map(c => (
                                    <option key={c.id} value={c.id}>{c.title}</option>
                                ))}
                            </select>
                            <p className="text-[10px] text-muted-foreground leading-tight">
                                Solo aparecen cursos configurados como <strong>Presencial</strong> o <strong>Híbrido</strong>.
                                Para reservar sala para otro curso, edita su modalidad en la sección "Mis Cursos".
                            </p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Seleccionar Sala</label>
                        <select
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={formData.roomId}
                            onChange={(e) => setFormData(prev => ({ ...prev, roomId: e.target.value }))}
                            required
                        >
                            {isLoading ? (
                                <option>Cargando salas...</option>
                            ) : (
                                rooms.map(room => (
                                    <option key={room.id} value={room.id}>
                                        {room.name} (${room.hourly_rate > 0 ? room.hourly_rate + '/hr' : 'Incluido'})
                                    </option>
                                ))
                            )}
                        </select>
                        {capacityInfo && (
                            <p className="text-[10px] text-muted-foreground">
                                Capacidad ideal de {capacityInfo.name}: <span className="font-bold">{capacityInfo.min} - {capacityInfo.max}</span> personas.
                            </p>
                        )}
                    </div>

                    {/* Sessions List */}
                    {sessions.length > 0 && (
                        <div className="space-y-2 border rounded-md p-2 bg-muted/10">
                            <label className="text-xs font-semibold text-muted-foreground">Sesiones Agregadas:</label>
                            {sessions.map(session => (
                                <div key={session.id} className="flex items-center justify-between text-sm p-2 bg-background rounded border">
                                    <div className="flex items-center gap-2">
                                        <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                                        <span>{session.date}</span>
                                        <span className="text-muted-foreground">|</span>
                                        <Clock className="h-3 w-3 text-muted-foreground" />
                                        <span>{session.startTime} - {session.endTime}</span>
                                    </div>
                                    <button type="button" onClick={() => removeSession(session.id)} className="text-red-500 hover:text-red-700">
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add Session Inputs */}
                    <div className="flex gap-2 items-end">
                        <div className="flex-1 grid grid-cols-7 gap-2">
                            <div className="col-span-3">
                                <label className="text-xs text-muted-foreground">Fecha</label>
                                <input
                                    type="date"
                                    className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                                    value={formData.date}
                                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                    required={sessions.length === 0} // Only required if no sessions added
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs text-muted-foreground">Inicio</label>
                                <input
                                    type="time"
                                    className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                                    value={formData.startTime}
                                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                                    required={sessions.length === 0}
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs text-muted-foreground">Fin</label>
                                <input
                                    type="time"
                                    className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                                    value={formData.endTime}
                                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                                    required={sessions.length === 0}
                                />
                            </div>
                        </div>

                        {!bookingToEdit && (
                            <button
                                type="button"
                                onClick={handleAddSession}
                                className="h-9 w-9 flex items-center justify-center rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm border border-input"
                                title="Agregar otra sesión"
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Notas</label>
                        <textarea
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                            rows={2}
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-md"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                            disabled={isSubmitting}
                        >
                            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                            {bookingToEdit ? 'Guardar Cambios' : sessions.length > 0 ? `Enviar ${sessions.length + (formData.date && formData.startTime ? 1 : 0)} Solicitudes` : 'Enviar Solicitud'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
