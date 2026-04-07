const db = require('./src/config/db');

async function archiveOldCortadoraChecklist() {
    try {
        console.log('Archiving old Checklist Cortadoras de Cinta...');

        const result = await db.query(`
            UPDATE checklist_templates 
            SET asset_category = 'ARCHIVED'
            WHERE name = 'Checklist Cortadoras de Cinta'
            RETURNING id, name, asset_category
        `);

        if (result.rows.length > 0) {
            console.log(`Archived template: ${result.rows[0].name} (ID: ${result.rows[0].id}) to category: ${result.rows[0].asset_category}`);
        } else {
            console.log('Old template not found.');
        }

        process.exit(0);

    } catch (error) {
        console.error('Error archiving checklist:', error);
        process.exit(1);
    }
}

archiveOldCortadoraChecklist();
