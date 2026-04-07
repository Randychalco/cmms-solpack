const { Plant, Area } = require('./src/models');
require('dotenv').config();

async function debugAreas() {
    try {
        const plants = await Plant.findAll();
        console.log('--- Plants ---');
        plants.forEach(p => console.log(`ID: ${p.id}, Name: ${p.name}`));

        if (plants.length > 0) {
            const firstPlant = plants[0];
            console.log(`\nChecking Areas for Plant ID: ${firstPlant.id} (${firstPlant.name})`);

            const areas = await Area.findAll({ where: { plantId: firstPlant.id } });
            console.log(`Found ${areas.length} areas.`);
            areas.forEach(a => console.log(`  - ID: ${a.id}, Name: ${a.name}`));
        } else {
            console.log('No plants found.');
        }

    } catch (error) {
        console.error('Debug failed:', error);
    } finally {
        process.exit();
    }
}

debugAreas();
