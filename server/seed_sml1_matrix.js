const { ChecklistTemplate } = require('./src/models');

const sml1MatrixConfig = {
    sections: [
        {
            title: 'SEGURIDAD OPERATIVA',
            type: 'matrix_status',
            columns: [
                { id: 'param', label: 'PARÁMETRO TÉCNICO', type: 'readonly' },
                { id: 'metodo', label: 'MÉTODO', type: 'readonly' },
                { id: 'estado', label: 'ESTADO', type: 'select' },
                { id: 'obs', label: 'OBSERVACIONES', type: 'text' }
            ],
            rows: [
                { id: 'estado_guardas', label: 'Estado de guardas', param: 'Fijación', metodo: 'Inspección visual' },
                { id: 'paro_emergencia', label: 'Prueba de paro de emergencia', param: 'Funcionamiento', metodo: 'Prueba funcional' },
                { id: 'sensores_cortina', label: 'Sensores y cortina de luz', param: 'Detección', metodo: 'Prueba funcional' },
                { id: 'seguridad_bloqueo', label: 'Interruptor de seguridad de bloqueo', param: 'Funcionamiento', metodo: 'Prueba funcional' }
            ]
        },
        {
            title: 'Fluidos y Presiones',
            type: 'matrix_numeric',
            rows: [
                { id: 'presion_agua', label: 'Presión del Agua', nominal: '2 - 4 bar' },
                { id: 'presion_aire', label: 'Presión Aire Gravimétrico', nominal: '5 - 6 bar' },
                { id: 'presion_calor', label: 'Presión Intercambiador Calor', nominal: '2 - 3 bar' }
            ],
            columns: [
                { id: 'ext_c', label: 'Ext. C' },
                { id: 'ext_d', label: 'Ext. D' },
                { id: 'ext_a', label: 'Ext. A' },
                { id: 'ext_b', label: 'Ext. B' },
                { id: 'ext_e', label: 'Ext. E' },
                { id: 'ext_f', label: 'Ext. F' }
            ]
        },
        {
            title: 'Temperatura de motores y reductores',
            type: 'matrix_temp',
            rows: [
                { id: 'ext_c', label: 'Extrusora C', rangeMotor: '40-70 °C', rangeReduc: '50-80 °C' },
                { id: 'ext_d', label: 'Extrusora D', rangeMotor: '40-90 °C', rangeReduc: '50-80 °C' },
                { id: 'ext_a', label: 'Extrusora A', rangeMotor: '40-70 °C', rangeReduc: '50-80 °C' },
                { id: 'ext_b', label: 'Extrusora B', rangeMotor: '40-90 °C', rangeReduc: '50-80 °C' },
                { id: 'ext_e', label: 'Extrusora E', rangeMotor: '40-70 °C', rangeReduc: '50-80 °C' },
                { id: 'ext_f', label: 'Extrusora F', rangeMotor: '40-70 °C', rangeReduc: '50-80 °C' },
                { id: 'chill_roll_1', label: 'Chill Roll 1', rangeMotor: '25-40 °C', rangeReduc: '30-70 °C' },
                { id: 'chill_roll_2', label: 'Chill Roll 2', rangeMotor: '25-40 °C', rangeReduc: '30-70 °C' }
            ]
        },
        {
            title: 'Temperatura de Chill Roll',
            type: 'single_numeric',
            items: [
                { id: 'temp_agua_c1', label: 'Temperatura agua enfriamiento (C1)', nominal: '21 - 24 °C', unit: '°C' },
                { id: 'temp_agua_c2', label: 'Temperatura agua enfriamiento (C2)', nominal: '21 - 24 °C', unit: '°C' }
            ]
        },
        {
            title: 'Extrusoras',
            type: 'matrix_status',
            rows: [
                { id: 'nivel_aceite', label: 'Nivel de Aceite en caja reductora' },
                { id: 'estado_fisico_ext', label: 'Estado físico general y cableado' }
            ],
            columns: [
                { id: 'ext_c', label: 'Ext. C' },
                { id: 'ext_d', label: 'Ext. D' },
                { id: 'ext_a', label: 'Ext. A' },
                { id: 'ext_b', label: 'Ext. B' },
                { id: 'ext_e', label: 'Ext. E' },
                { id: 'ext_f', label: 'Ext. F' }
            ]
        },
        {
            title: 'Cabezal y Mangueras',
            type: 'matrix_status',
            columns: [
                { id: 'param', label: 'PARÁMETRO TÉCNICO', type: 'readonly' },
                { id: 'metodo', label: 'MÉTODO', type: 'readonly' },
                { id: 'estado', label: 'ESTADO', type: 'select' },
                { id: 'obs', label: 'OBSERVACIONES', type: 'text' }
            ],
            rows: [
                { id: 'estado_cabezal', label: 'Estado óptimo temperatura de cabezal', param: 'Temperatura', metodo: 'HMI' },
                { id: 'manguera_vacuum', label: 'Mangueras de vacuum', param: 'Hermeticidad', metodo: 'Inspección visual' },
                { id: 'estado_scanner', label: 'Fuga de material', param: 'Estanqueidad', metodo: 'Observación' },
                { id: 'potencia_succion', label: 'Potencia de succión correcta', param: 'Presión de vacío', metodo: 'Lectura de vacuómetro' },
                { id: 'altura_vacuum', label: 'Altura de vacuum adecuada', param: 'Nivel de vacío', metodo: 'Observación' }
            ]
        },
        {
            title: 'Chill Roll',
            type: 'matrix_status',
            rows: [
                { id: 'estado_cr_principal', label: 'Estado físico del Rodillo Principal' },
                { id: 'estado_faja_transmision', label: 'Estado físico de la faja de transmisión' }
            ],
            columns: [
                { id: 'cr_1', label: 'Chill Roll 1' },
                { id: 'cr_2', label: 'Chill Roll 2' }
            ]
        },
        {
            title: 'Winders',
            type: 'matrix_status',
            rows: [
                { id: 'rodillos_contacto', label: 'Estado rodillo de contacto, auxiliar y bobinador' },
                { id: 'estado_polines', label: 'Estado de los polines (Máquina parada)' },
                { id: 'faja_desplazamiento', label: 'Estado de la faja de desplazamiento' },
                { id: 'sensor_tubos', label: 'Estado del sensor de tubos' }
            ],
            columns: [
                { id: 'winder_a', label: 'Winder A' },
                { id: 'winder_b', label: 'Winder B' }
            ]
        },
        {
            title: 'Scanner 8000 TDi',
            type: 'matrix_status',
            columns: [
                { id: 'param', label: 'PARÁMETRO TÉCNICO', type: 'readonly' },
                { id: 'metodo', label: 'MÉTODO', type: 'readonly' },
                { id: 'estado', label: 'ESTADO', type: 'select' },
                { id: 'obs', label: 'OBSERVACIONES', type: 'text' }
            ],
            rows: [
                { id: 'scanner_posicion_base', label: 'La posición base es la correcta', param: 'Posicionamiento', metodo: 'Inspección visual' },
                { id: 'scanner_estado_fajas_1', label: 'Estado de fajas (Faja 1)', param: 'Tensión', metodo: 'Inspección manual' },
                { id: 'scanner_estado_fajas_2', label: 'Estado de fajas (Faja 2)', param: 'Tensión', metodo: 'Inspección manual' },
                { id: 'scanner_estado_polea', label: 'Estado de polea', param: 'Desgaste', metodo: 'Inspección visual' },
                { id: 'scanner_alineacion_cabezal', label: 'Alineación de cabezal', param: 'Alineación', metodo: 'Observación' }
            ]
        }
    ]
};

async function run() {
    try {
        const [template, created] = await ChecklistTemplate.findOrCreate({
            where: { name: 'SML 1' },
            defaults: {
                asset_category: 'EXTRUSION_2_SML1',
                layout: 'sml2_matrix',
                items: sml1MatrixConfig
            }
        });

        if (!created) {
            console.log('✅ Plantilla SML 1 matricial ACTUALIZADA con éxito');
            await template.update({
                items: sml1MatrixConfig,
                layout: 'sml2_matrix',
                asset_category: 'EXTRUSION_2_SML1'
            });
        } else {
            console.log('✅ Nueva Plantilla SML 1 matricial CREADA con éxito');
        }
    } catch (e) {
        console.error('Error insertando o actualizando SML 1 Matrix:', e.message);
    }
}
run();
