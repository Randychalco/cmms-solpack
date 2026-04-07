const sequelize = require('./src/config/sequelize');

const runSync = async () => {
    try {
        console.log('--- Inicia Creación Manual de Tabla ---');
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS standard_tasks (
                id SERIAL PRIMARY KEY,
                machine_id INTEGER,
                task_code VARCHAR(255),
                task_description TEXT,
                "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);
        console.log('Tabla creada/verificada.');

        const tasks = [
            ['RC-01', 'LIMPIEZA DE FILTRO DE AGUA DE LA EXTRUSORA'],
            ['RC-02', 'LIMPIEZA DE FILTRO DE AGUA DEL CONTEINER PRINCIPAL'],
            ['RC-03', 'LIMPIEZA DE TABLERO ELÉCTRICO'],
            ['RC-05', 'LIMPIEZA Y PRUEBA DE LA BARRA ESTÁTICA'],
            ['RC-09', 'LIMPIEZA DE CIRCUITO ELECTRONICO'],
            ['RC-12', 'LIMPIEZA DE TUBERIA DE ABASTECIMIENTO'],
            ['RI-02', 'INSPECCIÓN DE RODAMIENTOS'],
            ['RI-05', 'INSPECCIÓN MECÁNICA DE TRANSMISIÓN'],
            ['RL-01', 'LUBRICACIÓN EN LA ZONA DE WINDER'],
            ['RL-02', 'LUBRICACIÓN DE MOTORES DE EXTRUSORAS'],
            ['RL-03', 'LUBRICACIÓN DE FAJAS'],
            ['MP-03', 'MANTENIMIENTO SCANNER DE NDC'],
            ['MP-04', 'MANTENIMIENTO DEL SISTEMA GRANULADOR'],
            ['GR-05', 'CAMBIO DE MESA VIBRACIONAL']
        ];

        console.log('Poblando SML 1 (ID 2)...');
        for (const [code, desc] of tasks) {
            await sequelize.query(
                'INSERT INTO standard_tasks (machine_id, task_code, task_description) VALUES (?, ?, ?)',
                { replacements: [2, code, desc] }
            );
        }
        console.log('--- TODO LISTO ---');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

runSync();
