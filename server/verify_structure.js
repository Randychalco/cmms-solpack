const { Plant, Area, Machine, SubMachine } = require('./src/models');
require('dotenv').config();

async function verifyStructure() {
    try {
        const plants = await Plant.findAll({
            include: [{
                model: Area,
                include: [{
                    model: Machine,
                    include: [SubMachine]
                }]
            }]
        });

        console.log('--- Verification Report ---');
        console.log(`Total Plants: ${plants.length}`);

        for (const p of plants) {
            console.log(`\nPlant: ${p.name}`);
            console.log(`  Areas: ${p.Areas.length}`);

            let machineCount = 0;
            let subMachineCount = 0;

            for (const a of p.Areas) {
                machineCount += a.Machines.length;
                for (const m of a.Machines) {
                    subMachineCount += m.SubMachines.length;
                }
            }
            console.log(`  Total Teams (Machines): ${machineCount}`);
            console.log(`  Total Sub-Teams: ${subMachineCount}`);
        }

    } catch (error) {
        console.error('Verification failed:', error);
    } finally {
        process.exit();
    }
}

verifyStructure();
