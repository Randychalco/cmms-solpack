const sequelize = require('./src/config/sequelize');

const runMassiveSeed = async () => {
    try {
        console.log('--- INICIANDO CARGA MASIVA DE PROTOCOLOS ---');

        const protocols = [
            // STRETCH (SML 1 & SML 2) - IDs 2, 3
            {
                machineIds: [2, 3],
                tasks: [
                    { code: 'RC-01', desc: 'LIMPIEZA DE FILTRO DE AGUA DE LA EXTRUSORA' },
                    { code: 'RC-02', desc: 'LIMPIEZA DE FILTRO DE AGUA DEL CONTEINER PRINCIPAL' },
                    { code: 'RC-03', desc: 'LIMPIEZA DE TABLERO ELÉCTRICO' },
                    { code: 'RC-05', desc: 'LIMPIEZA Y PRUEBA DE LA BARRA ESTÁTICA' },
                    { code: 'RC-09', desc: 'LIMPIEZA DE CIRCUITO ELECTRONICO' },
                    { code: 'RC-12', desc: 'LIMPIEZA DE TUBERIA DE ABASTECIMIENTO' },
                    { code: 'RI-02', desc: 'INSPECCIÓN DE RODAMIENTOS CON ESTETOSCOPIO' },
                    { code: 'RI-05', desc: 'INSPECCIÓN MECÁNICA DE TRANSMISIÓN' },
                    { code: 'RL-01', desc: 'LUBRICACIÓN EN LA ZONA DE WINDER' },
                    { code: 'RL-02', desc: 'LUBRICACIÓN DE MOTORES DE EXTRUSORAS' },
                    { code: 'RL-03', desc: 'LUBRICACIÓN DE FAJAS' },
                    { code: 'MP-03', desc: 'MANTENIMIENTO SCANNER DE NDC' },
                    { code: 'MP-04', desc: 'MANTENIMIENTO DEL SISTEMA GRANULADOR' },
                    { code: 'GR-05', desc: 'CAMBIO DE MESA VIBRACIONAL' }
                ]
            },
            // RECICLAJE (EREMA 1 & EREMA 2) - IDs 51, 52
            {
                machineIds: [51, 52],
                tasks: [
                    { code: 'RC-01', desc: 'LIMPIEZA DE FILTRO DE AGUA RECICLAJE' },
                    { code: 'RC-03', desc: 'LIMPIEZA DE TABLERO ELÉCTRICO EREMA' },
                    { code: 'RI-02', desc: 'INSPECCIÓN DE CUCHILLAS DEL COMPACTADOR' },
                    { code: 'RI-05', desc: 'INSPECCIÓN DE CORREAS DE TRANSMISIÓN' },
                    { code: 'RI-08', desc: 'INSPECCIÓN DE BOMBAS DE VACÍO' },
                    { code: 'RL-01', desc: 'LUBRICACIÓN DE RODAMIENTOS COMPACTADOR' },
                    { code: 'RL-02', desc: 'LUBRICACIÓN DE MOTORES PRINCIPALES' },
                    { code: 'MP-01', desc: 'MANTENIMIENTO DE BOMBA DE AGUA' }
                ]
            },
            // REBOBINADORAS (R 01 - R 06) - IDs 4, 5, 6, 7, 8, 9
            {
                machineIds: [4, 5, 6, 7, 8, 9],
                tasks: [
                    { code: 'RC-01', desc: 'LIMPIEZA DE RODILLOS DE PRESIÓN' },
                    { code: 'RC-02', desc: 'LIMPIEZA DE SENSORES DE BORDE' },
                    { code: 'RI-01', desc: 'INSPECCIÓN DE ALINEADORES NEUMÁTICOS' },
                    { code: 'RI-03', desc: 'INSPECCIÓN DE CUCHILLAS DE CORTE' },
                    { code: 'RL-01', desc: 'LUBRICACIÓN DE EJES Y GUÍAS' },
                    { code: 'RL-02', desc: 'LUBRICACIÓN DE CADENAS DE TRANSMISIÓN' }
                ]
            },
            // LAVADO (TINAS Y LAVADORAS FRICCION) - IDs 39, 40, 41, 42
            {
                machineIds: [39, 40, 41, 42],
                tasks: [
                    { code: 'RC-01', desc: 'LIMPIEZA DE CRIBAS Y MALLAS' },
                    { code: 'RI-02', desc: 'INSPECCIÓN DE PALETAS DE LAVADO' },
                    { code: 'RI-04', desc: 'INSPECCIÓN DE RODAMIENTOS TINA' },
                    { code: 'RL-03', desc: 'LUBRICACIÓN DE MOTORES DE AGITACIÓN' },
                    { code: 'MP-02', desc: 'MANTENIMIENTO DE BOMBAS DE RECIRCULACIÓN' }
                ]
            },
            // CHILLERS Y COMPRESORES - IDs 70, 71, 72, 73, 74
            {
                machineIds: [70, 71, 72, 73, 74],
                tasks: [
                    { code: 'RC-01', desc: 'LIMPIEZA DE CONDENSADORES' },
                    { code: 'RC-02', desc: 'LIMPIEZA DE FILTROS DE AIRE' },
                    { code: 'RI-01', desc: 'INSPECCIÓN DE PRESIONES DE TRABAJO' },
                    { code: 'RI-03', desc: 'INSPECCIÓN DE NIVELES DE ACEITE' },
                    { code: 'RL-01', desc: 'LUBRICACIÓN DE VENTILADORES' },
                    { code: 'MP-05', desc: 'VERIFICACIÓN DE FUGAS DE REFRIGERANTE' }
                ]
            }
        ];

        for (const p of protocols) {
            for (const mid of p.machineIds) {
                console.log(`Cargando protocolo para Máquina ID ${mid}...`);
                for (const t of p.tasks) {
                    await sequelize.query(
                        'INSERT INTO standard_tasks (machine_id, task_code, task_description) VALUES (?, ?, ?) ON CONFLICT DO NOTHING',
                        { replacements: [mid, t.code, t.desc] }
                    );
                }
            }
        }

        console.log('--- CARGA MASIVA FINALIZADA CON ÉXITO ---');
        process.exit(0);
    } catch (err) {
        console.error('ERROR EN CARGA MASIVA:', err);
        process.exit(1);
    }
};

runMassiveSeed();
