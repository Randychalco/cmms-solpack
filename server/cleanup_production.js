const { Pool } = require('pg');
require('dotenv').config();

async function cleanup() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('DATABASE_URL not found in environment');
        process.exit(1);
    }

    const pool = new Pool({
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log('Starting production database cleanup...');
        
        // Delete the generic template that causes numbering mismatch
        const result = await pool.query("DELETE FROM checklist_templates WHERE name = 'RUTINA DE INSPECCION GENERAL - Rebobinadora'");
        console.log(`✅ Deleted ${result.rowCount} redundant templates.`);
        
        console.log('Cleanup completed successfully.');
    } catch (error) {
        console.error('❌ Cleanup failed:', error);
    } finally {
        await pool.end();
    }
}

cleanup();
