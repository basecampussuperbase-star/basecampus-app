
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://efqdblvfxpqgwkjyorro.supabase.co';
const supabaseKey = 'sb_publishable_6JZhl8BHitga2bjzdw4fUg_bBWSiGWT';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkScheduleData() {
    console.log('Checking courses schedule_info...');

    console.log("Checking ALL bookings in DB...");

    const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*');

    if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
    } else {
        console.log(`Found ${bookings.length} bookings.`);
        console.log(JSON.stringify(bookings, null, 2));
    }

    console.log("Checking courses schedule_info...");
    const { data: courses } = await supabase.from('courses').select('id, title, schedule_info');
    console.log(JSON.stringify(courses, null, 2));
}

// checkBookingsSchema();
checkScheduleData();
