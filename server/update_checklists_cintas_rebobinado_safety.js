const db = require('./src/config/db');

async function updateChecklists() {
    try {
        const targetCategories = [
            'CINTAS_CORTADORAS',
            'CINTAS_IMPRESORAS',
            'REBOBINADO'
        ];

        const safetySection = {
            id: 'seguridad_operativa',
            title: '⚠️ SEGURIDAD OPERATIVA',
            type: 'matrix_status',
            columns: [
                { id: 'param', label: 'PARÁMETRO TÉCNICO', type: 'readonly' },
                { id: 'metodo', label: 'MÉTODO', type: 'readonly' },
                { id: 'estado', label: 'ESTADO', type: 'select' },
                { id: 'obs', label: 'OBSERVACIONES', type: 'text' }
            ],
            rows: [
                { id: 'estado_guardas', label: 'Estado de guardas', param: 'Fijación', metodo: 'Inspección visual' },
                { id: 'paro_emergencia', label: 'Prueba de paro de emergencia', param: 'Funcionamiento', metodo: 'Prueba funcional' }
            ]
        };

        const res = await db.query('SELECT id, name, items, asset_category FROM checklist_templates WHERE asset_category = ANY($1)', [targetCategories]);
        
        console.log(`Found ${res.rows.length} Cintas/Rebobinado templates to update.`);

        for (const template of res.rows) {
            let items = typeof template.items === 'string' ? JSON.parse(template.items) : template.items;
            
            if (!items.sections) {
                console.log(`- Skipping ${template.name}: No sections array found.`);
                continue;
            }

            // Check if it already has the safety section
            const hasSafety = items.sections.some(s => s.id === 'seguridad_operativa');
            if (hasSafety) {
                console.log(`- Skipping ${template.name}: Safety section already exists.`);
                continue;
            }

            // Add it at the beginning
            items.sections.unshift(safetySection);

            await db.query('UPDATE checklist_templates SET items = $1 WHERE id = $2', [JSON.stringify(items), template.id]);
            console.log(`- Updated template: '${template.name}' (${template.asset_category})`);
        }

        console.log('\nChecklists updated successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error updating checklists:', error);
        process.exit(1);
    }
}

updateChecklists();
