const { StandardTask, Machine } = require('./src/models');

const seedTechnicalTasks = async () => {
    try {
        console.log('--- Iniciando Sincronización Técnica ---');
        
        const machines = await Machine.findAll();
        console.log(`Máquinas encontradas: ${machines.length}`);

        const catalogue = [
            {
                keywords: ['EREMA', 'P 02', 'PELETIZADORA'],
                tasks: [
                    ['MEC', 'Revisión técnica de husillo y barril (Desgaste)'],
                    ['MEC', 'Ajuste de cuchillas de granulador'],
                    ['ELE', 'Mantenimiento de resistencias cerámicas'],
                    ['LUB', 'Engrase de rodamientos de motor principal'],
                    ['LIM', 'Limpieza de filtros de vacío']
                ]
            },
            {
                keywords: ['REBOBINADORA', 'CORTE'],
                tasks: [
                    ['MEC', 'Alineación de cuchillas circulares'],
                    ['MEC', 'Inspección de rodillos de tracción'],
                    ['ELE', 'Calibración de frenos electromagnéticos'],
                    ['LUB', 'Lubricación de guías de desplazamiento']
                ]
            },
            {
                keywords: ['LAVADORA', 'FRICCION'],
                tasks: [
                    ['MEC', 'Ajuste de paletas de acero inoxidable'],
                    ['ELE', 'Inspección de motores con variador'],
                    ['LIM', 'Limpieza de tamices de salida']
                ]
            }
        ];

        for (const m of machines) {
            const match = catalogue.find(c => c.keywords.some(k => m.name.toUpperCase().includes(k)));
            const tasksToUse = match ? match.tasks : [['MEC', 'Inspección visual técnica'], ['ELE', 'Prueba de controles']];
            
            console.log(`Poblando: ${m.name} (${tasksToUse.length} tareas)`);
            
            for (const [code, desc] of tasksToUse) {
                await StandardTask.findOrCreate({
                    where: {
                        machine_id: m.id,
                        task_code: code,
                        task_description: desc
                    }
                });
            }
        }

        console.log('--- Proceso Completo con Éxito ---');
    } catch (err) {
        console.error('ERROR SEEDING:', err);
    }
};

seedTechnicalTasks().then(() => process.exit(0));
