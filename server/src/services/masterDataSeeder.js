const AppSheetService = require('./appSheetService');
const { Plant, Area, Machine, SubMachine } = require('../models');

const MasterDataSeeder = {
    async seedFromAppSheet() {
        console.log('Starting Master Data Sync from AppSheet...');

        try {
            // 1. Fetch all OTs to get the unique combinations of Plant/Area/Machine
            const rawData = await AppSheetService.getTableData('Orden de Trabajo');
            console.log(`Fetched ${rawData.length} rows from AppSheet.`);

            let stats = {
                plants: 0,
                areas: 0,
                machines: 0,
                subMachines: 0
            };

            for (const row of rawData) {
                // Extract fields
                const plantName = row['PLANTA'] ? row['PLANTA'].trim() : null;
                const areaName = row['AREA'] ? row['AREA'].trim() : null;
                const machineName = row['EQUIPO'] ? row['EQUIPO'].trim() : null;
                const subMachineName = row['SUB-EQUIPO'] ? row['SUB-EQUIPO'].trim() : null;

                if (!plantName) continue;

                // 2. Sync Plant
                const [plant, createdPlant] = await Plant.findOrCreate({
                    where: { name: plantName }
                });
                if (createdPlant) stats.plants++;

                // 3. Sync Area (if exists)
                if (areaName) {
                    const [area, createdArea] = await Area.findOrCreate({
                        where: { name: areaName, plantId: plant.id }
                    });
                    if (createdArea) stats.areas++;

                    // 4. Sync Machine (if exists)
                    if (machineName) {
                        const [machine, createdMachine] = await Machine.findOrCreate({
                            where: { name: machineName, areaId: area.id }
                        });
                        if (createdMachine) stats.machines++;

                        // 5. Sync SubMachine (if exists)
                        if (subMachineName) {
                            const [sub, createdSub] = await SubMachine.findOrCreate({
                                where: { name: subMachineName, machineId: machine.id }
                            });
                            if (createdSub) stats.subMachines++;
                        }
                    }
                }
            }

            console.log('Master Data Sync Complete.');
            console.log('New Records Created:', stats);
            return { success: true, stats };

        } catch (error) {
            console.error('Error seeding master data:', error);
            return { success: false, error: error.message };
        }
    }
};

module.exports = MasterDataSeeder;
