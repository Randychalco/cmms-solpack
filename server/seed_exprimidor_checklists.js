const db = require('./src/config/db');

async function seedExprimidorChecklists() {
    try {
        console.log('Seeding Exprimidor Checklists (1 & 2)...');

        // Matrix Structure (from the image)
        const columns = [
            { id: 'param', label: 'PARÁMETRO TÉCNICO', type: 'readonly' },
            { id: 'metodo', label: 'MÉTODO', type: 'readonly' },
            { id: 'estado', label: 'ESTADO', type: 'select' },
            { id: 'obs', label: 'OBSERVACIONES', type: 'text' }
        ];

        // Temperature Structure (from the second part of the image)
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
                        { id: 'p1', label: 'Verificar estado de tornillo sin fin (sonidos, vibraciones)', param: 'Vibración', metodo: 'Observación' },
                        { id: 'p2', label: 'Verificar estado de correas de transmision', param: 'Tensión', metodo: 'Inspección manual' },
                        { id: 'p3', label: 'Verificar lubricacion de las chumacera del eje de sinfín', param: 'Lubricación', metodo: 'Inspección visual' },
                        { id: 'p5', label: 'Verificar correcto nivel de aceite del reductor', param: 'Nivel', metodo: 'Inspección visual' },
                        { id: 'p6', label: 'Inspección de motor eléctrico principal (sonidos, vibraciones, lubricacion)', param: 'Vibración', metodo: 'Observación' },
                        { id: 'p7', label: 'Inspección de motor eléctrico soplador (sonidos, vibraciones)', param: 'Vibración', metodo: 'Observación' },
                        { id: 'p10', label: 'Inspección de Tablero electrico.', param: 'Orden', metodo: 'Inspección visual' }
                    ]
                },
                {
                    id: 'registro_temperatura',
                    title: 'REGISTRO DE TEMPERATURA',
                    type: 'matrix_numeric',
                    columns: tempColumns,
                    rows: [
                        { id: 't1', label: 'Motor Electrico Principal', nominal_val: '40-60°c' },
                        { id: 't2', label: 'Reductor', nominal_val: '40-60°c' },
                        { id: 't3', label: 'Motor Electrico soplador', nominal_val: '40-60°c' }
                    ]
                }
            ]
        };

        const machines = ['1', '2'];

        for (const machine of machines) {
            const templateName = `RUTINA DE INSPECCION GENERAL - Exprimidor ${machine}`;

            const existing = await db.query('SELECT id FROM checklist_templates WHERE name = $1', [templateName]);

            if (existing.rows.length > 0) {
                console.log(`- Template '${templateName}' already exists. Updating...`);
                await db.query(`
                    UPDATE checklist_templates 
                    SET items = $1, layout = 'sml2_matrix', asset_category = 'BEIER_EXPRIMIDOR'
                    WHERE name = $2
                `, [JSON.stringify(checklistItems), templateName]);
            } else {
                console.log(`- Creating template: '${templateName}'`);
                await db.query(`
                    INSERT INTO checklist_templates (name, asset_category, layout, items)
                    VALUES ($1, $2, $3, $4)
                `, [templateName, 'BEIER_EXPRIMIDOR', 'sml2_matrix', JSON.stringify(checklistItems)]);
            }
        }

        console.log('\nSuccessfully seeded all EXPRIMIDOR checklists.');
        process.exit(0);

    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
}

seedExprimidorChecklists();
