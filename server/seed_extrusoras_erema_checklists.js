const db = require('./src/config/db');

async function seedExtrusoraEremaChecklists() {
    try {
        console.log('Seeding EXTRUSORA EREMA Checklists (1 & 2)...');

        const columns = [
            { id: 'param', label: 'PARÁMETRO TÉCNICO', type: 'readonly' },
            { id: 'metodo', label: 'MÉTODO', type: 'readonly' },
            { id: 'estado', label: 'ESTADO', type: 'select' },
            { id: 'obs', label: 'OBSERVACIONES', type: 'text' }
        ];

        const tempColumns = [
            { id: 'nominal', label: 'T° NOMINAL', type: 'text', readOnly: true },
            { id: 'real', label: 'T° REAL', type: 'number' },
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
                        { id: 'sensores_cortina', label: 'Sensores y cortina de luz', param: 'Detección', metodo: 'Prueba funcional' },
                        { id: 'seguridad_bloqueo', label: 'Interruptor de seguridad de bloqueo', param: 'Funcionamiento', metodo: 'Prueba funcional' }
                    ]
                },
                {
                    id: 'preacondicionamiento',
                    title: 'SISTEMA DE PREACONDICIONAMIENTO',
                    type: 'matrix_status',
                    columns: columns,
                    rows: [
                        { id: 'p1_2', label: 'Cuchillas moviles de PCU', param: 'Desgaste ≤ 30%', metodo: 'Inspeccion visual' },
                        { id: 'p1_3', label: 'Torque motor alimentador', param: 'Dentro de rango nominal', metodo: 'HMI / Variador' },
                        { id: 'p1_4', label: 'Sensores de nivel/material', param: 'Señal estable', metodo: 'Diagnóstico PLC' },
                        { id: 'p1_5', label: 'Tensión de faja', param: 'Deflexión correcta', metodo: 'Según fabricante (≈10-15)' },
                        { id: 'p1_6', label: 'Desgaste lateral de faja', param: 'Sin grietas ni', metodo: 'Inspección visual' },
                        { id: 'p1_7', label: 'Activación eléctrica', param: 'Voltaje correcto', metodo: 'Multímetro' },
                        { id: 'p1_8', label: 'Caudal agua', param: 'Flujo continuo', metodo: 'Verificación visual' }
                    ]
                },
                {
                    id: 'extrusion',
                    title: 'UNIDAD DE EXTRUSIÓN',
                    type: 'matrix_status',
                    columns: columns,
                    rows: [
                        { id: 'p2_1', label: 'Consumo motor principal', param: '±5% nominal', metodo: 'HMI' },
                        { id: 'p2_2', label: 'Presión de fusión', param: 'Estable sin picos', metodo: 'Manómetro digital' },
                        { id: 'p2_3', label: 'Temperatura zonas', param: '±3°C consigna', metodo: 'HMI' },
                        { id: 'p2_4', label: 'Termopares', param: 'Sin fallas / error', metodo: 'Diagnóstico PLC' },
                        { id: 'p2_5', label: 'Resistencia calefactora', param: 'Sin zones frías', metodo: 'Cámara térmica' },
                        { id: 'p2_6', label: 'Ventiladores enfriamiento', param: 'Operativos', metodo: 'Inspección visual' }
                    ]
                },
                {
                    id: 'pelletizado',
                    title: 'PELLETIZADO / CORTE',
                    type: 'matrix_status',
                    columns: columns,
                    rows: [
                        { id: 'p5_1', label: 'Cuchillas corte', param: 'Afilado uniforme', metodo: 'Inspección visual' },
                        { id: 'p5_2', label: 'Vibración motor pelletizador', param: '≤ valores nominales', metodo: 'Vibrómetro' },
                        { id: 'p5_3', label: 'Flujo agua enfriamiento', param: 'Continuo / sin', metodo: 'Inspección visual' },
                        { id: 'p5_4', label: 'Calidad pellet', param: 'Diámetro uniforme', metodo: 'Muestra física' }
                    ]
                },
                {
                    id: 'electrico',
                    title: 'SISTEMA ELÉCTRICO Y CONTROL',
                    type: 'matrix_status',
                    columns: columns,
                    rows: [
                        { id: 'p6_1', label: 'Alarmas activas', param: 'Ninguna pendiente', metodo: 'HMI' },
                        { id: 'p6_2', label: 'Variadores de frecuencia', param: 'Sin fallas', metodo: 'Panel eléctrico' },
                        { id: 'p6_3', label: 'Bornes eléctricos', param: 'Ajuste firme', metodo: 'Torque manual' },
                        { id: 'p6_4', label: 'Limpieza tablero', param: 'Sin polvo excesivo', metodo: 'Inspección' }
                    ]
                },
                {
                    id: 'hidraulico',
                    title: 'SISTEMA HIDRÁULICO',
                    type: 'matrix_status',
                    columns: columns,
                    rows: [
                        { id: 'p7_1', label: 'Nivel aceite hidráulico', param: 'Dentro rango', metodo: 'Visor nivel' },
                        { id: 'p7_2', label: 'Temp. aceite', param: '< 60°C (referencial)', metodo: 'Termómetro' },
                        { id: 'p7_3', label: 'Fugas en mangueras', param: 'Ninguna', metodo: 'Inspección visual' },
                        { id: 'p7_4', label: 'Presión sistema', param: 'Según especificación', metodo: 'Manómetro' }
                    ]
                },
                {
                    id: 'registro_temperatura',
                    title: 'REGISTRO DE TEMPERATURA',
                    type: 'matrix_numeric',
                    columns: tempColumns,
                    rows: [
                        { id: 't1', label: 'MOTOR DE PCU (Process Cooling Unit)', nominal_val: '50 - 65 °C' },
                        { id: 't2', label: 'MOTOR DE EXTRUSORA (principal)', nominal_val: '65 - 85 °C' },
                        { id: 't3', label: 'MOTOR PELETIZADOR', nominal_val: '60 - 75 °C' },
                        { id: 't4', label: 'MOTOR DE CENTRIFUGADO', nominal_val: '55 - 70 °C' },
                        { id: 't5', label: 'MOTOR VIBRADOR', nominal_val: '60 - 80 °C' },
                        { id: 't6', label: 'ELECTROBOMBA (agua)', nominal_val: '50 - 70 °C' },
                        { id: 't7', label: 'BOMBA HIDRÁULICA (motor)', nominal_val: '60 - 80 °C' },
                        { id: 't8', label: 'MOTOR ALIMENTADOR DE REFIL', nominal_val: '40 - 60 °C' }
                    ]
                }
            ]
        };

        const machines = [
            { num: '1', category: 'EXTRUSION_2_EREMA1' },
            { num: '2', category: 'EXTRUSION_2_EREMA2' }
        ];

        // Clean any stray ones inside the general EXTRUSION_2 parent category
        // await db.query("DELETE FROM checklist_templates WHERE name LIKE '%EREMA%' AND asset_category LIKE 'EXTRUSION_2%'");

        for (const { num, category } of machines) {
            const templateName = `SML${num} - EREMA`;

            const existing = await db.query('SELECT id FROM checklist_templates WHERE name = $1 AND asset_category = $2', [templateName, category]);

            if (existing.rows.length > 0) {
                console.log(`- Template '${templateName}' already exists. Updating...`);
                await db.query(`
                    UPDATE checklist_templates 
                    SET items = $1, layout = 'sml2_matrix', asset_category = $2
                    WHERE name = $3
                `, [JSON.stringify(checklistItems), category, templateName]);
            } else {
                console.log(`- Creating template: '${templateName}'`);
                await db.query(`
                    INSERT INTO checklist_templates (name, asset_category, layout, items)
                    VALUES ($1, $2, $3, $4)
                `, [templateName, category, 'sml2_matrix', JSON.stringify(checklistItems)]);
            }
        }

        console.log('\nSuccessfully seeded EXTRUSORA EREMA sub-module checklists.');
        process.exit(0);

    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
}

seedExtrusoraEremaChecklists();
