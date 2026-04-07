const db = require('./src/config/db');

async function archiveOldImpresoraChecklist() {
    try {
        console.log('Archiving old Checklist Impresoras de Cinta...');

        // Let's archive it instead of deleting it just in case there are execution records tied to it
        const result = await db.query(`
            UPDATE checklist_templates 
            SET asset_category = 'ARCHIVED'
            WHERE name = 'Checklist Impresoras de Cinta'
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

archiveOldImpresoraChecklist();
