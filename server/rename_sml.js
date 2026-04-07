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
        
        console.log("Renaming SML 1...");
        await client.query("UPDATE checklist_templates SET name = 'SML 1' WHERE name = 'Checklist Diario SML 1 (Matrix)'");
        
        console.log("Renaming SML 2...");
        await client.query("UPDATE checklist_templates SET name = 'SML 2' WHERE name = 'Checklist Diario SML 2 (Matrix)'");
        
        console.log("✅ Renaming completed successfully.");
        
        await client.query("COMMIT");
    } catch (e) {
        await client.query("ROLLBACK");
        console.error('Error during renaming:', e);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
