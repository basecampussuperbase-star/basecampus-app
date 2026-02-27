
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://efqdblvfxpqgwkjyorro.supabase.co';
const supabaseKey = 'sb_publishable_6JZhl8BHitga2bjzdw4fUg_bBWSiGWT';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('Checking schema for table "courses"...');

    // Attempt 1: Select specific columns to see if they error
    const { data: courses, error } = await supabase
        .from('courses')
        .select('id, title, meeting_platform, image_url')
        .limit(1);

    if (error) {
        console.error('Error selecting specific columns:', error.message);

        // Fallback: Check if we can select just ID (table exists?)
        const { error: idError } = await supabase.from('courses').select('id').limit(1);
        if (idError) {
            console.error('Error selecting ID:', idError.message);
        } else {
            console.log('Table "courses" exists.');
        }

    } else {
        console.log('✅ Columns "meeting_platform" and "image_url" EXIST in "courses".');
    }

    // Check Storage Buckets
    const { data: buckets, error: bucketError } = await supabase
        .storage
        .listBuckets();

    if (bucketError) {
        console.error('Error listing buckets:', bucketError.message);
    } else {
        console.log('Buckets found:', buckets.map(b => b.name));
        const coversBucket = buckets.find(b => b.name === 'covers');
        if (coversBucket) {
            console.log('✅ "covers" bucket EXISTS.');
            console.log('Public:', coversBucket.public);
        } else {
            console.log('❌ "covers" bucket DOES NOT exist.');
        }
    }
}

checkSchema();
