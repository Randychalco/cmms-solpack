const db = require('./src/config/db');
async function run() {
    const r = await db.query("SELECT items FROM material_requests WHERE status = 'Completado' LIMIT 1");
    console.log(JSON.stringify(r.rows[0]?.items, null, 2));
    process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
