const db = require('./src/config/db');

async function deleteBaseChecklist() {
    try {
        console.log('Deleting base Rebobinadora template...');

        const result = await db.query(`
            DELETE FROM checklist_templates 
            WHERE name = 'RUTINA DE INSPECCION GENERAL - Rebobinadora'
            RETURNING id, name
        `);

        if (result.rows.length > 0) {
            console.log(`Deleted template: ${result.rows[0].name} (ID: ${result.rows[0].id})`);
        } else {
            console.log('Base template not found. It might have already been deleted.');
        }

        process.exit(0);

    } catch (error) {
        console.error('Error deleting checklist:', error);
        process.exit(1);
    }
}

deleteBaseChecklist();
