const db = require('./src/config/db');

async function renameSmlChecklists() {
    try {
        await db.query(`
            UPDATE checklist_templates 
            SET name = 'Checklist Diario SML 1'
            WHERE name = 'Checklist Diario SML 1 (Matrix)'
        `);

        await db.query(`
            UPDATE checklist_templates 
            SET name = 'Checklist Diario SML 2'
            WHERE name = 'Checklist Diario SML 2 (Matrix)'
        `);

        console.log('Successfully renamed SML checklists (removed "Matrix").');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
renameSmlChecklists();
