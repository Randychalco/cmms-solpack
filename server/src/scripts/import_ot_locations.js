const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { sequelize, Plant, Area, Machine, SubMachine } = require('../models');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function importLocations() {
    const transaction = await sequelize.transaction();
    try {
        const filePath = path.join(__dirname, '../../../OT ubicacion del equipo.xlsx');
        console.log(`Reading file: ${filePath}`);

        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }

        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        console.log(`Found ${data.length} rows (including potential headers)`);

        let count = 0;
        // Skip header if it exists (assuming first row might be header if it contains 'Planta' etc, checking row 0)
        // Based on previous analysis, row 0 was [ 'STRETCH', 'EXTRUSION', 'SML 1', 'EREMA' ] which looks like data, 
        // but let's check if the user added headers or if it's pure data.
        // The user verified the file. Let's assume valid data starts at row 0 or 1. 
        // We'll iterate and check values.

        for (const row of data) {
            // Structure: Plant | Area | Machine | SubMachine
            const plantName = row[0]?.toString().trim();
            const areaName = row[1]?.toString().trim();
            const machineName = row[2]?.toString().trim();
            const subMachineName = row[3]?.toString().trim();

            if (!plantName) continue; // Skip empty rows

            // 1. Plant
            const [plant] = await Plant.findOrCreate({
                where: { name: plantName },
                defaults: { name: plantName },
                transaction
            });

            // 2. Area
            let area = null;
            if (areaName) {
                [area] = await Area.findOrCreate({
                    where: { name: areaName, plantId: plant.id },
                    defaults: { name: areaName, plantId: plant.id },
                    transaction
                });
            }

            // 3. Machine
            let machine = null;
            if (machineName && area) {
                [machine] = await Machine.findOrCreate({
                    where: { name: machineName, areaId: area.id },
                    defaults: { name: machineName, areaId: area.id },
                    transaction
                });
            }

            // 4. SubMachine
            if (subMachineName && machine) {
                await SubMachine.findOrCreate({
                    where: { name: subMachineName, machineId: machine.id },
                    defaults: { name: subMachineName, machineId: machine.id },
                    transaction
                });
            }

            count++;
            if (count % 10 === 0) console.log(`Processed ${count} rows...`);
        }

        await transaction.commit();
        console.log('Import completed successfully!');
        process.exit(0);

    } catch (error) {
        await transaction.rollback();
        console.error('Import failed:', error);
        process.exit(1);
    }
}

importLocations();
