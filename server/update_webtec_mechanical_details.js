const db = require('./src/config/db');

async function updateWebtecMechanical() {
    try {
        const res = await db.query("SELECT id, name, items FROM checklist_templates WHERE name ILIKE '%Webtec%'");
        
        console.log(`Updating Mechanical section for ${res.rows.length} WEBTEC templates.`);

        for (const template of res.rows) {
            let items = typeof template.items === 'string' ? JSON.parse(template.items) : template.items;
            
            if (!items.sections) continue;

            const mechanicalSection = items.sections.find(s => s.id === 'sistema_mecanico');
            if (mechanicalSection && mechanicalSection.rows) {
                mechanicalSection.rows = [
                    { id: 'transmision_fajas', label: '11. Sistema de transmisión de fajas y templadores', param: 'Tensión', metodo: 'Inspección manual' },
                    { id: 'transmision_cadena', label: '12. Sistema de transmisión de cadena', param: 'Lubricación', metodo: 'Inspección visual' },
                    { id: 'sistema_corte', label: '13. Sistema de corte', param: 'Desgaste', metodo: 'Inspección visual' },
                    { id: 'ejes_bobinado', label: '14. Sistema de ejes de bobinado', param: 'Alineación', metodo: 'Inspección visual' },
                    { id: 'cubierta_acustica', label: '15. Cubierta acústica', param: 'Fijación', metodo: 'Inspección visual' }
                ];
                console.log(`- Updated Mechanical rows for ${template.name}`);
            }

            await db.query('UPDATE checklist_templates SET items = $1 WHERE id = $2', [JSON.stringify(items), template.id]);
        }

        console.log('\nWEBTEC Mechanical section updated successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error updating WEBTEC Mechanical:', error);
        process.exit(1);
    }
}

updateWebtecMechanical();
