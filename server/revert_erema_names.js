const db = require('./src/config/db');

async function revertEremaNames() {
    try {
        console.log('Reverting EREMA template names...');

        const t1 = await db.query(
            `UPDATE checklist_templates SET name = 'SML1 - EREMA' WHERE name = 'EREMA 1' AND asset_category = 'EXTRUSION_2_EREMA1' RETURNING id, name`
        );
        console.log('Reverted EREMA 1:', t1.rows);

        const t2 = await db.query(
            `UPDATE checklist_templates SET name = 'SML2 - EREMA' WHERE name = 'EREMA 2' AND asset_category = 'EXTRUSION_2_EREMA2' RETURNING id, name`
        );
        console.log('Reverted EREMA 2:', t2.rows);

        // Also revert any duplicates that might have been created without asset_category filter
        const t3 = await db.query(
            `UPDATE checklist_templates SET name = 'SML1 - EREMA' WHERE name = 'EREMA 1' RETURNING id, name`
        );
        console.log('Additional EREMA 1 reverted:', t3.rows);

        const t4 = await db.query(
            `UPDATE checklist_templates SET name = 'SML2 - EREMA' WHERE name = 'EREMA 2' RETURNING id, name`
        );
        console.log('Additional EREMA 2 reverted:', t4.rows);

        console.log('Done.');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
revertEremaNames();
