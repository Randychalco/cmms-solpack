const { Plant, Area, Machine, SubMachine, ChecklistTemplate, StandardTask } = require('./src/models');
const sequelize = require('./src/config/sequelize');

async function inspect() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connection has been established successfully.');

        const plants = await Plant.count();
        const areas = await Area.count();
        const machines = await Machine.count();
        const subMachines = await SubMachine.count();
        const templates = await ChecklistTemplate.count();
        const tasks = await StandardTask.count();

        console.log('--- LOCAL DATA COUNTS ---');
        console.log({
            plants,
            areas,
            machines,
            subMachines,
            templates,
            tasks
        });

        if (plants === 0) {
            console.log('⚠️ No plants found in database.');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Unable to connect to the database:', error);
        process.exit(1);
    }
}

inspect();
