const db = require('./src/config/db');

async function seedSiloChecklists() {
    try {
        console.log('Seeding Silo Checklists (1 & 2)...');

        // Matrix Structure
        const columns = [
            { id: 'param', label: 'PARÁMETRO TÉCNICO', type: 'readonly' },
            { id: 'metodo', label: 'MÉTODO', type: 'readonly' },
            { id: 'estado', label: 'ESTADO', type: 'select' },
            { id: 'obs', label: 'OBSERVACIONES', type: 'text' }
        ];

        // Temperature Structure
        const tempColumns = [
            { id: 'nominal', label: 'T°C NOMINAL', type: 'text', readOnly: true },
            { id: 'real', label: 'T°C REAL', type: 'number' },
            { id: 'obs', label: 'OBSERVACIONES', type: 'text' }
        ];

        const checklistItems = {
            version: '1.0',
            sections: [
                {
                    id: 'seguridad_operativa',
                    title: '⚠️ SEGURIDAD OPERATIVA',
                    type: 'matrix_status',
                    columns: columns,
                    rows: [
                        { id: 'estado_guardas', label: 'Estado de guardas', param: 'Fijación', metodo: 'Inspección visual' },
                        { id: 'paro_emergencia', label: 'Prueba de paro de emergencia', param: 'Funcionamiento', metodo: 'Prueba funcional' },
                        { id: 'seguridad_bloqueo', label: 'Interruptor de seguridad de bloqueo', param: 'Funcionamiento', metodo: 'Prueba funcional' }
                    ]
                },
                {
                    id: 'inspeccion_general',
                    title: 'PUNTOS DE INSPECCION',
                    type: 'matrix_status',
                    columns: columns,
                    rows: [
                        { id: 'p1', label: 'Chumaceras', param: 'Lubricación', metodo: 'Inspección visual' },
                        { id: 'p2', label: 'Faja transportadora', param: 'Integridad', metodo: 'Inspección visual' },
                        { id: 'p3', label: 'Transmisión de paletas', param: 'Tensión', metodo: 'Inspección manual' },
                        { id: 'p4', label: 'Transmisión mecánica de faja', param: 'Tensión', metodo: 'Inspección manual' },
                        { id: 'p5', label: 'Puertas de salida', param: 'Cierre', metodo: 'Inspección visual' },
                        { id: 'p6', label: 'Estructura del silo', param: 'Integridad', metodo: 'Inspección visual' },
                        { id: 'p7', label: 'Escalera y plataforma', param: 'Seguridad', metodo: 'Inspección visual' },
                        { id: 'p8', label: 'Pulsadores', param: 'Respuesta', metodo: 'Prueba funcional' }
                    ]
                },
                {
                    id: 'registro_temperatura',
                    title: 'REGISTRO DE TEMPERATURA',
                    type: 'matrix_numeric',
                    columns: tempColumns,
                    rows: [
                        { id: 't1', label: 'Motor Electrico faja transportadora', nominal_val: '40-60°c' },
                        { id: 't2', label: 'reductor faja transpotadora', nominal_val: '40-60°c' },
                        { id: 't3', label: 'Motor de distribucion por paletas', nominal_val: '40-60°c' },
                        { id: 't4', label: 'reductor de distribucion por paletas', nominal_val: '40-60°c' }
                    ]
                }
            ]
        };

        const machines = ['1', '2'];

        for (const machine of machines) {
            const templateName = `RUTINA DE INSPECCION GENERAL - Silo ${machine}`;

            const existing = await db.query('SELECT id FROM checklist_templates WHERE name = $1', [templateName]);

            if (existing.rows.length > 0) {
                console.log(`- Template '${templateName}' already exists. Updating...`);
                await db.query(`
                    UPDATE checklist_templates 
                    SET items = $1, layout = 'sml2_matrix', asset_category = 'BEIER_SILO'
                    WHERE name = $2
                `, [JSON.stringify(checklistItems), templateName]);
            } else {
                console.log(`- Creating template: '${templateName}'`);
                await db.query(`
                    INSERT INTO checklist_templates (name, asset_category, layout, items)
                    VALUES ($1, $2, $3, $4)
                `, [templateName, 'BEIER_SILO', 'sml2_matrix', JSON.stringify(checklistItems)]);
            }
        }

        console.log('\nSuccessfully seeded SILO checklists.');
        process.exit(0);

    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
}

seedSiloChecklists();
