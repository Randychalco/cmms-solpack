const db = require('./src/config/db');

async function updateRebobinado() {
    try {
        const res = await db.query("SELECT id, name, items FROM checklist_templates WHERE asset_category = 'REBOBINADO'");
        
        console.log(`Found ${res.rows.length} Rebobinado templates to update.`);

        for (const template of res.rows) {
            let items = typeof template.items === 'string' ? JSON.parse(template.items) : template.items;
            
            if (!items.sections) continue;

            const safetySection = items.sections.find(s => s.id === 'seguridad_operativa');
            if (safetySection && safetySection.rows) {
                // Remove the row
                safetySection.rows = safetySection.rows.filter(r => r.id !== 'paro_emergencia');
                console.log(`- Removed 'paro_emergencia' from ${template.name} safety section`);
            }

            // Also ensure it's not in the electrical section (already removed in previous turn, but being safe)
            const electricalSection = items.sections.find(s => s.id === 'sec_electrico');
            if (electricalSection && electricalSection.rows) {
                electricalSection.rows = electricalSection.rows.filter(r => r.id !== 'r8');
            }

            await db.query('UPDATE checklist_templates SET items = $1 WHERE id = $2', [JSON.stringify(items), template.id]);
        }

        console.log('\nRebobinado checklists updated successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error updating Rebobinado checklists:', error);
        process.exit(1);
    }
}

updateRebobinado();
