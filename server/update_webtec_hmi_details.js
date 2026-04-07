const db = require('./src/config/db');

async function updateWebtecHmi() {
    try {
        const res = await db.query("SELECT id, name, items FROM checklist_templates WHERE name ILIKE '%Webtec%'");
        
        console.log(`Updating HMI section for ${res.rows.length} WEBTEC templates.`);

        for (const template of res.rows) {
            let items = typeof template.items === 'string' ? JSON.parse(template.items) : template.items;
            
            if (!items.sections) continue;

            const hmiSection = items.sections.find(s => s.id === 'controlador_digital');
            if (hmiSection && hmiSection.rows) {
                hmiSection.rows = [
                    { id: 'estado_pantalla', label: '1. Estado físico óptimo de la pantalla', param: 'Integridad', metodo: 'Inspección visual' }
                ];
                console.log(`- Updated HMI rows for ${template.name}`);
            }

            await db.query('UPDATE checklist_templates SET items = $1 WHERE id = $2', [JSON.stringify(items), template.id]);
        }

        console.log('\nWEBTEC HMI section updated successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error updating WEBTEC HMI:', error);
        process.exit(1);
    }
}

updateWebtecHmi();
