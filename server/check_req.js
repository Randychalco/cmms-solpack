const db = require('./src/config/db');

async function check() {
    const res = await db.query("SELECT id, status, wo_id FROM material_requests WHERE id::text LIKE '70c9621e%';");
    console.log(JSON.stringify(res.rows, null, 2));
    process.exit(0);
}

check();
