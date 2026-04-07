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
        const result = await client.query('SELECT id, name, email, role, status FROM users ORDER BY id');
        console.log('Usuarios en la base de datos:');
        console.table(result.rows);
    } catch (e) {
        console.error(e.message);
    } finally {
        client.release();
        await pool.end();
    }
}
run();
