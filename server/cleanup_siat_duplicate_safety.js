const db = require('./src/config/db');

async function cleanupSiat() {
    try {
        const res = await db.query("SELECT id, name, items FROM checklist_templates WHERE name ILIKE '%Siat%'");
        
        console.log(`Found ${res.rows.length} SIAT templates to clean up.`);

        for (const template of res.rows) {
            let items = typeof template.items === 'string' ? JSON.parse(template.items) : template.items;
            
            if (!items.sections) continue;

            // Ensure SEGURIDAD OPERATIVA exists (should have been added by previous migration)
            let safetySection = items.sections.find(s => s.id === 'seguridad_operativa');
            if (!safetySection) {
                safetySection = {
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
                items.sections.unshift(safetySection);
                console.log(`- Added missing safety section to ${template.name}`);
            }

            // Remove duplicate in SISTEMA ELECTRICO
            const electricalSection = items.sections.find(s => s.id === 'sistema_electrico');
            if (electricalSection && electricalSection.rows) {
                const initialCount = electricalSection.rows.length;
                electricalSection.rows = electricalSection.rows.filter(r => r.id !== 'func_emergencia');
                if (electricalSection.rows.length < initialCount) {
                    console.log(`- Removed duplicate 'func_emergencia' from ${template.name}`);
                }
            }

            await db.query('UPDATE checklist_templates SET items = $1 WHERE id = $2', [JSON.stringify(items), template.id]);
        }

        console.log('\nSIAT checklists cleaned up successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error cleaning up SIAT checklists:', error);
        process.exit(1);
    }
}

cleanupSiat();
