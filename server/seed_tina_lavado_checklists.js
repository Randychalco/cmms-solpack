const db = require('./src/config/db');

async function seedTinaLavadoChecklists() {
    try {
        console.log('Seeding Tina de Lavado Checklists (1 & 2)...');

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
                        { id: 'p1', label: 'Motor eléctrico principal', param: 'Vibración', metodo: 'Observación en operación' },
                        { id: 'p2', label: 'Reductor principal', param: 'Ruido', metodo: 'Observación en operación' },
                        { id: 'p3', label: 'Nivel de aceite reductor principal', param: 'Nivel', metodo: 'Inspección visual' },
                        { id: 'p4', label: 'Cadena de transmisión', param: 'Tensión', metodo: 'Inspección manual' },
                        { id: 'p5', label: 'Motorreductor Agitador #1', param: 'Vibración', metodo: 'Observación en operación' },
                        { id: 'p6', label: 'Chumaceras Agitador #1', param: 'Lubricación', metodo: 'Inspección visual' },
                        { id: 'p7', label: 'Paletas Agitador #1', param: 'Desgaste', metodo: 'Inspección visual' },
                        { id: 'p8', label: 'Motorreductor Agitador #2', param: 'Vibración', metodo: 'Observación en operación' },
                        { id: 'p9', label: 'Chumaceras Agitador #2', param: 'Lubricación', metodo: 'Inspección visual' },
                        { id: 'p10', label: 'Paletas Agitador #2', param: 'Desgaste', metodo: 'Inspección visual' },
                        { id: 'p11', label: 'Motorreductor Agitador #3', param: 'Vibración', metodo: 'Observación en operation' },
                        { id: 'p12', label: 'Chumaceras Agitador #3', param: 'Lubricación', metodo: 'Inspección visual' },
                        { id: 'p13', label: 'Paletas Agitador #3', param: 'Desgaste', metodo: 'Inspección visual' },
                        { id: 'p14', label: 'Motorreductor Agitador #4', param: 'Vibración', metodo: 'Observación en operation' },
                        { id: 'p15', label: 'Chumaceras Agitador #4', param: 'Lubricación', metodo: 'Inspección visual' },
                        { id: 'p16', label: 'Paletas Agitador #4', param: 'Desgaste', metodo: 'Inspección visual' },
                        { id: 'p17', label: 'Motorreductor Agitador #5', param: 'Vibración', metodo: 'Observación en operation' },
                        { id: 'p18', label: 'Chumaceras Agitador #5', param: 'Lubricación', metodo: 'Inspección visual' },
                        { id: 'p19', label: 'Paletas Agitador #5', param: 'Desgaste', metodo: 'Inspección visual' },
                        { id: 'p20', label: 'Motorreductor Agitador #6', param: 'Vibración', metodo: 'Observación en operation' },
                        { id: 'p21', label: 'Chumaceras Agitador #6', param: 'Lubricación', metodo: 'Inspección visual' },
                        { id: 'p22', label: 'Paletas Agitador #6', param: 'Desgaste', metodo: 'Inspección visual' },
                        { id: 'p23', label: 'Banda transportadora sumergible', param: 'Integridad', metodo: 'Inspección visual' },
                        { id: 'p24', label: 'Motor eléctrico banda sumergible', param: 'Vibración', metodo: 'Observación en operation' },
                        { id: 'p25', label: 'Reductor banda sumergible', param: 'Ruido', metodo: 'Observación en operation' },
                        { id: 'p26', label: 'Sinfín lateral', param: 'Desgaste', metodo: 'Inspección visual' },
                        { id: 'p27', label: 'Motorreductor sinfín lateral', param: 'Vibración', metodo: 'Observación en operation' },
                        { id: 'p28', label: 'Cadena sinfín lateral', param: 'Tensión', metodo: 'Inspección manual' },
                        { id: 'p29', label: 'Reductor sinfín lateral', param: 'Ruido', metodo: 'Observación en operation' },
                        { id: 'p30', label: 'Fugas de agua', param: 'Hermeticidad', metodo: 'Inspección visual' }
                    ]
                },
                {
                    id: 'registro_temperatura',
                    title: 'REGISTRO DE TEMPERATURA',
                    type: 'matrix_numeric',
                    columns: tempColumns,
                    rows: [
                        { id: 't1', label: 'Motor Electrico principal', nominal_val: '40-60°c' },
                        { id: 't2', label: 'reductor principal', nominal_val: '40-60°c' },
                        { id: 't3', label: 'Motorreductor Agitador #1', nominal_val: '40-60°c' },
                        { id: 't4', label: 'Motorreductor Agitador #2', nominal_val: '40-60°c' },
                        { id: 't5', label: 'Motorreductor Agitador #3', nominal_val: '40-60°c' },
                        { id: 't6', label: 'Motorreductor Agitador #4', nominal_val: '40-60°c' },
                        { id: 't7', label: 'Motorreductor Agitador #5', nominal_val: '40-60°c' },
                        { id: 't8', label: 'Motorreductor Agitador #6', nominal_val: '40-60°c' },
                        { id: 't9', label: 'Motor Electrico Banda sumergible', nominal_val: '40-60°c' },
                        { id: 't10', label: 'reductoe Banda sumergible', nominal_val: '40-60°c' },
                        { id: 't11', label: 'Motor Electrico sinfin lateral', nominal_val: '40-60°c' },
                        { id: 't12', label: 'Reductor de sinfin lateral', nominal_val: '40-60°c' }
                    ]
                }
            ]
        };

        const machines = ['1', '2'];

        for (const machine of machines) {
            const templateName = `RUTINA DE INSPECCION GENERAL - Tina de Lavado ${machine}`;

            const existing = await db.query('SELECT id FROM checklist_templates WHERE name = $1', [templateName]);

            if (existing.rows.length > 0) {
                console.log(`- Template '${templateName}' already exists. Updating...`);
                await db.query(`
                    UPDATE checklist_templates 
                    SET items = $1, layout = 'sml2_matrix', asset_category = 'BEIER_TINA'
                    WHERE name = $2
                `, [JSON.stringify(checklistItems), templateName]);
            } else {
                console.log(`- Creating template: '${templateName}'`);
                await db.query(`
                    INSERT INTO checklist_templates (name, asset_category, layout, items)
                    VALUES ($1, $2, $3, $4)
                `, [templateName, 'BEIER_TINA', 'sml2_matrix', JSON.stringify(checklistItems)]);
            }
        }

        console.log('\nSuccessfully seeded TINA DE LAVADO checklists.');
        process.exit(0);

    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
}

seedTinaLavadoChecklists();
