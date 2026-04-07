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
                // Check if already exists
                if (!safetySection.rows.some(r => r.id === 'paro_emergencia')) {
                    safetySection.rows.push({ id: 'paro_emergencia', label: 'Prueba de paro de emergencia', param: 'Funcionamiento', metodo: 'Prueba funcional' });
                    console.log(`- Added 'paro_emergencia' back to ${template.name}`);
                }
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
