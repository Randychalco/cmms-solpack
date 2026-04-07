const db = require('./src/config/db');

async function deleteDuplicates() {
    try {
        // Check current state
        const all = await db.query(
            `SELECT id, name, asset_category FROM checklist_templates WHERE name IN ('SML1 - EREMA', 'SML2 - EREMA') ORDER BY name, id`
        );
        console.log('Current EREMA templates:');
        all.rows.forEach(r => console.log(` ID: ${r.id} | Name: ${r.name} | Category: ${r.asset_category}`));

        const sml1 = all.rows.filter(r => r.name === 'SML1 - EREMA');
        const sml2 = all.rows.filter(r => r.name === 'SML2 - EREMA');

        // For SML1: keep lowest id, delete rest
        if (sml1.length > 1) {
            const keepId = sml1[0].id;
            const toDelete = sml1.slice(1).map(r => r.id);
            console.log(`\nSML1 - EREMA: keeping ID ${keepId}, deleting IDs: ${toDelete}`);

            for (const id of toDelete) {
                // Reassign any checklist_executions referencing the duplicate to the one we keep
                await db.query(
                    `UPDATE checklist_executions SET template_id = $1 WHERE template_id = $2`,
                    [keepId, id]
                );
                // Also update work_orders if they reference by template
                await db.query(
                    `UPDATE work_orders SET checklist_template_id = $1 WHERE checklist_template_id = $2`,
                    [keepId, id]
                ).catch(() => {}); // ignore if column doesn't exist
                await db.query(`DELETE FROM checklist_templates WHERE id = $1`, [id]);
                console.log(`  Deleted duplicate ID ${id}`);
            }
        }

        // For SML2: keep lowest id, delete rest
        if (sml2.length > 1) {
            const keepId = sml2[0].id;
            const toDelete = sml2.slice(1).map(r => r.id);
            console.log(`\nSML2 - EREMA: keeping ID ${keepId}, deleting IDs: ${toDelete}`);

            for (const id of toDelete) {
                await db.query(
                    `UPDATE checklist_executions SET template_id = $1 WHERE template_id = $2`,
                    [keepId, id]
                );
                await db.query(
                    `UPDATE work_orders SET checklist_template_id = $1 WHERE checklist_template_id = $2`,
                    [keepId, id]
                ).catch(() => {});
                await db.query(`DELETE FROM checklist_templates WHERE id = $1`, [id]);
                console.log(`  Deleted duplicate ID ${id}`);
            }
        }

        // Verify
        const after = await db.query(
            `SELECT id, name, asset_category FROM checklist_templates WHERE name IN ('SML1 - EREMA', 'SML2 - EREMA') ORDER BY name, id`
        );
        console.log('\nAfter cleanup:');
        after.rows.forEach(r => console.log(` ID: ${r.id} | Name: ${r.name} | Category: ${r.asset_category}`));

        console.log('\nDone.');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
deleteDuplicates();
