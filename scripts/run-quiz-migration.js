const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    // Get connection string from env var or args
    const connectionString = process.env.SUPABASE_DB_URL;
    if (!connectionString) {
        console.error('Missing SUPABASE_DB_URL environment variable');
        process.exit(1);
    }

    const sql = postgres(connectionString);

    try {
        const migrationPath = path.join(__dirname, 'supabase/schema_quizzes.sql');
        const migrationSql = fs.readFileSync(migrationPath, 'utf8');

        console.log('Running migration...');
        // Split by semicolon if needed, but postgres.js usually handles multi-statement query if using `sql.file` or similar.
        // Or simply execute the raw string.
        // postgres.js `sql` template literal is safe, but for raw strings we use `sql.unsafe`.
        await sql.unsafe(migrationSql);

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await sql.end();
    }
}

runMigration();
