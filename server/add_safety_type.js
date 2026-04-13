const db = require('./src/config/db');

async function migrate() {
    try {
        console.log('--- STARTING SAFETY MODULE MIGRATION ---');
        
        // Add type column to checklist_templates
        await db.query(`ALTER TABLE checklist_templates ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'maintenance'`);
        
        // Update existing ones (just in case)
        await db.query(`UPDATE checklist_templates SET type = 'maintenance' WHERE type IS NULL`);
        
        console.log('Migration complete: Added type column to checklist_templates.');
    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        process.exit(0);
    }
}

migrate();
