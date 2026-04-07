const { Plant, Area, Machine, SubMachine } = require('./src/models');
require('dotenv').config();

async function removeHeaders() {
    try {
        const headers = ['PLANTA', 'AREA', 'EQUIPO', 'SUB-EQUIPO', 'Planta', 'Area', 'Equipo', 'Sub-Equipo'];

        const plants = await Plant.destroy({ where: { name: headers } });
        console.log(`Deleted ${plants} header Plants.`);

        const areas = await Area.destroy({ where: { name: headers } });
        console.log(`Deleted ${areas} header Areas.`);

        const machines = await Machine.destroy({ where: { name: headers } });
        console.log(`Deleted ${machines} header Machines.`);

        const subMachines = await SubMachine.destroy({ where: { name: headers } });
        console.log(`Deleted ${subMachines} header SubMachines.`);

    } catch (error) {
        console.error('Cleanup failed:', error);
    } finally {
        process.exit();
    }
}

removeHeaders();
