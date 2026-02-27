import { createClient } from '@/lib/supabase/server';
import { getRooms } from './actions';
import BookingRequestDialog from './BookingRequestDialog';
import BookingPageClient from './BookingPageClient';

export default async function BookingsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch rooms
    const rooms = await getRooms();

    // Fetch user bookings
    const { data: myBookings } = await supabase
        .from('bookings')
        .select(`
            *,
            rooms (name),
            courses (title)
        `)
        .eq('user_id', user?.id)
        .order('start_time', { ascending: false });

    return <BookingPageClient rooms={rooms || []} bookings={myBookings || []} />;
}
