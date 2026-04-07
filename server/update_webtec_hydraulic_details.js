const db = require('./src/config/db');

async function updateWebtecHydraulic() {
    try {
        const res = await db.query("SELECT id, name, items FROM checklist_templates WHERE name ILIKE '%Webtec%'");
        
        console.log(`Updating Hydraulic section for ${res.rows.length} WEBTEC templates.`);

        for (const template of res.rows) {
            let items = typeof template.items === 'string' ? JSON.parse(template.items) : template.items;
            
            if (!items.sections) continue;

            const hydraulicSection = items.sections.find(s => s.id === 'sistema_hidraulico');
            if (hydraulicSection && hydraulicSection.rows) {
                hydraulicSection.rows = [
                    { id: 'brazo_hidraulico', label: '11. Brazo hidráulico de la cubierta acústica', param: 'Funcionamiento', metodo: 'Prueba funcional' }
                ];
                console.log(`- Updated Hydraulic rows for ${template.name}`);
            }

            await db.query('UPDATE checklist_templates SET items = $1 WHERE id = $2', [JSON.stringify(items), template.id]);
        }

        console.log('\nWEBTEC Hydraulic section updated successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error updating WEBTEC Hydraulic:', error);
        process.exit(1);
    }
}

updateWebtecHydraulic();
