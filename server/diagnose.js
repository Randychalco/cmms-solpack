const { sequelize, Plant, Area, Machine, SubMachine } = require('./src/models');
require('dotenv').config();

async function diagnose() {
    try {
        await sequelize.authenticate();
        console.log('Conexión BD OK');

        const pCount = await Plant.count();
        const aCount = await Area.count();
        const mCount = await Machine.count();
        const sCount = await SubMachine.count();

        console.log({
            Plants: pCount,
            Areas: aCount,
            Machines: mCount,
            SubMachines: sCount
        });

        if (sCount > 0) {
            const sample = await SubMachine.findOne({
                include: [{ model: Machine, include: [{ model: Area, include: [Plant] }] }]
            });
            console.log('Sample Hierarchy:', JSON.stringify(sample, null, 2));
        }

    } catch (error) {
        console.error('DIAGNOSE ERROR:', error);
    } finally {
        process.exit();
    }
}

diagnose();
