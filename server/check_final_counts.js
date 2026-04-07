const { Pool } = require('pg');

async function checkCounts() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { require: true, rejectUnauthorized: false }
    });

    try {
        const p = await pool.query('SELECT count(*) FROM plants');
        const a = await pool.query('SELECT count(*) FROM areas');
        const m = await pool.query('SELECT count(*) FROM machines');
        const sc = await pool.query('SELECT count(*) FROM sub_machines');
        const t = await pool.query('SELECT count(*) FROM checklist_templates');
        
        console.log('--- FINAL PRODUCTION DATA COUNTS ---');
        console.log({
            plants: p.rows[0].count,
            areas: a.rows[0].count,
            machines: m.rows[0].count,
            sub_machines: sc.rows[0].count,
            templates: t.rows[0].count
        });
        process.exit(0);
    } catch (err) {
        console.error('❌ Error checking counts:', err);
        process.exit(1);
    }
}

checkCounts();
