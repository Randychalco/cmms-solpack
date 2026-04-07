const { ChecklistTemplate } = require('./src/models');

async function seedCortadoraChecklists() {
    try {
        console.log('Seeding Cortadora Checklists (Webtec 1 & 2) using Sequelize...');

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
                    title: 'SEGURIDAD OPERATIVA',
                    type: 'matrix_status',
                    columns: columns,
                    rows: [
                        { id: 'estado_guardas', label: 'Estado de guardas', param: 'Fijación', metodo: 'Inspección visual' },
                        { id: 'paro_emergencia', label: 'Prueba de paro de emergencia', param: 'Funcionamiento', metodo: 'Prueba funcional' },
                        { id: 'trabador_bobina', label: 'Trabador de tapa de bobina (cubierta acústica)', param: 'Fijación', metodo: 'Inspección manual' }
                    ]
                },
                {
                    id: 'controlador_digital',
                    title: 'CONTROLADOR DIGITAL HMI',
                    type: 'matrix_status',
                    columns: columns,
                    rows: [
                        { id: 'estado_pantalla', label: 'Estado físico óptimo de la pantalla', param: 'Integridad', metodo: 'Inspección visual' }
                    ]
                },
                {
                    id: 'neumatica',
                    title: 'NEUMATICA',
                    type: 'matrix_status',
                    columns: columns,
                    rows: [
                        { id: 'eje_cargado', label: 'Funcionamiento óptimo de eje cargado de tubo', param: 'Presión', metodo: 'Inspección operativa' },
                        { id: 'fugas_aire', label: 'Verificar si existen fugas de aire', param: 'Hermeticidad', metodo: 'Inspección visual' },
                        { id: 'unidad_mantenimiento', label: 'Verificar la unidad de mantenimiento (FRL)', param: 'Lubricación', metodo: 'Inspección visual' },
                        { id: 'freno_neumatico', label: 'Verificar freno neumático', param: 'Funcionamiento', metodo: 'Prueba funcional' }
                    ]
                },
                {
                    id: 'sistema_electrico',
                    title: 'SISTEMA ELECTRICO',
                    type: 'matrix_status',
                    columns: columns,
                    rows: [
                        { id: 'insp_pulsadores', label: 'Pulsadores, selectores, reguladores y LEDs', param: 'Integridad', metodo: 'Inspección visual' },
                        { id: 'insp_motores', label: 'Inspección visual de motores', param: 'Condición', metodo: 'Inspección visual' },
                        { id: 'insp_tablero', label: 'Inspección visual del tablero eléctrico', param: 'Orden', metodo: 'Inspección visual' }
                    ]
                },
                {
                    id: 'sistema_mecanico',
                    title: 'SISTEMA MECANICO',
                    type: 'matrix_status',
                    columns: columns,
                    rows: [
                        { id: 'transmision_fajas', label: 'Sistema de transmisión de fajas y templadores', param: 'Tensión', metodo: 'Inspección manual' },
                        { id: 'transmision_cadena', label: 'Sistema de transmisión de cadena', param: 'Lubricación', metodo: 'Inspección visual' },
                        { id: 'sistema_corte', label: 'Sistema de corte', param: 'Desgaste', metodo: 'Inspección visual' },
                        { id: 'ejes_bobinado', label: 'Sistema de ejes de bobinado', param: 'Alineación', metodo: 'Inspección visual' },
                        { id: 'cubierta_acustica', label: 'Cubierta acústica', param: 'Fijación', metodo: 'Inspección visual' }
                    ]
                },
                {
                    id: 'sistema_hidraulico',
                    title: 'SISTEMA HIDRAULICO',
                    type: 'matrix_status',
                    columns: columns,
                    rows: [
                        { id: 'brazo_hidraulico', label: 'Brazo hidráulico de la cubierta acústica', param: 'Funcionamiento', metodo: 'Prueba funcional' }
                    ]
                }
            ]
        };

        const machines = ['Webtec 1', 'Webtec 2'];

        for (const machine of machines) {
            const templateName = `RUTINA DE INSPECCION GENERAL - Cortadora ${machine}`;

            const [template, created] = await ChecklistTemplate.findOrCreate({
                where: { name: templateName },
                defaults: {
                    asset_category: 'CINTAS_CORTADORAS',
                    layout: 'sml2_matrix',
                    items: checklistItems
                }
            });

            if (!created) {
                console.log(`- Template '${templateName}' already exists. Updating...`);
                await template.update({
                    items: checklistItems,
                    layout: 'sml2_matrix',
                    asset_category: 'CINTAS_CORTADORAS'
                });
            } else {
                console.log(`- Created template: '${templateName}'`);
            }
        }

        console.log('\nSuccessfully seeded all CORTADORAS DE CINTA checklists.');
        process.exit(0);

    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
}

seedCortadoraChecklists();
