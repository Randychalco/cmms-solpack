const db = require('./src/config/db');

async function updatePreestirado() {
    try {
        const res = await db.query("SELECT id, name, items FROM checklist_templates WHERE asset_category = 'PREESTIRADO'");
        
        console.log(`Found ${res.rows.length} Preestirado templates to update.`);

        for (const template of res.rows) {
            let items = typeof template.items === 'string' ? JSON.parse(template.items) : template.items;
            
            if (!items.sections) continue;

            const safetySection = items.sections.find(s => s.id === 'seguridad_operativa');
            if (safetySection && safetySection.rows) {
                // Remove the row
                safetySection.rows = safetySection.rows.filter(r => r.id !== 'seguridad_bloqueo');
                console.log(`- Removed 'seguridad_bloqueo' from ${template.name}`);
            }

            // Also remove duplicate emergency stop in electrical section if present
            const electricalSection = items.sections.find(s => s.id === 'sistema_electrico');
            if (electricalSection && electricalSection.rows) {
                electricalSection.rows = electricalSection.rows.filter(r => r.id !== 'func_emergencia');
            }

            await db.query('UPDATE checklist_templates SET items = $1 WHERE id = $2', [JSON.stringify(items), template.id]);
        }

        console.log('\nPreestirado checklists updated successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error updating Preestirado checklists:', error);
        process.exit(1);
    }
}

updatePreestirado();
