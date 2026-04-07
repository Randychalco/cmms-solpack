const { StandardTask, Machine } = require('./src/models');

const seedSML1Tasks = async () => {
    try {
        console.log('--- Iniciando Poblamiento de Tareas SML 1 ---');
        
        const machines = await Machine.findAll();
        console.log(`Buscando SML 1 entre ${machines.length} máquinas...`);
        
        // Buscamos específicamente el equipo SML 01 (o similar)
        const sml1 = machines.find(m => m.name.toUpperCase().includes('SML 1') || m.name.toUpperCase() === 'SML 1' || m.name.toUpperCase() === 'SML 01');
        
        if (!sml1) {
            console.log('ERROR: No se encontró el equipo SML 1 en la base de datos.');
            return;
        }

        const tasks = [
            // Limpieza (RC)
            { code: 'RC-01', desc: 'LIMPIEZA DE FILTRO DE AGUA DE LA EXTRUSORA' },
            { code: 'RC-02', desc: 'LIMPIEZA DE FILTRO DE AGUA DEL CONTEINER PRINCIPAL' },
            { code: 'RC-03', desc: 'LIMPIEZA DE TABLERO ELÉCTRICO' },
            { code: 'RC-05', desc: 'LIMPIEZA Y PRUEBA DEL FUNCIONAMIENTO ÓPTIMO DE LA BARRA ESTÁTICA (SISTEMA DE CORTE)' },
            { code: 'RC-09', desc: 'LIMPIEZA DE CIRCUITO ELECTRONICO' },
            { code: 'RC-12', desc: 'LIMPIEZA DE TUBERIA DE ABASTECIMIENTO DE EXTRUSORA (PEGAMENTO)' },
            // Inspección (RI)
            { code: 'RI-02', desc: 'INSPECCIÓN DE RODAMIENTOS CON ESTETOSCOPIO' },
            { code: 'RI-05', desc: 'INSPECCIÓN MECÁNICA DE TRANSMISIÓN' },
            // Lubricación (RL)
            { code: 'RL-01', desc: 'LUBRICACIÓN EN LA ZONA DE WINDER' },
            { code: 'RL-02', desc: 'LUBRICACIÓN DE MOTORES DE EXTRUSORAS' },
            { code: 'RL-03', desc: 'LUBRICACIÓN DE FAJAS' },
            // Mantenimiento (MP)
            { code: 'MP-03', desc: 'MANTENIMIENTO SCANNER DE NDC' },
            { code: 'MP-04', desc: 'MANTENIMIENTO DEL SISTEMA GRANULADOR' },
            // Granular (GR)
            { code: 'GR-05', desc: 'CAMBIO DE MESA VIBRACIONAL' }
        ];

        console.log(`Cargando ${tasks.length} tareas para SML 1 (ID: ${sml1.id})...`);

        for (const t of tasks) {
            await StandardTask.findOrCreate({
                where: {
                    machine_id: sml1.id,
                    task_code: t.code,
                    task_description: t.desc
                }
            });
        }

        console.log('--- Proceso de SML 1 Finalizado ---');
    } catch (err) {
        console.error('ERROR EN SEEDER SML 1:', err);
    }
};

seedSML1Tasks().then(() => process.exit(0));
