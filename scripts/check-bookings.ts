
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://efqdblvfxpqgwkjyorro.supabase.co';
const supabaseKey = 'sb_publishable_6JZhl8BHitga2bjzdw4fUg_bBWSiGWT';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBookingsSchema() {
    console.log('Checking schema for table "bookings"...');

    // Attempt to insert a dummy booking with null room_id to see if it fails
    // We'll use a transaction validation via explanation or just a raw attempt that we expect to fail
    // Actually, listing columns via an rpc or trying to select from information_schema (if allowed) is better.
    // Since we can't easily do that, we will try to insert a row that should be valid EXCEPT for room_id being null.
    // We will use a non-existent user_id/course_id likely, so foreign key might fail first.
    // But that tells us about FK.

    // Better: Just try to select where room_id is null.
    const { data, error } = await supabase
        .from('bookings')
        .select('id')
        .is('room_id', null)
        .limit(1);

    if (error) {
        console.log('Error selecting null room_id:', error.message);
    } else {
        console.log('Query for null room_id executed (success).');
    }

    // Let's try to verify if room_id is nullable by known migration history?
    // Or just "fix it" by running an ALTER TABLE command in a notify_user block if we suspect it.

    // Let's print the error from a bad insert attempt (missing required fields) to see schema hints?
    // No, that's messy.

    console.log("Checking if we can insert a booking...");

    // Create a dummy user ID (we can't really authenticate easily without a token, 
    // but we can try with the anon key if RLS allows anon, or assuming service role if we had it.
    // Since we only have ANON key hardcoded, this test might fail due to "new row violates row-level security policy"
    // which effectively logic confirms RLS is blocking or missing.

    const dummyBooking = {
        course_id: 'e0c45678-1234-4567-8901-234567890123', // Valid dummy UUID
        user_id: 'd0u45678-1234-4567-8901-234567890123', // Valid dummy UUID
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 3600000).toISOString(),
        status: 'pending',
        notes: 'Test booking'
    };

    const { data: insertData, error: insertError } = await supabase.from('bookings').insert(dummyBooking).select();

    if (insertError) {
        console.error('❌ Insert failed:', insertError.message);
        console.error('Details:', insertError.details);
        console.error('Hint:', insertError.hint);
        console.error('Code:', insertError.code);
    } else {
        console.log('✅ Insert SUCCESS (rls might be off or permissive).');
        // Clean up
        if (insertData && insertData[0]) {
            await supabase.from('bookings').delete().eq('id', insertData[0].id);
        }
    }
}

checkBookingsSchema();
