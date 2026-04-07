const db = require('./src/config/db');

async function renameTemplates() {
    try {
        const r1 = await db.query(
            `UPDATE checklist_templates SET name = 'EREMA 1' WHERE name = 'RUTINA DE INSPECCION GENERAL - Erema 1' RETURNING id, name`
        );
        console.log('Renamed:', r1.rows);

        const r2 = await db.query(
            `UPDATE checklist_templates SET name = 'EREMA 2' WHERE name = 'RUTINA DE INSPECCION GENERAL - Erema 2' RETURNING id, name`
        );
        console.log('Renamed:', r2.rows);

        const check = await db.query(`SELECT id, name FROM checklist_templates WHERE name ILIKE '%erema%'`);
        console.log('\nAll EREMA templates now:');
        check.rows.forEach(r => console.log(' ', r.id, r.name));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
renameTemplates();
