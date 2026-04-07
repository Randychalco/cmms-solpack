const db = require('./src/config/db');

async function renameEremaTemplates() {
    try {
        console.log('Renaming templates...');
        const t1 = await db.query(`UPDATE checklist_templates SET name = 'EREMA 1' WHERE name ILIKE '%erema 1%' RETURNING id, name`);
        console.log('Renamed EREMA 1 templates:', t1.rows);
        
        const t2 = await db.query(`UPDATE checklist_templates SET name = 'EREMA 2' WHERE name ILIKE '%erema 2%' RETURNING id, name`);
        console.log('Renamed EREMA 2 templates:', t2.rows);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
renameEremaTemplates();
