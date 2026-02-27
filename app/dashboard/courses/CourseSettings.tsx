'use client';

import { useState, useEffect } from 'react';
import { updateCourse, getMentorStats, saveCourseSchedule, getCourseSchedule } from './actions';
import { getRooms } from '../bookings/actions';
import { Loader2, Save, Pencil, X, Calendar as CalendarIcon, Clock, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import BookingRequestDialog from '../bookings/BookingRequestDialog';
import { createClient } from '@/lib/supabase/client';
import PriceDisplay from '@/components/PriceDisplay';

import CourseTeamManager from './CourseTeamManager';

interface Course {
    id: string;
    mentor_id: string;
    title: string;
    description: string | null;
    price: number;
    modality: 'online' | 'in-person' | 'hybrid';
    address?: string;
    schedule_info?: string;
    is_live?: boolean;
    max_students?: number;
    room_id?: string;
    meeting_platform?: 'zoom' | 'meet' | 'tea';
    image_url?: string;
    logo_url?: string;
    features?: string[];
}

interface CourseSettingsProps {
    course: Course;
    instructors?: any[];
    invites?: any[];
    ownerId?: string;
    currentUserId?: string;
}

export default function CourseSettings({ course, instructors = [], invites = [], ownerId, currentUserId }: CourseSettingsProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [rooms, setRooms] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);

    // Schedule State
    const [stats, setStats] = useState({ limit: 32, usedHours: 0 });
    const [sessions, setSessions] = useState<any[]>([]);
    const [newSession, setNewSession] = useState({ date: '', startTime: '', endTime: '' });

    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const roomsData = await getRooms();
                setRooms(roomsData || []);

                // Fetch stats
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const statsData = await getMentorStats(user.id);
                    setStats(statsData);
                }

                // Fetch existing schedule
                if (course.id) {
                    const scheduleData = await getCourseSchedule(course.id);
                    setSessions(scheduleData);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
        fetchData();
    }, [course.id]);

    const handleAddSession = () => {
        if (!newSession.date || !newSession.startTime || !newSession.endTime) return;
        setSessions([...sessions, { ...newSession, id: Date.now() }]);
        setNewSession({ date: '', startTime: '', endTime: '' });
    };

    const removeSession = (id: number) => {
        setSessions(sessions.filter(s => s.id !== id));
    };

    const handleSaveSchedule = async () => {
        // ... (existing code, relying on formData below)
        const isOnlineLive = course?.modality === 'online' && course?.is_live;
        if (!course?.id) return;
        if (!isOnlineLive && !formData.room_id) {
            alert('Debes guardar el curso y seleccionar sala antes de agendar.');
            return;
        }
        setIsLoading(true);
        const result = await saveCourseSchedule(course.id, sessions.map(s => ({ ...s, roomId: formData.room_id })), isOnlineLive);
        setIsLoading(false);
        if (result.success) {
            alert(result.message || 'Cronograma guardado.');
            // Reload schedule from DB to get confirmed sessions
            const updatedSchedule = await getCourseSchedule(course.id);
            setSessions(updatedSchedule);
            router.refresh();
        } else {
            alert(result.error);
        }
    };


    const [formData, setFormData] = useState({
        title: course?.title || '',
        description: course?.description || '',
        price: course?.price || 0,
        modality: course?.modality || 'online',
        address: course?.address || 'CARACAS, BASE CAMPUS, CENTRO EMPRESARIAL GALIPAN, EL ROSAL, CARACAS, VENEZUELA',
        schedule_info: course?.schedule_info || '',
        is_live: course?.is_live || false,
        max_students: course?.max_students || 0,
        room_id: course?.room_id || '',
        meeting_platform: course?.meeting_platform || 'zoom',
        image_url: course?.image_url || '',
        logo_url: course?.logo_url || '',
        features: course?.features || ['Acceso inmediato al contenido', 'Certificado de finalización']
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'price' || name === 'max_students' ? parseFloat(value) || 0 : value
        }));
    };

    const handleToggle = (name: string, value: boolean) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'cover' | 'logo' = 'cover') => {
        if (!e.target.files || e.target.files.length === 0) return;

        setUploading(true);
        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${type}-${course.id}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        try {
            const { error: uploadError } = await supabase.storage
                .from('covers')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('covers')
                .getPublicUrl(filePath);

            if (type === 'cover') {
                setFormData((prev: any) => ({ ...prev, image_url: publicUrl }));
            } else {
                setFormData((prev: any) => ({ ...prev, logo_url: publicUrl }));
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Error al subir la imagen');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (course) {
                const payload: any = {
                    ...formData,
                    room_id: formData.room_id || null, // Convert empty string to null for UUID
                    meeting_platform: formData.meeting_platform || null, // Convert empty string to null for specific platforms
                };

                // Remove undefined keys if any (though here we likely want strict nulls)

                await updateCourse(course.id, payload);
                setIsEditing(false);
                router.refresh();
            }
        } catch (error: any) {
            console.error(error);
            alert(`Error al actualizar el curso: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    if (!course) return null;

    if (!isEditing) {
        return (
            <div className="space-y-6">
                <div className="border border-border rounded-lg p-6 bg-card space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Configuración del Curso</h3>
                        {(currentUserId === (ownerId || course.mentor_id)) && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="p-2 text-muted-foreground hover:text-primary transition-colors"
                                title="Editar detalles"
                            >
                                <Pencil className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    <div className="space-y-4">
                        {/* Cover Image Preview */}
                        <div className="w-full h-48 bg-muted rounded-md overflow-hidden relative">
                            {course.image_url ? (
                                <img src={course.image_url} alt="Portada" className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    <span className="text-sm">Sin portada</span>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Título</label>
                            <p className="font-medium text-lg">{course.title}</p>
                        </div>

                        <div>
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Descripción</label>
                            <div className="text-sm text-muted-foreground bg-muted/20 p-3 rounded-md mt-1 whitespace-pre-wrap">
                                {course.description || "Sin descripción"}
                            </div>
                        </div>

                        {(course.modality === 'online' || course.modality === 'hybrid' || course.modality === 'in-person') && (
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Modalidad</label>
                                    <p className="font-medium">
                                        {course.modality === 'online' ? 'Online' : course.modality === 'in-person' ? 'Presencial' : 'Híbrido'}
                                        {course.is_live && <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">EN VIVO</span>}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Precio</label>
                                    <PriceDisplay priceUSD={course.price} />
                                </div>
                            </div>
                        )}

                        {(course.schedule_info || sessions.length > 0) && (
                            <div>
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Cronograma / Horario</label>
                                <div className="text-sm text-muted-foreground bg-muted/20 p-3 rounded-md mt-1 whitespace-pre-wrap font-mono">
                                    {course.schedule_info || sessions.map(s => `${s.date} (${s.startTime} - ${s.endTime})`).join('\n')}
                                </div>
                            </div>
                        )}

                        {/* ... rest of the read-only view ... */}
                    </div>
                </div>
                {/* ... existing code ... */}
            </div>
        );
    }





    return (
        <div className="space-y-8">
            <form onSubmit={handleSubmit} className="border border-border rounded-lg p-6 bg-card space-y-4 ring-2 ring-primary/20">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-primary">Editar Detalles</h3>
                    <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Logo Upload */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Logo del Curso / Mentor (Opcional)</label>
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 bg-muted rounded-full overflow-hidden relative border border-input group">
                                {formData.logo_url ? (
                                    <>
                                        <img src={formData.logo_url} alt="Logo" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, logo_url: '' }))}
                                            className="absolute top-1 right-1 bg-black/60 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200"
                                            title="Eliminar logo"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground text-[10px] text-center p-1">Sin logo</div>
                                )}
                            </div>
                            <div className="flex-1">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e, 'logo')}
                                    disabled={uploading}
                                    className="block w-full text-sm text-muted-foreground
                                      file:mr-4 file:py-2 file:px-4
                                      file:rounded-full file:border-0
                                      file:text-sm file:font-semibold
                                      file:bg-secondary file:text-secondary-foreground
                                      hover:file:bg-secondary/90"
                                />
                                <p className="text-[10px] text-muted-foreground mt-1">Reemplaza el texto "BASE CAMPUS" en la página de venta.</p>
                            </div>
                        </div>
                    </div>

                    {/* Image Upload (Cover) */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Imagen de Portada</label>
                        <div className="flex items-center gap-4">
                            <div className="h-24 w-40 bg-muted rounded-md overflow-hidden relative border border-input group">
                                {formData.image_url ? (
                                    <>
                                        <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                                            className="absolute top-1 right-1 bg-black/60 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200"
                                            title="Eliminar imagen"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground text-xs">Sin imagen</div>
                                )}
                            </div>
                            <div className="flex-1">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e, 'cover')}
                                    disabled={uploading}
                                    className="block w-full text-sm text-muted-foreground
                                      file:mr-4 file:py-2 file:px-4
                                      file:rounded-full file:border-0
                                      file:text-sm file:font-semibold
                                      file:bg-primary file:text-primary-foreground
                                      hover:file:bg-primary/90"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Título</label>
                        <input
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Descripción</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                        />
                    </div>

                    {/* Features Editor */}
                    <div className="space-y-2 border p-3 rounded-md bg-muted/10">
                        <label className="text-sm font-medium">¿Qué incluye este curso?</label>
                        <div className="space-y-2">
                            {formData.features?.map((feature: string, index: number) => (
                                <div key={index} className="flex items-center gap-2">
                                    <input
                                        value={feature}
                                        onChange={(e) => {
                                            const newFeatures = [...(formData.features || [])];
                                            newFeatures[index] = e.target.value;
                                            setFormData(prev => ({ ...prev, features: newFeatures }));
                                        }}
                                        className="flex-1 rounded-md border border-input px-2 py-1 text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newFeatures = formData.features.filter((_, i) => i !== index);
                                            setFormData(prev => ({ ...prev, features: newFeatures }));
                                        }}
                                        className="text-red-500 hover:text-red-700 p-1"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, features: [...(prev.features || []), ""] }))}
                                className="text-xs flex items-center gap-1 text-primary hover:underline font-medium"
                            >
                                <Plus className="h-3 w-3" /> Agregar Elemento
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Modalidad</label>
                            <select
                                name="modality"
                                value={formData.modality}
                                onChange={handleChange}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="online">Online</option>
                                <option value="in-person">Presencial</option>
                                <option value="hybrid">Híbrido</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Precio (USD)</label>
                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            />
                        </div>
                    </div>

                    {formData.modality === 'online' && (
                        <div className="space-y-4 border p-3 rounded-md bg-muted/20">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_live"
                                    checked={formData.is_live}
                                    onChange={(e) => handleToggle('is_live', e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <label htmlFor="is_live" className="text-sm font-medium cursor-pointer select-none">
                                    ¿Es un curso en vivo (Streaming)?
                                </label>
                            </div>

                            {formData.is_live && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <label className="text-sm font-medium">Plataforma de Transmisión</label>
                                    <select
                                        name="meeting_platform"
                                        value={formData.meeting_platform || 'zoom'}
                                        onChange={handleChange}
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    >
                                        <option value="zoom">Zoom</option>
                                        <option value="meet">Google Meet</option>
                                        <option value="tea">Microsoft Teams</option>
                                    </select>
                                    <p className="text-[10px] text-muted-foreground">
                                        Los enlaces de conexión se enviarán por el grupo de WhatsApp del curso.
                                    </p>

                                    {/* Schedule for Online Live */}
                                    <div className="space-y-4 pt-2 border-t border-border/50 mt-4">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-medium">Cronograma de Sesiones (En Vivo)</label>
                                        </div>

                                        {/* Session List */}
                                        {sessions.length > 0 && (
                                            <div className="space-y-2 mb-2 border rounded-md p-2 bg-muted/10">
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
                                                <button
                                                    type="button"
                                                    onClick={handleSaveSchedule}
                                                    className="w-full text-xs bg-black text-white py-1 rounded hover:bg-black/90 mt-2"
                                                >
                                                    Guardar Cronograma
                                                </button>
                                            </div>
                                        )}

                                        {/* Add Session Inputs */}
                                        <div className="flex flex-col sm:flex-row gap-2 items-end">
                                            <div className="flex-1 grid grid-cols-2 sm:grid-cols-7 gap-2 w-full">
                                                <div className="col-span-2 sm:col-span-3">
                                                    <label className="text-xs text-muted-foreground">Fecha</label>
                                                    <input
                                                        type="date"
                                                        className="w-full rounded-md border border-input px-2 py-1 text-sm"
                                                        value={newSession.date}
                                                        onChange={e => setNewSession({ ...newSession, date: e.target.value })}
                                                        min={new Date().toISOString().split('T')[0]}
                                                    />
                                                </div>
                                                <div className="col-span-1 sm:col-span-2">
                                                    <label className="text-xs text-muted-foreground">Inicio</label>
                                                    <input
                                                        type="time"
                                                        className="w-full rounded-md border border-input px-2 py-1 text-sm"
                                                        value={newSession.startTime}
                                                        onChange={e => setNewSession({ ...newSession, startTime: e.target.value })}
                                                    />
                                                </div>
                                                <div className="col-span-1 sm:col-span-2">
                                                    <label className="text-xs text-muted-foreground">Fin</label>
                                                    <input
                                                        type="time"
                                                        className="w-full rounded-md border border-input px-2 py-1 text-sm"
                                                        value={newSession.endTime}
                                                        onChange={e => setNewSession({ ...newSession, endTime: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleAddSession}
                                                className="h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-md border border-input bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80"
                                                title="Agregar Sesión"
                                            >
                                                <Plus className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {(formData.modality === 'in-person' || formData.modality === 'hybrid') && (
                        <div className="space-y-4 border-t pt-4 border-border/50 animate-in fade-in slide-in-from-top-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Seleccionar Sala / Espacio</label>
                                <select
                                    name="room_id"
                                    value={formData.room_id || ''}
                                    onChange={handleChange}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                >
                                    <option value="">-- Seleccionar Sala --</option>
                                    {rooms.map(room => (
                                        <option key={room.id} value={room.id}>
                                            {room.name} (Capacidad: {room.capacity})
                                        </option>
                                    ))}
                                </select>
                            </div>


                            <div className="space-y-4 pt-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium">Cronograma de Sesiones</label>
                                    <div className="text-xs text-muted-foreground bg-secondary/20 px-2 py-1 rounded-md">
                                        Disponibles: <span className={(stats.limit - stats.usedHours) < 5 ? 'text-red-500 font-bold' : 'font-bold'}>{(stats.limit - stats.usedHours).toFixed(1)}h</span> / {stats.limit}h Mensuales
                                    </div>
                                </div>

                                {/* Session List */}
                                {sessions.length > 0 && (
                                    <div className="space-y-2 mb-2 border rounded-md p-2 bg-muted/10">
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
                                        <button
                                            type="button"
                                            onClick={handleSaveSchedule}
                                            className="w-full text-xs bg-black text-white py-1 rounded hover:bg-black/90 mt-2"
                                        >
                                            Confirmar y Reservar Sesiones
                                        </button>
                                    </div>
                                )}

                                {/* Add Session Inputs */}
                                <div className="flex flex-col sm:flex-row gap-2 items-end">
                                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-7 gap-2 w-full">
                                        <div className="col-span-2 sm:col-span-3">
                                            <label className="text-xs text-muted-foreground">Fecha</label>
                                            <input
                                                type="date"
                                                className="w-full rounded-md border border-input px-2 py-1 text-sm"
                                                value={newSession.date}
                                                onChange={e => setNewSession({ ...newSession, date: e.target.value })}
                                                min={new Date().toISOString().split('T')[0]}
                                            />
                                        </div>
                                        <div className="col-span-1 sm:col-span-2">
                                            <label className="text-xs text-muted-foreground">Inicio</label>
                                            <input
                                                type="time"
                                                className="w-full rounded-md border border-input px-2 py-1 text-sm"
                                                value={newSession.startTime}
                                                onChange={e => setNewSession({ ...newSession, startTime: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-span-1 sm:col-span-2">
                                            <label className="text-xs text-muted-foreground">Fin</label>
                                            <input
                                                type="time"
                                                className="w-full rounded-md border border-input px-2 py-1 text-sm"
                                                value={newSession.endTime}
                                                onChange={e => setNewSession({ ...newSession, endTime: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAddSession}
                                        disabled={!formData.room_id}
                                        className="h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-md border border-input bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 disabled:opacity-50"
                                        title="Agregar Sesión"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </button>
                                </div>
                                {!formData.room_id && <p className="text-[10px] text-red-500">Selecciona una sala para agregar sesiones.</p>}
                            </div>


                            {/* Logic for Room Capacity Range */}
                            {(() => {
                                const selectedRoom = rooms.find(r => r.id === formData.room_id);
                                let minCap = 1;
                                let maxCap = 100;

                                if (selectedRoom) {
                                    if (selectedRoom.name.includes('Magna')) {
                                        minCap = 26;
                                        maxCap = 50;
                                    } else if (selectedRoom.name.includes('Media')) {
                                        minCap = 13;
                                        maxCap = 25;
                                    } else if (selectedRoom.name.includes('Focus')) {
                                        minCap = 2;
                                        maxCap = 12;
                                    }
                                }

                                return (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Cupo Máximo (Estudiantes)</label>
                                        <input
                                            type="number"
                                            name="max_students"
                                            value={formData.max_students}
                                            onChange={handleChange}
                                            min={minCap}
                                            max={maxCap}
                                            disabled={!formData.room_id}
                                            className={`w-full rounded-md border border-input bg-background px-3 py-2 text-sm ${!formData.room_id ? 'bg-muted' : ''}`}
                                        />
                                        {formData.room_id && (
                                            <p className="text-[10px] text-muted-foreground">
                                                Para {selectedRoom?.name.split('(')[0].trim()}, el cupo debe ser entre <span className="font-bold">{minCap}</span> y <span className="font-bold">{maxCap}</span> estudiantes.
                                            </p>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                </div>

                <div className="pt-4 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-md transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                        disabled={isLoading}
                    >
                        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                        Guardar Cambios
                    </button>
                </div>
            </form>

            <div className="border-t border-border pt-8">
                <CourseTeamManager
                    courseId={course.id}
                    instructors={instructors}
                    invites={invites}
                    ownerId={ownerId || ''}
                    currentUserId={currentUserId || ''}
                />
            </div>

            <BookingRequestDialog
                courseId={course.id}
                isOpen={isBookingOpen}
                onClose={() => setIsBookingOpen(false)}
            />
        </div>
    );
}
