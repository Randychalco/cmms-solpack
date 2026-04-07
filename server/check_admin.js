const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkUser() {
    try {
        const res = await pool.query("SELECT * FROM users WHERE email = 'admin@solpack.com'");
        console.log('User found:', res.rows);
    } catch (err) {
        console.error('Error querying user:', err);
    } finally {
        await pool.end();
    }
}

checkUser();
