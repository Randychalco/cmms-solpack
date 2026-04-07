require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function run() {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        
        console.log("Finding template IDs...");
        const res = await client.query("SELECT id, name FROM checklist_templates WHERE name = 'Checklist Diario SML 1' OR name = 'Checklist Diario SML 2'");
        const ids = res.rows.map(r => r.id);
        
        if (ids.length > 0) {
            console.log(`Found IDs: ${ids}. Deleting associated execution items...`);
            
            console.log("Deleting checklist_executions...");
            await client.query("DELETE FROM checklist_executions WHERE template_id = ANY($1)", [ids]);
            
            console.log("Deleting templates...");
            await client.query("DELETE FROM checklist_templates WHERE id = ANY($1)", [ids]);
            console.log("✅ Deletion completed successfully.");
        } else {
            console.log("Templates not found, already deleted.");
        }
        
        await client.query("COMMIT");
    } catch (e) {
        await client.query("ROLLBACK");
        console.error('Error during deletion:', e);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
