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
        console.log("Deleting 'Checklist Diario SML 1'...");
        await client.query("DELETE FROM checklist_templates WHERE name = 'Checklist Diario SML 1'");
        
        console.log("Deleting 'Checklist Diario SML 2'...");
        await client.query("DELETE FROM checklist_templates WHERE name = 'Checklist Diario SML 2'");
        
        console.log("✅ Deletion completed successfully.");
    } catch (e) {
        if (e.code === '23503') { // Foreign key violation
            console.log("Foreign key constraint detected. Deactivating instead...");
            await client.query("UPDATE checklist_templates SET is_active = false WHERE name = 'Checklist Diario SML 1'");
            await client.query("UPDATE checklist_templates SET is_active = false WHERE name = 'Checklist Diario SML 2'");
            console.log("✅ Deactivation completed successfully.");
        } else {
            console.error('Error:', e);
        }
    } finally {
        client.release();
        await pool.end();
    }
}

run();
