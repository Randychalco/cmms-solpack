const { Pool } = require('pg');

async function listTables() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    });

    try {
        const res = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log('--- TABLES IN PUBLIC SCHEMA ---');
        console.log(res.rows.map(r => r.table_name));
        process.exit(0);
    } catch (err) {
        console.error('❌ Error listing tables:', err);
        process.exit(1);
    }
}

listTables();
