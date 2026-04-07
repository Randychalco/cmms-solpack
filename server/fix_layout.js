const db = require('./src/config/db');

async function fix() {
    try {
        await db.query(`UPDATE checklist_templates SET layout = 'sml2_matrix' WHERE name = 'RUTINA DE INSPECCION GENERAL - Rebobinadora'`);
        console.log('Fixed layout property.');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
fix();
