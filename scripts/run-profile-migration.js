const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

const connectionString = process.env.SUPABASE_DB_URL;

if (!connectionString) {
    console.error('SUPABASE_DB_URL is not set in .env.local');
    process.exit(1);
}

const sql = postgres(connectionString);

async function runMigration() {
    try {
        const migrationPath = path.join(__dirname, '../supabase/migration_profile_socials.sql');
        const migrationSql = fs.readFileSync(migrationPath, 'utf8');

        console.log('Running migration...');
        await sql.unsafe(migrationSql);
        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await sql.end();
    }
}

runMigration();
