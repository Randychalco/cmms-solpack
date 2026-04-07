const db = require('./src/config/db');

async function updateWebtecNeumatica() {
    try {
        const res = await db.query("SELECT id, name, items FROM checklist_templates WHERE name ILIKE '%Webtec%'");
        
        console.log(`Updating Neumática section for ${res.rows.length} WEBTEC templates.`);

        for (const template of res.rows) {
            let items = typeof template.items === 'string' ? JSON.parse(template.items) : template.items;
            
            if (!items.sections) continue;

            const neumaticaSection = items.sections.find(s => s.id === 'neumatica');
            if (neumaticaSection && neumaticaSection.rows) {
                neumaticaSection.rows = [
                    { id: 'eje_cargado', label: '2. Funcionamiento óptimo de eje cargado de tubo', param: 'Presión', metodo: 'Inspección operativa' },
                    { id: 'fugas_aire', label: '3. Verificar si existen fugas de aire', param: 'Hermeticidad', metodo: 'Inspección visual' },
                    { id: 'unidad_mantenimiento', label: '4. Verificar la unidad de mantenimiento (FRL)', param: 'Lubricación', metodo: 'Inspección visual' },
                    { id: 'freno_neumatico', label: '5. Verificar freno neumático', param: 'Funcionamiento', metodo: 'Prueba funcional' },
                    { id: 'trabador_bobina', label: '6. Verificar trabador de tapa de bobina (cubierta acústica)', param: 'Fijación', metodo: 'Inspección manual' }
                ];
                console.log(`- Updated Neumática rows for ${template.name}`);
            }

            await db.query('UPDATE checklist_templates SET items = $1 WHERE id = $2', [JSON.stringify(items), template.id]);
        }

        console.log('\nWEBTEC Neumática section updated successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error updating WEBTEC Neumática:', error);
        process.exit(1);
    }
}

updateWebtecNeumatica();
