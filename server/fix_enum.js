require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function fix() {
    const client = await pool.connect();
    try {
        console.log('Connected. Running enum fix...');
        await client.query(`ALTER TABLE users ALTER COLUMN status DROP DEFAULT;`);
        console.log('Dropped default.');
        await client.query(`ALTER TABLE users ALTER COLUMN status TYPE VARCHAR(20) USING status::VARCHAR;`);
        console.log('Converted status column to VARCHAR.');
        await client.query(`DROP TYPE IF EXISTS "enum_users_status";`);
        console.log('Dropped old enum type. Done!');
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        client.release();
        await pool.end();
    }
}

fix();
