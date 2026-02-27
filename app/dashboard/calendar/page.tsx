import { createClient } from '@/lib/supabase/server';
import CalendarView from './CalendarView';

export default async function CalendarPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return <div>No autenticado</div>;
    }

    // Fetch all bookings for this user (Mentor) - Both Online (room_id null) and In-Person
    // We also need the Course Title and Color info ideally.
    const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
            id,
            start_time,
            end_time,
            status,
            room_id,
            total_price,
            course:courses (
                id,
                title,
                modality,
                is_live,
                meeting_platform
            ),
            room:rooms (
                id,
                name
            )
        `)
        .eq('user_id', user.id)
        .neq('status', 'cancelled');

    if (error) {
        console.error('Error fetching calendar bookings:', error);
    }

    // Transform data for the view
    // We might want to assign colors based on course_id or modality
    const events = bookings?.map(b => ({
        id: b.id,
        title: b.course?.title || 'Sesión sin curso',
        start: new Date(b.start_time),
        end: new Date(b.end_time),
        resource: b.room ? b.room.name : (b.course?.modality === 'online' ? `Online (${b.course?.meeting_platform})` : 'Ubicación TBD'),
        status: b.status,
        modality: b.course?.modality,
        courseId: b.course?.id
    })) || [];

    return (
        <div className="h-full flex flex-col space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Calendario de Clases</h1>
                    <p className="text-muted-foreground">Gestiona tus sesiones presenciales y online en vivo.</p>
                </div>
            </div>

            <div className="flex-1 bg-card border border-border rounded-xl shadow-sm overflow-hidden h-[calc(100vh-12rem)]">
                <CalendarView initialEvents={events} />
            </div>
        </div>
    );
}
