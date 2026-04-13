const { Area, Machine, SubMachine, Plant } = require('./src/models');
const sequelize = require('./src/config/sequelize');

async function testQueries() {
    try {
        await sequelize.authenticate();
        console.log('✅ DB Connected');

        // Test Area query (simulating GET /api/master/areas?plantId=1)
        const plant = await Plant.findOne();
        if (plant) {
            console.log(`Testing with Plant ID: ${plant.id} (${plant.name})`);
            const areas = await Area.findAll({
                where: { plant_id: plant.id }
            });
            console.log(`Areas found for Plant ID ${plant.id}: ${areas.length}`);
            if (areas.length > 0) {
                const area = areas[0];
                console.log(`Testing with Area ID: ${area.id} (${area.name})`);
                
                // Test Machine query (simulating GET /api/master/machines/:areaId)
                const machines = await Machine.findAll({
                    where: { area_id: area.id }
                });
                console.log(`Machines found for Area ID ${area.id}: ${machines.length}`);
                
                if (machines.length > 0) {
                    const machine = machines[0];
                    console.log(`Testing with Machine ID: ${machine.id} (${machine.name})`);
                    
                    // Test SubMachine query (simulating GET /api/master/sub-machines/:machineId)
                    const subMachines = await SubMachine.findAll({
                        where: { machine_id: machine.id }
                    });
                    console.log(`Sub-machines found for Machine ID ${machine.id}: ${subMachines.length}`);
                }
            }
        } else {
            console.log('❌ No plants found');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

testQueries();
