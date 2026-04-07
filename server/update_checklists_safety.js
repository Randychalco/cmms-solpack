const db = require('./src/config/db');

async function updateChecklistsSafety() {
    try {
        console.log('Starting migration: Adding SEGURIDAD OPERATIVA section to checklists...');

        const targetCategories = [
            'EXTRUSION',
            'EXTRUSION_2_EREMA1',
            'EXTRUSION_2_EREMA2',
            'EXTRUSION_2_SML1',
            'EXTRUSION_2_SML2',
            'PELETIZADORA',
            'PREESTIRADO'
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
                { id: 'paro_emergencia', label: 'Prueba de paro de emergencia', param: 'Funcionamiento', metodo: 'Prueba funcional' },
                { id: 'sensores_cortina', label: 'Sensores y cortina de luz', param: 'Detección', metodo: 'Prueba funcional' },
                { id: 'seguridad_bloqueo', label: 'Interruptor de seguridad de bloqueo', param: 'Funcionamiento', metodo: 'Prueba funcional' }
            ]
        };

        const { rows: templates } = await db.query(
            "SELECT id, name, asset_category, items FROM checklist_templates WHERE asset_category = ANY($1)",
            [targetCategories]
        );

        console.log(`Found ${templates.length} templates to update.`);

        for (const template of templates) {
            let items = typeof template.items === 'string' ? JSON.parse(template.items) : template.items;
            
            if (!items.sections) {
                console.warn(`Template '${template.name}' (${template.id}) has no sections array. Skipping.`);
                continue;
            }

            // Check if it already exists
            const alreadyHasSafety = items.sections.some(s => s.id === 'seguridad_operativa');
            
            if (alreadyHasSafety) {
                console.log(`- Template '${template.name}' already has SEGURIDAD OPERATIVA section. Skipping.`);
                continue;
            }

            console.log(`- Updating template: '${template.name}'...`);
            
            // Add to the beginning of sections
            items.sections.unshift(safetySection);

            await db.query(
                "UPDATE checklist_templates SET items = $1 WHERE id = $2",
                [JSON.stringify(items), template.id]
            );
        }

        console.log('\nMigration completed successfully.');
        process.exit(0);

    } catch (error) {
        console.error('Error during migration:', error);
        process.exit(1);
    }
}

updateChecklistsSafety();
