const { Plant } = require('./src/models');
const { Op } = require('sequelize');
require('dotenv').config();

async function cleanupPlants() {
    try {
        const allowed = ['STRETCH', 'RECICLAJE'];
        const result = await Plant.destroy({
            where: {
                name: {
                    [Op.notIn]: allowed
                }
            }
        });
        console.log(`Deleted ${result} unauthorized plants.`);

        const remaining = await Plant.findAll();
        console.log('Remaining Plants:', remaining.map(p => p.name));

    } catch (error) {
        console.error('Cleanup failed:', error);
    } finally {
        process.exit();
    }
}

cleanupPlants();
