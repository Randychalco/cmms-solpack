const db = require('./src/config/db');

async function seedPreestiradoChecklists() {
    try {
        console.log('Seeding Preestirado Checklists (P1 to P5)...');

        // We use the exact same layout structure as Rebobinadora
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
                        { id: 'paro_emergencia', label: 'Prueba de paro de emergencia', param: 'Funcionamiento', metodo: 'Prueba funcional' },
                        { id: 'sensores_cortina', label: 'Sensores y cortina de luz', param: 'Detección', metodo: 'Prueba funcional' }
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
                        { id: 'func_pistones', label: 'Funcionamiento de pistones neumáticos', param: 'Carrera completa', metodo: 'Observación en operación' },
                        { id: 'fugas_aire', label: 'Verificar si existe fugas de aire', param: 'Hermeticidad', metodo: 'Agua jabonosa' },
                        { id: 'estado_manometros', label: 'Verificar estado de los manómetros', param: 'Precisión', metodo: 'Inspección visual' },
                        { id: 'insp_reguladores', label: 'Inspección de los reguladores de presión', param: 'Estabilidad', metodo: 'Verificación en manómetro' },
                        { id: 'estado_accionadores', label: 'Verificar el estado de los accionadores', param: 'Respuesta', metodo: 'Activación manual' },
                        { id: 'verif_transductor', label: 'Verificar transductor', param: 'Señal de salida', metodo: 'Medición eléctrica' }
                    ]
                },
                {
                    id: 'sistema_electrico',
                    title: 'SISTEMA ELECTRICO',
                    type: 'matrix_status',
                    columns: columns,
                    rows: [
                        { id: 'insp_electrovalvulas', label: 'Inspección de las electroválvulas', param: 'Activación', metodo: 'Prueba eléctrica' },
                        { id: 'temp_motores', label: 'Revisar temperatura de motores', param: 'Temperatura', metodo: 'Termómetro infrarrojo' },
                        { id: 'insp_pulsadores_velocidad', label: 'Inspección física de los pulsadores, selectores, y regulador de velocidad', param: 'Funcionamiento', metodo: 'Inspección visual' },
                        { id: 'barra_estatica', label: 'Verificar barra estática', param: 'Eliminación de carga', metodo: 'Medición estática' },
                        { id: 'motor_centrador', label: 'verificar el motor electrico de centrador de bobina', param: 'Operatividad', metodo: 'Prueba funcional' },
                        { id: 'sistema_corte', label: 'Verificar sistema de corte', param: 'Precisión de corte', metodo: 'Prueba operativa' }
                    ]
                },
                {
                    id: 'sistema_mecanico',
                    title: 'SISTEMA MECANICO',
                    type: 'matrix_status',
                    columns: columns,
                    rows: [
                        { id: 'pernos_anclaje', label: 'Verifique los pernos y tuercas de anclaje de manera general', param: 'Ajuste', metodo: 'Verificación manual' },
                        { id: 'porta_tuco_madre', label: 'Verificar estado y funcionamiento del porta tuco de bobina madre', param: 'Alineación', metodo: 'Observación' },
                        { id: 'porta_tuco_terminado', label: 'Verificar estado y funcionamiento del por tatuco de producto terminado', param: 'Sujeción', metodo: 'Inspección visual' },
                        { id: 'estado_estructura', label: 'Verificar el estado de la estructura (golpes o magulladuras)', param: 'Integridad', metodo: 'Inspección visual' },
                        { id: 'estado_fajas', label: 'Revisar estado de fajas', param: 'Tensión', metodo: 'Inspección visual' }
                    ]
                },
                {
                    id: 'sistema_embobinado',
                    title: 'SISTEMA DE EMBOBINADO',
                    type: 'matrix_status',
                    columns: columns,
                    rows: [
                        { id: 'rodillo_bobinador', label: 'Estado de rodillo bobinador', param: 'Giro uniforme', metodo: 'Observación' },
                        { id: 'rodillo_desbobinador', label: 'Estado de rodillo desbobinador', param: 'Giro libre', metodo: 'Observación' },
                        { id: 'estado_polines', label: 'Estado de polines', param: 'Rodamiento', metodo: 'Inspección manual' },
                        { id: 'rodillo_faja_arrastre', label: 'Estado de rodillo de arrastre o faja de arrastre', param: 'Tracción', metodo: 'Observación' },
                        { id: 'rodillo_pre_estiro', label: 'Estado de rodillo de pre estiro', param: 'Estiramiento', metodo: 'Prueba operativa' }
                    ]
                }
            ]
        };

        const machines = ['P1', 'P2', 'P3', 'P4', 'P5'];

        for (const machine of machines) {
            const templateName = `RUTINA DE INSPECCION GENERAL - Preestirado ${machine}`;

            // Check if it already exists
            const existing = await db.query('SELECT id FROM checklist_templates WHERE name = $1', [templateName]);

            if (existing.rows.length > 0) {
                console.log(`- Template '${templateName}' already exists. Updating...`);
                await db.query(`
                    UPDATE checklist_templates 
                    SET items = $1, layout = 'sml2_matrix', asset_category = 'PREESTIRADO'
                    WHERE name = $2
                `, [JSON.stringify(checklistItems), templateName]);
            } else {
                console.log(`- Creating template: '${templateName}'`);
                await db.query(`
                    INSERT INTO checklist_templates (name, asset_category, layout, items)
                    VALUES ($1, $2, $3, $4)
                `, [templateName, 'PREESTIRADO', 'sml2_matrix', JSON.stringify(checklistItems)]);
            }
        }

        console.log('\\nSuccessfully seeded all PREESTIRADO checklists.');
        process.exit(0);

    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
}

seedPreestiradoChecklists();
