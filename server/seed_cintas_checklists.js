const db = require('./src/config/db');

async function seedCintasChecklists() {
    try {
        console.log('Seeding Cintas Checklists...');

        const columns = [
            { id: 'param', label: 'PARÁMETRO TÉCNICO', type: 'readonly' },
            { id: 'metodo', label: 'MÉTODO', type: 'readonly' },
            { id: 'estado', label: 'ESTADO', type: 'select' },
            { id: 'obs', label: 'OBSERVACIONES', type: 'text' }
        ];

        const safetySection = {
            id: 'seguridad_operativa',
            title: '⚠️ SEGURIDAD OPERATIVA',
            type: 'matrix_status',
            columns: columns,
            rows: [
                { id: 'estado_guardas', label: 'Estado de guardas', param: 'Fijación', metodo: 'Inspección visual' },
                { id: 'paro_emergencia', label: 'Prueba de paro de emergencia', param: 'Funcionamiento', metodo: 'Prueba funcional' }
            ]
        };

        const templates = [
            {
                name: 'Checklist Impresoras de Cinta',
                category: 'CINTAS_IMPRESORAS',
                rows: [
                    { id: 'c1', label: 'Verificar tensión de cinta', param: 'Tensión', metodo: 'Inspección manual' },
                    { id: 'c2', label: 'Verificar temperatura de sellado (°C)', param: 'Temperatura', metodo: 'Sensor/Visual' },
                    { id: 'c3', label: 'Revisar rodillos de impresión', param: 'Integridad', metodo: 'Inspección visual' },
                    { id: 'c4', label: 'Verificar tinta / ribbon', param: 'Nivel/Estado', metodo: 'Inspección visual' },
                    { id: 'c5', label: 'Limpiar cabezal de impresión', param: 'Limpieza', metodo: 'Inspección visual' },
                    { id: 'c6', label: 'Verificar alineación de cinta', param: 'Alineación', metodo: 'Observación' },
                    { id: 'c7', label: 'Revisar sistema de avance', param: 'Sincronía', metodo: 'Observación' },
                    { id: 'c8', label: 'Verificar calidad de impresión', param: 'Nitidez', metodo: 'Inspección visual' },
                    { id: 'c9', label: 'Revisar presión de rodillos (bar)', param: 'Presión', metodo: 'Manómetro' }
                ]
            },
            {
                name: 'Checklist Cortadoras de Cinta',
                category: 'CINTAS_CORTADORAS',
                rows: [
                    { id: 'cr1', label: 'Verificar filo de cuchillas', param: 'Filo', metodo: 'Inspección visual' },
                    { id: 'cr2', label: 'Verificar alineación de corte', param: 'Precisión', metodo: 'Medición' },
                    { id: 'cr3', label: 'Revisar sistema de arrastre', param: 'Tracción', metodo: 'Observación' },
                    { id: 'cr4', label: 'Verificar tensión de cinta de entrada', param: 'Tensión', metodo: 'Inspección manual' },
                    { id: 'cr5', label: 'Limpiar zona de corte', param: 'Limpieza', metodo: 'Inspección visual' },
                    { id: 'cr6', label: 'Verificar ancho de corte (mm)', param: 'Medida', metodo: 'Calibrador' },
                    { id: 'cr7', label: 'Revisar sistema neumático (psi)', param: 'Presión', metodo: 'Manómetro' },
                    { id: 'cr8', label: 'Verificar rebobinado de cinta cortada', param: 'Uniformidad', metodo: 'Observación' },
                    { id: 'cr9', label: 'Revisar cojinetes y rodamientos', param: 'Estado', metodo: 'Inspección visual' }
                ]
            }
        ];

        for (const t of templates) {
            const checklistItems = {
                version: '1.0',
                sections: [
                    safetySection,
                    {
                        id: 'inspeccion_general',
                        title: 'INSPECCION GENERAL',
                        type: 'matrix_status',
                        columns: columns,
                        rows: t.rows
                    }
                ]
            };

            const existing = await db.query('SELECT id FROM checklist_templates WHERE name = $1', [t.name]);

            if (existing.rows.length > 0) {
                console.log(`- Updating template: '${t.name}'`);
                await db.query(
                    'UPDATE checklist_templates SET items = $1, asset_category = $2, layout = $3 WHERE name = $4',
                    [JSON.stringify(checklistItems), t.category, 'sml2_matrix', t.name]
                );
            } else {
                console.log(`- Creating template: '${t.name}'`);
                await db.query(
                    'INSERT INTO checklist_templates (name, asset_category, layout, items) VALUES ($1, $2, $3, $4)',
                    [t.name, t.category, 'sml2_matrix', JSON.stringify(checklistItems)]
                );
            }
        }

        console.log('\nSuccessfully seeded CINTAS checklists.');
        process.exit(0);

    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
}

seedCintasChecklists();
