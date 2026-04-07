const db = require('./src/config/db');

async function seedImpresoraChecklists() {
    try {
        console.log('Seeding Impresora Checklists (Siat 1 to 3)...');

        // We use the exact same layout structure as Rebobinadora/Preestirado
        const columns = [
            { id: 'param', label: 'PARÁMETRO TÉCNICO', type: 'readonly' },
            { id: 'metodo', label: 'MÉTODO', type: 'readonly' },
            { id: 'estado', label: 'ESTADO', type: 'select' },
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
                        { id: 'paro_emergencia', label: 'Prueba de paro de emergencia', param: 'Funcionamiento', metodo: 'Prueba funcional' }
                    ]
                },
                {
                    id: 'controlador_digital',
                    title: 'CONTROLADOR DIGITAL DE METROS LINEALES',
                    type: 'matrix_status',
                    columns: columns,
                    rows: [
                        { id: 'r1', label: 'Estado de los pulsadores y botones', param: 'Respuesta eléctrica inmediata', metodo: 'Prueba funcional' }
                    ]
                },
                {
                    id: 'neumatica',
                    title: 'NEUMATICA',
                    type: 'matrix_status',
                    columns: columns,
                    rows: [
                        { id: 'func_bomba', label: 'Funcionamiento de bomba neumática', param: 'Presión operativa', metodo: 'Lectura de manómetro' },
                        { id: 'fugas_aire', label: 'Verificar si existe fugas de aire', param: 'Hermeticidad', metodo: 'Agua jabonosa' },
                        { id: 'unidad_mantenimiento', label: 'Verificar la unidad de mantenimiento', param: 'Filtrado de aire', metodo: 'Inspección visual' }
                    ]
                },
                {
                    id: 'sistema_electrico',
                    title: 'SISTEMA ELECTRICO',
                    type: 'matrix_status',
                    columns: columns,
                    rows: [
                        { id: 'insp_pulsadores', label: 'Inspección física de los pulsadores, selectores, y reguladores, leds.', param: 'Funcionamiento', metodo: 'Inspección visual' },
                        { id: 'insp_generador', label: 'Inspección visual del controlador del generador de tensión', param: 'Operatividad', metodo: 'Inspección visual' },
                        { id: 'insp_transformador', label: 'Inspección visual de transformador de alta', param: 'Integridad', metodo: 'Inspección visual' },
                        { id: 'insp_corona', label: 'Inspección visual del tratamiento de corona (manga)', param: 'Estado superficial', metodo: 'Inspección visual' },
                        { id: 'insp_motores', label: 'Inspección visual de motores', param: 'Condición física', metodo: 'Inspección visual' },
                        { id: 'insp_tablero', label: 'Inspección visual del tablero eléctrico', param: 'Orden y limpieza', metodo: 'Inspección visual' }
                    ]
                },
                {
                    id: 'sistema_mecanico',
                    title: 'SISTEMA MECANICO',
                    type: 'matrix_status',
                    columns: columns,
                    rows: [
                        { id: 'transmision_fajas', label: 'Verificar el estado optimo del sistema de transmisión de fajas y templadores', param: 'Tensión', metodo: 'Inspección manual' },
                        { id: 'transmision_cadena', label: 'Verificar el estado optimo del sistema de transmisión de cadena', param: 'Tensión', metodo: 'Inspección manual' },
                        { id: 'extraccion_gases', label: 'Verificar el estado optimo de extracción de gases', param: 'Flujo de aire', metodo: 'Observación' },
                        { id: 'ventiladores_gases', label: 'Verificar el sistema de extracción de gases (ventiladores)', param: 'Funcionamiento', metodo: 'Observación' }
                    ]
                }
            ]
        };

        const machines = ['Siat 1', 'Siat 2', 'Siat 3'];

        for (const machine of machines) {
            const templateName = `RUTINA DE INSPECCION GENERAL - Impresora ${machine}`;

            // Check if it already exists
            const existing = await db.query('SELECT id FROM checklist_templates WHERE name = $1', [templateName]);

            if (existing.rows.length > 0) {
                console.log(`- Template '${templateName}' already exists. Updating...`);
                await db.query(`
                    UPDATE checklist_templates 
                    SET items = $1, layout = 'sml2_matrix', asset_category = 'CINTAS_IMPRESORAS'
                    WHERE name = $2
                `, [JSON.stringify(checklistItems), templateName]);
            } else {
                console.log(`- Creating template: '${templateName}'`);
                await db.query(`
                    INSERT INTO checklist_templates (name, asset_category, layout, items)
                    VALUES ($1, $2, $3, $4)
                `, [templateName, 'CINTAS_IMPRESORAS', 'sml2_matrix', JSON.stringify(checklistItems)]);
            }
        }

        console.log('\nSuccessfully seeded all IMPRESORAS DE CINTAS checklists.');
        process.exit(0);

    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
}

seedImpresoraChecklists();
