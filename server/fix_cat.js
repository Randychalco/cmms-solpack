const db = require('./src/config/db');

async function fix() {
    try {
        await db.query(`UPDATE checklist_templates SET asset_category = 'REBOBINADO' WHERE name = 'RUTINA DE INSPECCION GENERAL - Rebobinadora'`);
        console.log('Fixed category.');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
fix();
