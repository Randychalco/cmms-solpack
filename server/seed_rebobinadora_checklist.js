const db = require('./src/config/db');

async function seedRebobinadoraChecklist() {
    try {

        const items = {
            sections: [
                {
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
                },
                {
                    id: 'sec_controlador',
                    title: 'CONTROLADOR DIGITAL DE METROS LINEALES',
                    type: 'matrix_status',
                    columns: [
                        { id: 'param', label: 'PARÁMETRO TÉCNICO', type: 'readonly' },
                        { id: 'metodo', label: 'MÉTODO', type: 'readonly' },
                        { id: 'estado', label: 'ESTADO', type: 'select' },
                        { id: 'obs', label: 'OBSERVACIONES', type: 'text' }
                    ],
                    rows: [
                        { id: 'r1', label: 'Estado de los pulsadores y botones', param: 'Respuesta eléctrica inmediata', metodo: 'Prueba funcional' }
                    ]
                },
                {
                    id: 'sec_neumatica',
                    title: 'NEUMATICA',
                    type: 'matrix_status',
                    columns: [
                        { id: 'param', label: 'PARÁMETRO TÉCNICO', type: 'readonly' },
                        { id: 'metodo', label: 'MÉTODO', type: 'readonly' },
                        { id: 'estado', label: 'ESTADO', type: 'select' },
                        { id: 'obs', label: 'OBSERVACIONES', type: 'text' }
                    ],
                    rows: [
                        { id: 'r2', label: 'Funcionamiento de pistones neumáticos', param: 'Carrera completa', metodo: 'Observación en operación' },
                        { id: 'r3', label: 'Verificar si existe fugas de aire', param: 'Hermeticidad', metodo: 'Agua jabonosa' },
                        { id: 'r4', label: 'Verificar estado de los manómetros', param: 'Precisión de lectura', metodo: 'Inspección visual' },
                        { id: 'r5', label: 'Inspección de los reguladores de presión', param: 'Estabilidad de presión', metodo: 'Verificación en manómetro' },
                        { id: 'r6', label: 'Verificar el estado de los accionadores', param: 'Tiempo de respuesta', metodo: 'Activación manual' }
                    ]
                },
                {
                    id: 'sec_electrico',
                    title: 'SISTEMA ELECTRICO',
                    type: 'matrix_status',
                    columns: [
                        { id: 'param', label: 'PARÁMETRO TÉCNICO', type: 'readonly' },
                        { id: 'metodo', label: 'MÉTODO', type: 'readonly' },
                        { id: 'estado', label: 'ESTADO', type: 'select' },
                        { id: 'obs', label: 'OBSERVACIONES', type: 'text' }
                    ],
                    rows: [
                        { id: 'r9', label: 'Inspección de las electroválvulas', param: 'Activación correcta', metodo: 'Prueba eléctrica' },
                        { id: 'r10', label: 'Revisar temperatura de motor', param: 'Temperatura operativa', metodo: 'Termómetro infrarrojo' },
                        { id: 'r11', label: 'Inspección física de los pulsadores, selectores, y regulador de velocidad', param: 'Funcionamiento correcto', metodo: 'Inspección visual' }
                    ]
                },
                {
                    id: 'sec_mecanico',
                    title: 'SISTEMA MECANICO',
                    type: 'matrix_status',
                    columns: [
                        { id: 'param', label: 'PARÁMETRO TÉCNICO', type: 'readonly' },
                        { id: 'metodo', label: 'MÉTODO', type: 'readonly' },
                        { id: 'estado', label: 'ESTADO', type: 'select' },
                        { id: 'obs', label: 'OBSERVACIONES', type: 'text' }
                    ],
                    rows: [
                        { id: 'r14', label: 'Verifique los pernos y tuercas de anclaje de manera general', param: 'Ajuste firme', metodo: 'Verificación manual' },
                        { id: 'r15', label: 'Verificar estado y funcionamiento del porta tuco de bobina madre', param: 'Alineación', metodo: 'Observación' },
                        { id: 'r16', label: 'Verificar estado y funcionamiento del por tatuco de producto terminado', param: 'Sujeción', metodo: 'Inspección visual' },
                        { id: 'r17', label: 'Verificar reguladores para el centrado del circuito de lámina', param: 'Posicionamiento', metodo: 'Observación' },
                        { id: 'r18', label: 'Verificar el freno mecánico', param: 'Eficiencia de frenado', metodo: 'Prueba' },
                        { id: 'r19', label: 'Verificar el estado de la estructura (golpes o magulladuras)', param: 'Integridad estructural', metodo: 'Inspección visual' },
                        { id: 'cadena', label: 'Verificar el estado de la cadena', param: 'Tensión', metodo: 'Inspección manual' },
                        { id: 'r20', label: 'Revisar estado de fajas', param: 'Tensión', metodo: 'Inspección visual' }
                    ]
                },
                {
                    id: 'sec_embobinado',
                    title: 'SISTEMA DE EMBOBINADO',
                    type: 'matrix_status',
                    columns: [
                        { id: 'param', label: 'PARÁMETRO TÉCNICO', type: 'readonly' },
                        { id: 'metodo', label: 'MÉTODO', type: 'readonly' },
                        { id: 'estado', label: 'ESTADO', type: 'select' },
                        { id: 'obs', label: 'OBSERVACIONES', type: 'text' }
                    ],
                    rows: [
                        { id: 'r21', label: 'Estado de rodillo bobinador', param: 'Giro uniforme', metodo: 'Observación' },
                        { id: 'r22', label: 'Estado de rodillo desbobinador', param: 'Giro libre', metodo: 'Observación' },
                        { id: 'r23', label: 'Estado de polines', param: 'Rodamiento libre', metodo: 'Inspección manual' }
                    ]
                }
            ]
        };

        const templateName = 'RUTINA DE INSPECCION GENERAL - Rebobinadora';

        // Check if exists
        const checkResult = await db.query(
            'SELECT id FROM checklist_templates WHERE name = $1',
            [templateName]
        );

        if (checkResult.rows.length > 0) {
            console.log('Template already exists. Updating JSON definition...');
            await db.query(`
                UPDATE checklist_templates
                SET items = $1
                WHERE name = $2
            `, [JSON.stringify(items), templateName]);
            console.log('Template updated successfully.');
        } else {
            console.log('Inserting new template...');
            await db.query(`
                INSERT INTO checklist_templates (name, asset_category, layout, items)
                VALUES ($1, $2, $3, $4)
            `, [templateName, 'REBOBINADO', 'sml2_matrix', JSON.stringify(items)]);
            console.log('Template inserted successfully.');
        }

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        process.exit(0);
    }
}

seedRebobinadoraChecklist();
