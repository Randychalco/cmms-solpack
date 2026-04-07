const { Plant } = require('./src/models');
require('dotenv').config();

async function listPlants() {
    try {
        const plants = await Plant.findAll();
        console.log('Plants found:', plants.map(p => p.name));
    } catch (error) {
        console.error(error);
    } finally {
        process.exit();
    }
}

listPlants();
