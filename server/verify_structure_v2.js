const { Plant, Area, Machine, SubMachine } = require('./src/models');
require('dotenv').config();

async function verifyStructure() {
    try {
        const plants = await Plant.findAll();

        console.log('--- Verification Report ---');
        console.log(`Total Plants: ${plants.length}`);

        for (const p of plants) {
            console.log(`\nPlant: ${p.name}`);

            const areaCount = await Area.count({ where: { plantId: p.id } });
            console.log(`  Areas: ${areaCount}`);

            const areas = await Area.findAll({ where: { plantId: p.id } });
            let machineCount = 0;
            let subMachineCount = 0;

            for (const a of areas) {
                const machines = await Machine.findAll({ where: { areaId: a.id } });
                machineCount += machines.length;

                for (const m of machines) {
                    const subCount = await SubMachine.count({ where: { machineId: m.id } });
                    subMachineCount += subCount;
                }
            }
            console.log(`  Total Machines: ${machineCount}`);
            console.log(`  Total Sub-Machines: ${subMachineCount}`);
        }

    } catch (error) {
        console.error('Verification failed:', error);
    } finally {
        process.exit();
    }
}

verifyStructure();
