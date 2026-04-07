const { StandardTask, Machine } = require('./src/models');

const seedStandardTasks = async () => {
    try {
        console.log('--- Iniciando Seeder de Tareas Estándar ---');
        
        // Buscamos máquinas para asociar tareas (Ejemplo: EREMA, REBOBINADORA, etc)
        const machines = await Machine.findAll();
        
        if (machines.length === 0) {
            console.log('No hay máquinas en la base de datos. Abortando seeder.');
            return;
        }

        const taskLibrary = [
            {
                machineKeywords: ['EREMA', 'P 02', 'PELETIZADORA'],
                tasks: [
                    { code: 'MEC', desc: 'Limpieza de filtros de aire de motores de vacío' },
                    { code: 'MEC', desc: 'Inspección de desgaste en husillo y barril' },
                    { code: 'MEC', desc: 'Revisión y ajuste de correas de transmisión' },
                    { code: 'ELE', desc: 'Verificación de conexiones en tablero de potencia' },
                    { code: 'ELE', desc: 'Prueba de funcionamiento de resistencias de calefacción' },
                    { code: 'LUB', desc: 'Lubricación de rodamientos de motor principal' },
                    { code: 'LIM', desc: 'Limpieza general de zona de corte' }
                ]
            },
            {
                machineKeywords: ['STRETCH', 'REBOBINADORA'],
                tasks: [
                    { code: 'MEC', desc: 'Ajuste y alineación de cuchillas de corte' },
                    { code: 'MEC', desc: 'Verificación de rodillos guía (giro libre)' },
                    { code: 'ELE', desc: 'Calibración de sensor de tensión de banda' },
                    { code: 'ELE', desc: 'Limpieza de sensores ópticos de seguridad' },
                    { code: 'LUB', desc: 'Lubricación de guías lineales y husillos' }
                ]
            },
            {
                machineKeywords: ['LAVADORA', 'FRICCION'],
                tasks: [
                    { code: 'MEC', desc: 'Inspección de paletas de fricción' },
                    { code: 'MEC', desc: 'Revisión de sellos mecánicos de bomba' },
                    { code: 'ELE', desc: 'Medición de amperaje de motor de lavado' },
                    { code: 'LIM', desc: 'Limpieza de rejillas de filtrado de agua' }
                ]
            }
        ];

        let addedCount = 0;

        for (const machine of machines) {
            const mName = machine.name.toUpperCase();
            
            // Buscar si hay tareas definidas para este tipo de máquina
            const category = taskLibrary.find(cat => 
                cat.machineKeywords.some(key => mName.includes(key))
            );

            if (category) {
                console.log(`Asignando ${category.tasks.length} tareas a: ${machine.name}`);
                for (const t of category.tasks) {
                    await StandardTask.findOrCreate({
                        where: {
                            machine_id: machine.id,
                            task_code: t.code,
                            task_description: t.desc
                        }
                    });
                    addedCount++;
                }
            } else {
                // Tareas genéricas por defecto si no hay match
                const genericTasks = [
                    { code: 'MEC', desc: 'Inspección visual técnica' },
                    { code: 'ELE', desc: 'Prueba de mandos y parada de emergencia' },
                    { code: 'LUB', desc: 'Engrase de puntos críticos' }
                ];
                for (const t of genericTasks) {
                    await StandardTask.findOrCreate({
                        where: {
                            machine_id: machine.id,
                            task_code: t.code,
                            task_description: t.desc
                        }
                    });
                    addedCount++;
                }
            }
        }

        console.log(`--- Seeder Finalizado: ${addedCount} tareas procesadas ---`);
    } catch (error) {
        console.error('Error en seeder:', error);
    }
};

if (require.main === module) {
    seedStandardTasks().then(() => process.exit(0));
}

module.exports = seedStandardTasks;
