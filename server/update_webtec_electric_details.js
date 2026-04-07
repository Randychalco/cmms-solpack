const db = require('./src/config/db');

async function updateWebtecElectric() {
    try {
        const res = await db.query("SELECT id, name, items FROM checklist_templates WHERE name ILIKE '%Webtec%'");
        
        console.log(`Updating Electrical section for ${res.rows.length} WEBTEC templates.`);

        for (const template of res.rows) {
            let items = typeof template.items === 'string' ? JSON.parse(template.items) : template.items;
            
            if (!items.sections) continue;

            const electricSection = items.sections.find(s => s.id === 'sistema_electrico');
            if (electricSection && electricSection.rows) {
                // Filter out the emergency stop if it somehow got back in, and update the others
                electricSection.rows = [
                    { id: 'insp_pulsadores', label: '8. Inspección física de pulsadores, selectores, reguladores y LEDs', param: 'Integridad', metodo: 'Inspección visual' },
                    { id: 'insp_motores', label: '9. Inspección visual de motores', param: 'Condición', metodo: 'Inspección visual' },
                    { id: 'insp_tablero', label: '10. Inspección visual del tablero eléctrico', param: 'Orden', metodo: 'Inspección visual' }
                ];
                console.log(`- Updated Electrical rows for ${template.name}`);
            }

            await db.query('UPDATE checklist_templates SET items = $1 WHERE id = $2', [JSON.stringify(items), template.id]);
        }

        console.log('\nWEBTEC Electrical section updated successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error updating WEBTEC Electric:', error);
        process.exit(1);
    }
}

updateWebtecElectric();
