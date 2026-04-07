const { Area, Plant } = require('./src/models');
const sequelize = require('./src/config/sequelize');

async function createAreas() {
    try {
        await sequelize.authenticate();
        console.log('Connected to database');

        // Get both plants
        const plants = await Plant.findAll();
        console.log(`Found ${plants.length} plants`);

        // List of all required areas
        const areaNames = [
            'CINTAS',
            'EXTRUSION',
            'PREESTIRADO',
            'REBOBINADO',
            'LINEA BEIER',
            'PELETIZADOR',
            'PTAR',
            'SER',
            'AUX STRETCH',
            'SERV',
            'AUX RECICLAJE'
        ];

        for (const plant of plants) {
            console.log(`\nProcessing plant: ${plant.name} (ID: ${plant.id})`);

            for (const areaName of areaNames) {
                // Check if area already exists for this plant
                const existing = await Area.findOne({
                    where: {
                        name: areaName,
                        plantId: plant.id
                    }
                });

                if (existing) {
                    console.log(`  ✓ Area "${areaName}" already exists`);
                } else {
                    // Create the area
                    await Area.create({
                        name: areaName,
                        plantId: plant.id
                    });
                    console.log(`  + Created area "${areaName}"`);
                }
            }
        }

        console.log('\n✅ All areas have been processed!');
        await sequelize.close();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

createAreas();
