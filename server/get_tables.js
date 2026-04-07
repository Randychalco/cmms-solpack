require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');

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
        const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        const tables = res.rows.map(r => r.table_name);
        fs.writeFileSync('db_tables.txt', tables.join('\n'), 'utf8');
        console.log("Written table names to db_tables.txt");
    } catch (e) {
        console.error('Error:', e);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
